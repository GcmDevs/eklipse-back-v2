import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import {
  RhAlertaOrm,
  RhRegistroEquipoOrm,
  RhRegistroHabitacionOrm,
  RhRondaOrm,
} from '@inn/orm/inn/rondas-habitaciones';
import { In, Like } from 'typeorm';
import { UsuarioOrm } from '@inn/orm/gen';
import { INN_AUTHORITIES } from '@inn/authorities';

const EQUIPOS = [
  'TV',
  'DECODIFICADOR',
  'CONTROL_TV',
  'CONTROL_DECODIFICADOR',
  'LLAMADO_ENFERMERIA',
  'CABLES',
  'TABLET',
];
const ESTADOS = ['BUENO', 'AVERIADO', 'FALTANTE'];
type Equipo = { tipoEquipo: string; estado: string; observacion?: string };

@Injectable()
export class RondasHabitacionesService extends BaseSource {
  private async esAdministrador(): Promise<boolean> {
    return this.hasAnyAuthority([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR]);
  }
  private async validarAccesoRonda(id: number): Promise<RhRondaOrm> {
    const ronda = await this.conn.getRepository(RhRondaOrm).findOneBy({ id });
    if (!ronda) throw new Error('Ronda no encontrada.');
    if (!(await this.esAdministrador()) && Number(ronda.responsableId) !== Number(this.auth.id))
      throw new Error('Solo puede consultar la ronda que tiene asignada.');
    return ronda;
  }
  private async validarAccesoSede(sedeId: number): Promise<void> {
    if (await this.esAdministrador()) return;
    const asignada = await this.conn.getRepository(RhRondaOrm).findOne({
      where: { sedeId, responsableId: Number(this.auth.id), estado: 'EN_PROGRESO' },
    });
    if (!asignada) throw new Error('No tiene una ronda activa asignada para esta sede.');
  }
  async sedes() {
    return this.conn.query(
      `SELECT OID AS id, ACANOMBRE AS nombre FROM ADNCENATE ORDER BY ACANOMBRE`
    );
  }
  async usuarios(pattern = '') {
    const users = await this.conn
      .getRepository(UsuarioOrm)
      .find({
        where: { nombreCompleto: Like(`%${pattern.trim()}%`) },
        take: 20,
        order: { nombreCompleto: 'ASC' },
      });
    return users.map(user => ({ id: user.id, nombre: user.nombreCompleto, cedula: user.cedula }));
  }
  async habitaciones(sedeId: number) {
    if (!sedeId) throw new Error('Debe indicar la sede.');
    await this.validarAccesoSede(sedeId);
    return this.conn.query(
      `SELECT HPNDEFCAM.OID AS id, HPNDEFCAM.HCACODIGO AS codigo, HPNDEFCAM.HCANUMHABI AS numero, HPNDEFCAM.HPNSUBGRU AS servicioId, HPNSUBGRU.HSUNOMBRE AS servicioNombre, ADNCENATE.ACANOMBRE AS sedeNombre FROM HPNDEFCAM LEFT JOIN HPNSUBGRU ON HPNDEFCAM.HPNSUBGRU = HPNSUBGRU.OID LEFT JOIN ADNCENATE ON HPNDEFCAM.ADNCENATE = ADNCENATE.OID WHERE HPNDEFCAM.HCAESTADO IN (1,2,4,5) AND HPNDEFCAM.HCANOMBRE = 'HOSPITALIZACION' AND HPNDEFCAM.HCANUMHABI NOT LIKE '%TEMP%' AND HPNDEFCAM.ADNCENATE = @0 ORDER BY HPNSUBGRU.HSUNOMBRE, HPNDEFCAM.HCANUMHABI`,
      [sedeId]
    );
  }
  async rondas() {
    const where = (await this.esAdministrador()) ? {} : { responsableId: Number(this.auth.id) };
    return this.conn.getRepository(RhRondaOrm).find({ where, order: { anio: 'DESC', semana: 'DESC' } });
  }
  async actual() {
    const where = (await this.esAdministrador())
      ? { estado: 'EN_PROGRESO' as const }
      : { estado: 'EN_PROGRESO' as const, responsableId: Number(this.auth.id) };
    return this.conn.getRepository(RhRondaOrm).findOne({ where });
  }
  async obtenerRonda(id: number) {
    return this.validarAccesoRonda(id);
  }
  async crearRonda(body: any) {
    if (!(await this.esAdministrador())) throw new Error('Solo un administrador puede crear y asignar rondas.');
    const sedeId = Number(body.sedeId);
    if (!sedeId || !body.responsableId)
      throw new Error('La sede y el responsable son obligatorios.');
    const rp = this.conn.getRepository(RhRondaOrm);
    const exists = await rp.findOne({
      where: {
        sedeId,
        semana: Number(body.semana),
        anio: Number(body.anio),
        estado: 'EN_PROGRESO',
      },
    });
    if (exists) throw new Error('Ya existe una ronda en progreso para esta sede, semana y año.');
    const total = (await this.habitaciones(sedeId)).length;
    if (!total)
      throw new Error('No hay habitaciones activas de Hospitalización para la sede seleccionada.');
    const now = new Date();
    return rp.save(
      rp.create({
        ...body,
        sedeId,
        semana: Number(body.semana),
        anio: Number(body.anio),
        fechaInicio: new Date(body.fechaInicio),
        estado: 'EN_PROGRESO',
        totalHabitaciones: total,
        habitacionesRegistradas: 0,
        creadoPor: this.auth.id,
        fechaCreacion: now,
        fechaActualizacion: now,
      })
    );
  }
  async registros(rondaId: number) {
    await this.validarAccesoRonda(rondaId);
    return this.cargarRegistros(rondaId);
  }
  private async cargarRegistros(rondaId: number) {
    const rows = await this.conn
      .getRepository(RhRegistroHabitacionOrm)
      .find({ where: { rondaId }, order: { habitacionId: 'ASC' } });
    const equipos = await this.conn.getRepository(RhRegistroEquipoOrm).find();
    return rows.map(r => ({
      ...r,
      equipos: equipos
        .filter(e => e.registroHabitacionId === r.id)
        .map(({ tipoEquipo, estado, observacion }) => ({ tipoEquipo, estado, observacion })),
    }));
  }
  async guardarRegistro(rondaId: number, habitacionId: number, body: any) {
    const ronda = await this.obtenerRonda(rondaId);
    if (ronda.estado !== 'EN_PROGRESO')
      throw new Error('Una ronda completada no puede modificarse.');
    const equipos: Equipo[] = body.equipos ?? [];
    if (
      equipos.length !== EQUIPOS.length ||
      EQUIPOS.some(tipo => equipos.filter(e => e.tipoEquipo === tipo).length !== 1) ||
      equipos.some(e => !ESTADOS.includes(e.estado))
    )
      throw new Error('Debe registrar exactamente los siete equipos con un estado válido.');
    const habitacion = (await this.habitaciones(ronda.sedeId)).find(
      (item: any) => Number(item.id) === habitacionId
    );
    if (!habitacion)
      throw new Error(
        'La habitación no pertenece a la sede ni al conjunto de Hospitalización de esta ronda.'
      );
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const registros = this.qr.manager.getRepository(RhRegistroHabitacionOrm);
      const equipoRp = this.qr.manager.getRepository(RhRegistroEquipoOrm);
      let registro = await registros.findOne({ where: { rondaId, habitacionId } });
      const existed = !!registro;
      if (!registro)
        registro = registros.create({
          rondaId,
          habitacionId,
          servicioId: Number(habitacion.servicioId),
          registradoPor: this.auth.id,
        });
      Object.assign(registro, {
        observaciones: body.observaciones?.trim() || null,
        fechaRegistro: new Date(),
      });
      registro = await registros.save(registro);
      if (existed) await equipoRp.delete({ registroHabitacionId: registro.id });
      await equipoRp.save(
        equipos.map(e =>
          equipoRp.create({
            ...e,
            registroHabitacionId: registro.id,
            observacion: e.observacion?.trim() || null,
          })
        )
      );
      if (!existed) {
        ronda.habitacionesRegistradas += 1;
        ronda.fechaActualizacion = new Date();
        await this.qr.manager.getRepository(RhRondaOrm).save(ronda);
      }
      await this.qr.commitTransaction();
      return { ...registro, equipos };
    } catch (e) {
      await this.qr.rollbackTransaction();
      throw e;
    } finally {
      await this.qr.release();
    }
  }
  async completar(id: number) {
    const ronda = await this.obtenerRonda(id);
    if (ronda.estado !== 'EN_PROGRESO') throw new Error('La ronda ya está completada.');
    if (ronda.habitacionesRegistradas < ronda.totalHabitaciones)
      throw new Error('Existen habitaciones pendientes por registrar.');
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      ronda.estado = 'COMPLETADA';
      ronda.fechaFinalizacion = new Date();
      ronda.fechaActualizacion = new Date();
      await this.qr.manager.getRepository(RhRondaOrm).save(ronda);
      await this.generarAlertas(ronda.id, this.qr.manager);
      await this.qr.commitTransaction();
      return ronda;
    } catch (e) {
      await this.qr.rollbackTransaction();
      throw e;
    } finally {
      await this.qr.release();
    }
  }
  private async generarAlertas(rondaId: number, manager: any) {
    const actual = await manager.getRepository(RhRondaOrm).findOneBy({ id: rondaId });
    const anterior = await manager
      .getRepository(RhRondaOrm)
      .createQueryBuilder('r')
      .where(
        'r.ESTADO = :estado AND r.ADNCENATE = :sedeId AND (r.ANIO < :anio OR (r.ANIO = :anio AND r.SEMANA < :semana))',
        { estado: 'COMPLETADA', sedeId: actual.sedeId, anio: actual.anio, semana: actual.semana }
      )
      .orderBy('r.ANIO', 'DESC')
      .addOrderBy('r.SEMANA', 'DESC')
      .getOne();
    if (!anterior) return;
    const regs = await this.cargarRegistros(rondaId);
    const prev = await this.cargarRegistros(anterior.id);
    const alertRp = manager.getRepository(RhAlertaOrm);
    for (const reg of regs) {
      const old = prev.find(x => x.habitacionId === reg.habitacionId);
      if (!old) continue;
      for (const equipo of reg.equipos) {
        const before = old.equipos.find(e => e.tipoEquipo === equipo.tipoEquipo)?.estado;
        const tipo =
          before === 'FALTANTE' && equipo.estado === 'FALTANTE'
            ? 'PERSISTE_FALTANTE'
            : (before === 'BUENO' && ['AVERIADO', 'FALTANTE'].includes(equipo.estado)) ||
                (before === 'AVERIADO' && equipo.estado === 'FALTANTE')
              ? 'EMPEORO'
              : null;
        if (tipo)
          await alertRp.save(
            alertRp.create({
              rondaId,
              habitacionId: reg.habitacionId,
              tipoEquipo: equipo.tipoEquipo,
              estadoAnterior: before,
              estadoActual: equipo.estado,
              tipoAlerta: tipo,
              resuelta: false,
              fechaGeneracion: new Date(),
            })
          );
      }
    }
  }
  async alertas(filters: any) {
    const where: any = {};
    if (filters.resuelta != null) where.resuelta = String(filters.resuelta) === 'true';
    if (filters.tipoEquipo) where.tipoEquipo = filters.tipoEquipo;
    if (filters.tipoAlerta) where.tipoAlerta = filters.tipoAlerta;
    const rows = await this.conn.getRepository(RhAlertaOrm).find({ where, order: { fechaGeneracion: 'DESC' } });
    if (await this.esAdministrador()) return rows;
    const asignadas = await this.conn.getRepository(RhRondaOrm).find({
      where: { responsableId: Number(this.auth.id) },
      select: { id: true },
    });
    const rondaIds = new Set(asignadas.map(ronda => ronda.id));
    return rows.filter(alerta => rondaIds.has(alerta.rondaId));
  }
  async resolverAlerta(id: number, observacionResolucion: string) {
    if (!(await this.esAdministrador())) throw new Error('Solo un administrador puede resolver alertas.');
    if (!observacionResolucion?.trim())
      throw new Error('La observación de resolución es obligatoria.');
    const rp = this.conn.getRepository(RhAlertaOrm);
    const item = await rp.findOneBy({ id });
    if (!item) throw new Error('Alerta no encontrada.');
    if (item.resuelta) throw new Error('La alerta ya fue resuelta.');
    Object.assign(item, {
      resuelta: true,
      fechaResolucion: new Date(),
      resueltaPor: this.auth.id,
      observacionResolucion: observacionResolucion.trim(),
    });
    return rp.save(item);
  }
  async dashboard() {
    const rondaActual = await this.actual();
    const esAdministrador = await this.esAdministrador();
    const rondasVisibles = esAdministrador
      ? await this.conn.getRepository(RhRondaOrm).find({ select: { id: true } })
      : await this.conn.getRepository(RhRondaOrm).find({ where: { responsableId: Number(this.auth.id) }, select: { id: true } });
    const rondaIds = rondasVisibles.map(ronda => ronda.id);
    const [rondasCompletadas, alertasPendientes, registros] = await Promise.all([
      this.conn.getRepository(RhRondaOrm).count({ where: esAdministrador ? { estado: 'COMPLETADA' } : { estado: 'COMPLETADA', responsableId: Number(this.auth.id) } }),
      this.conn.getRepository(RhAlertaOrm).find({ where: { resuelta: false } }),
      rondaIds.length ? this.conn.getRepository(RhRegistroHabitacionOrm).find({ where: { rondaId: In(rondaIds) } }) : [],
    ]);
    const registroIds = new Set(registros.map(registro => registro.id));
    const equiposRegistrados = registroIds.size
      ? await this.conn.getRepository(RhRegistroEquipoOrm).find({ where: { registroHabitacionId: In([...registroIds]) } })
      : [];
    const habitacionesActivas = rondaActual
      ? (await this.habitaciones(rondaActual.sedeId)).length
      : 0;
    const distribucion = { BUENO: 0, AVERIADO: 0, FALTANTE: 0 };
    const by = Object.fromEntries(
      EQUIPOS.map(tipoEquipo => [tipoEquipo, { tipoEquipo, bueno: 0, averiado: 0, faltante: 0 }])
    );
    equiposRegistrados.forEach(e => {
      distribucion[e.estado]++;
      if (e.estado === 'BUENO') by[e.tipoEquipo].bueno++;
      if (e.estado === 'AVERIADO') by[e.tipoEquipo].averiado++;
      if (e.estado === 'FALTANTE') by[e.tipoEquipo].faltante++;
    });
    return {
      habitacionesActivas,
      rondaActual,
      rondasCompletadas,
      alertasPendientes: esAdministrador ? alertasPendientes.length : alertasPendientes.filter(alerta => rondaIds.includes(alerta.rondaId)).length,
      equiposAveriados: distribucion.AVERIADO,
      equiposFaltantes: distribucion.FALTANTE,
      distribucion,
      porEquipo: Object.values(by),
      tendencia: [],
    };
  }
}

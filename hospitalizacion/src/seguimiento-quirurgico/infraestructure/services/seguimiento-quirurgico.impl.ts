import { BaseSource } from '@common/infrastructure/services';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { CambiarEstadoCirugiaDto } from '../../presentation/dto/cambiar-estado-cirugia.dto';
import { AgrupadorSalaQuirurgicaOrm, AgrupadorSalasQuirurgicasOrm, AsignacionQuirofanoUsuarioOrm, EstadoCirugiaOrm, HistorialEstadoCirugiaOrm, SeguimientoCirugiaOrm } from '../orm';

@Injectable()
export class SeguimientoQuirurgicoImpl extends BaseSource {
  async agrupadoresSalas() {
    const qr = this.dynamicQR(this.auth.context);
    try {
      const agrupadores = await qr.manager.getRepository(AgrupadorSalasQuirurgicasOrm).find({
        where: { activo: true },
        relations: { salas: true },
        order: { nombre: 'ASC' },
      });
      return agrupadores.map(agrupador => ({
        id: agrupador.id,
        nombre: agrupador.nombre,
        salas: agrupador.salas.map(sala => sala.salaQx),
      }));
    } finally { await qr.release(); }
  }
  async crearAgrupadorSalas(datos: { nombre: string; salas: string[] }) {
    const nombre = datos.nombre?.trim();
    const salas = [...new Set((datos.salas ?? []).map(sala => sala.trim()).filter(Boolean))];
    if (!nombre) throw new ConflictException('Debe indicar el nombre de la especialidad.');
    if (!salas.length) throw new ConflictException('Debe seleccionar al menos una sala.');
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect(); await qr.startTransaction();
    try {
      const agrupadores = qr.manager.getRepository(AgrupadorSalasQuirurgicasOrm);
      const salasRepo = qr.manager.getRepository(AgrupadorSalaQuirurgicaOrm);
      const existente = await agrupadores.findOne({ where: { nombre } });
      if (existente) throw new ConflictException('Ya existe un agrupador con este nombre.');
      const agrupador = await agrupadores.save(agrupadores.create({ nombre, activo: true }));
      await salasRepo.save(salas.map(salaQx => salasRepo.create({ agrupadorId: agrupador.id, salaQx })));
      await qr.commitTransaction();
      return { id: agrupador.id, nombre: agrupador.nombre, salas };
    } catch (error) {
      if (qr.isTransactionActive) await qr.rollbackTransaction();
      throw error;
    } finally { await qr.release(); }
  }
  async actualizarAgrupadorSalas(id: number, datos: { nombre: string; salas: string[] }) {
    const nombre = datos.nombre?.trim();
    const salas = [...new Set((datos.salas ?? []).map(sala => sala.trim()).filter(Boolean))];
    if (!nombre) throw new ConflictException('Debe indicar el nombre de la especialidad.');
    if (!salas.length) throw new ConflictException('Debe seleccionar al menos una sala.');
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect(); await qr.startTransaction();
    try {
      const agrupadores = qr.manager.getRepository(AgrupadorSalasQuirurgicasOrm);
      const salasRepo = qr.manager.getRepository(AgrupadorSalaQuirurgicaOrm);
      const agrupador = await agrupadores.findOne({ where: { id, activo: true } });
      if (!agrupador) throw new NotFoundException('No existe el agrupador de salas.');
      const conMismoNombre = await agrupadores.findOne({ where: { nombre } });
      if (conMismoNombre && conMismoNombre.id !== id) {
        throw new ConflictException('Ya existe un agrupador con este nombre.');
      }
      agrupador.nombre = nombre;
      await agrupadores.save(agrupador);
      await salasRepo.delete({ agrupadorId: id });
      await salasRepo.save(salas.map(salaQx => salasRepo.create({ agrupadorId: id, salaQx })));
      await qr.commitTransaction();
      return { id: agrupador.id, nombre: agrupador.nombre, salas };
    } catch (error) {
      if (qr.isTransactionActive) await qr.rollbackTransaction();
      throw error;
    } finally { await qr.release(); }
  }
  async asignacionesUsuario(usuarioDocumento: string) {
    const qr = this.dynamicQR(this.auth.context);
    try {
      return await qr.manager.getRepository(AsignacionQuirofanoUsuarioOrm).find({
        where: { usuarioDocumento, activo: true },
        order: { esPredeterminado: 'DESC', salaQx: 'ASC' },
      });
    } finally { await qr.release(); }
  }
  async guardarAsignacionesUsuario(
    usuarioDocumentoRuta: string,
    datos: { salaQx: string; usuarioDocumento?: string },
  ) {
    const usuarioDocumento = datos.usuarioDocumento?.trim() || usuarioDocumentoRuta.trim();
    if (!usuarioDocumento) throw new ConflictException('Debe indicar el documento del usuario.');
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect(); await qr.startTransaction();
    try {
      const repo = qr.manager.getRepository(AsignacionQuirofanoUsuarioOrm);
      await repo.update({ usuarioDocumento }, { activo: false, esPredeterminado: false });
      const salaQx = datos.salaQx.trim();
      let asignacion = await repo.findOne({ where: { usuarioDocumento, salaQx } });
      asignacion = asignacion ?? repo.create({ usuarioDocumento, salaQx });
      asignacion.activo = true;
      asignacion.esPredeterminado = true;
      await repo.save(asignacion);
      await qr.commitTransaction();
      return await repo.find({ where: { usuarioDocumento, activo: true } });
    } catch (error) {
      if (qr.isTransactionActive) {
        try {
          await qr.rollbackTransaction();
        } catch {
          // SQL Server puede abortar la transacción antes de que TypeORM solicite el rollback.
        }
      }
      throw error;
    } finally { await qr.release(); }
  }
  async estados() {
    const qr = this.dynamicQR(this.auth.context);
    try {
      return await qr.manager
        .getRepository(EstadoCirugiaOrm)
        .find({ where: { activo: true }, order: { orden: 'ASC' } });
    } finally {
      await qr.release();
    }
  }
  async cirugias(quirofanoId?: string) {
    const qr = this.dynamicQR(this.auth.context);
    try {
      const [cirugias, alertasActivas] = await Promise.all([
        this.obtenerCirugias(qr, quirofanoId),
        this.obtenerAlertasActivas(qr),
      ]);
      return cirugias.map((cirugia: any) => ({
        ...cirugia,
        alertaActiva: alertasActivas.get(cirugia.id),
      }));
    } finally {
      await qr.release();
    }
  }
  async quirofanos() {
    const qr = this.dynamicQR(this.auth.context);
    try {
      return await qr.query(
        `SELECT LTRIM(RTRIM(SALCODIGO)) id, LTRIM(RTRIM(SALCODIGO)) codigo, SALNOMBRE nombre, CAST(1 AS bit) activo FROM PCNSALAS WHERE SALCODIGO IS NOT NULL ORDER BY SALNOMBRE`,
      );
    } finally {
      await qr.release();
    }
  }
  async publicas() {
    const qr = this.dynamicQR(this.auth.context);
    try {
      const [cirugias, alertasActivas] = await Promise.all([
        this.obtenerCirugias(qr),
        this.obtenerAlertasActivas(qr),
      ]);
      return cirugias
        .filter(
          (item: any) =>
            !['PROGRAMADO', 'SALIDA_PACIENTE', 'CIRUGIA_SUSPENDIDA'].includes(
              item.estadoActual.codigo,
            ),
        )
        .map((item: any) => {
          const alertaActiva = alertasActivas.get(item.id);
          return {
            id: item.id,
            sede: item.sede,
            identificadorPublico: item.identificadorPublico,
            nombrePublico: this.enmascararNombre(item.paciente.nombreCompleto),
            estadoActual: item.estadoActual,
            fechaActualizacion: item.fechaActualizacion,
            eventoActual: alertaActiva,
          };
        });
    } finally {
      await qr.release();
    }
  }
  private enmascararNombre(nombre: string): string {
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .map((parte) => `${parte.charAt(0).toUpperCase()}.`)
      .join(' ');
  }
  private async obtenerAlertasActivas(qr: QueryRunner) {
    const [estados, historial] = await Promise.all([
      qr.manager.getRepository(EstadoCirugiaOrm).find({ where: { activo: true } }),
      qr.manager
        .getRepository(HistorialEstadoCirugiaOrm)
        .find({ order: { fechaHora: 'DESC' } }),
    ]);
    const eventos = new Map(
      estados
        .filter(
          (estado) =>
            (estado.esEvento || estado.codigo === 'CIRUGIA_SUSPENDIDA') &&
            estado.codigo !== 'RETIRAR_ALERTA',
        )
        .map((estado) => [estado.codigo, estado]),
    );
    const resueltas = new Set<string>();
    const activas = new Map<string, { codigo: string; nombre: string; fechaHora: string }>();
    historial.forEach((registro) => {
      if (resueltas.has(registro.pcnConsec)) return;
      if (registro.estadoNuevo === 'RETIRAR_ALERTA') {
        resueltas.add(registro.pcnConsec);
        return;
      }
      const evento = eventos.get(registro.estadoNuevo);
      if (!evento) return;
      activas.set(registro.pcnConsec, {
        codigo: evento.codigo,
        nombre: evento.nombre,
        fechaHora: registro.fechaHora.toISOString(),
      });
      resueltas.add(registro.pcnConsec);
    });
    return activas;
  }
  async cambiarEstado(id: string, dto: CambiarEstadoCirugiaDto) {
    const qr = this.dynamicQR(this.auth.context);
    await qr.connect();
    await qr.startTransaction('SERIALIZABLE');
    try {
      const estados = await qr.manager
        .getRepository(EstadoCirugiaOrm)
        .find({ where: { activo: true }, order: { orden: 'ASC' } });
      const destino = estados.find(item => item.codigo === dto.estadoDestino);
      if (!destino) throw new NotFoundException('Estado destino no válido');
      const seguimientoRp = qr.manager.getRepository(SeguimientoCirugiaOrm);
      let seguimiento = await seguimientoRp.findOne({
        where: { pcnConsec: id },
        lock: { mode: 'pessimistic_write' },
      });
      const actual = estados.find(
        item => item.codigo === (seguimiento?.estadoActual ?? 'PROGRAMADO')
      );
      if (!actual || dto.estadoEsperado !== actual.codigo)
        throw new ConflictException('El registro fue actualizado desde otra estación.');
      if (destino.esEvento)
        throw new ConflictException('Este código debe registrarse como evento.');
      if (!destino.esAlternativo && destino.orden !== actual.orden + 1)
        throw new ConflictException('La transición de estado no es consecutiva.');
      const now = new Date();
      seguimiento =
        seguimiento ??
        seguimientoRp.create({
          pcnConsec: id,
          estadoActual: actual.codigo,
          usuarioModificacionId: this.auth.id,
          usuarioModificacionNombre: this.auth.user.fullName ?? '',
        });
      seguimiento.estadoActual = destino.codigo;
      seguimiento.usuarioModificacionId = this.auth.id;
      seguimiento.usuarioModificacionNombre = this.auth.user.fullName ?? '';
      if (destino.codigo === 'EN_PREPARACION') seguimiento.fechaInicioPreparacion = now;
      if (destino.codigo === 'INICIA_CIRUGIA') seguimiento.fechaInicioCirugia = now;
      if (destino.codigo === 'EN_SALA_RECUPERACION') seguimiento.fechaInicioRecuperacion = now;
      if (destino.codigo === 'SALIDA_PACIENTE' || destino.codigo === 'CIRUGIA_SUSPENDIDA')
        seguimiento.fechaFinalizacion = now;
      await seguimientoRp.save(seguimiento);
      await qr.manager.getRepository(HistorialEstadoCirugiaOrm).save({
        pcnConsec: id,
        estadoAnterior: actual.codigo,
        estadoNuevo: destino.codigo,
        usuarioId: this.auth.id,
        usuarioNombre: this.auth.user.fullName ?? '',
      });
      const items = await this.obtenerCirugias(qr);
      const result = items.find((item: any) => item.id === id);
      if (!result) throw new NotFoundException('Cirugía no encontrada');
      await qr.commitTransaction();
      return result;
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }
  async registrarEvento(id: string, codigoEvento: string) {
    const qr = this.dynamicQR(this.auth.context);
    try {
      const evento = await qr.manager
        .getRepository(EstadoCirugiaOrm)
        .findOne({ where: { codigo: codigoEvento, activo: true } });
      if (!evento || (!evento.esEvento && evento.codigo !== 'CIRUGIA_SUSPENDIDA')) throw new NotFoundException('Evento no válido.');
      const seguimiento = await qr.manager
        .getRepository(SeguimientoCirugiaOrm)
        .findOne({ where: { pcnConsec: id } });
      if (codigoEvento === 'RETIRAR_ALERTA') {
        const historial = await qr.manager.getRepository(HistorialEstadoCirugiaOrm).find({
          where: { pcnConsec: id },
          order: { fechaHora: 'DESC' },
        });
        const ultimoAviso = historial.find((registro) =>
          ['CIRUGIA_SUSPENDIDA', 'ACERCARSE_INFORMACION', 'ACERCARSE_FACTURACION', 'RETIRAR_ALERTA'].includes(
            registro.estadoNuevo,
          ),
        );
        if (!ultimoAviso || ultimoAviso.estadoNuevo === 'RETIRAR_ALERTA') {
          throw new ConflictException('La cirugía no tiene una alerta vigente para retirar.');
        }
      }
      await qr.manager.getRepository(HistorialEstadoCirugiaOrm).save({
        pcnConsec: id,
        estadoAnterior: seguimiento?.estadoActual ?? 'PROGRAMADO',
        estadoNuevo: evento.codigo,
        usuarioId: this.auth.id,
        usuarioNombre: this.auth.user.fullName ?? '',
      });
      return {
        id,
        evento: evento.codigo,
        estadoActual: seguimiento?.estadoActual ?? 'PROGRAMADO',
      };
    } finally {
      await qr.release();
    }
  }
  private async obtenerCirugias(qr: QueryRunner, quirofanoId?: string) {
    const rows = await qr.query(
      `SELECT
        CASE
          WHEN S.SALCODIGO LIKE 'AC%' THEN 'Clinica Alta Complejidad del Caribe'
          WHEN S.SALCODIGO LIKE 'CM%' THEN 'Clinica Medicos'
        END sede,
        CAST(CAST(P.PSCONSEC AS BIGINT) AS VARCHAR(50)) id,
        LTRIM(RTRIM(S.SALCODIGO)) salaCodigo,
        S.SALNOMBRE salaNombre,
        G.PACNUMDOC documento,
        LTRIM(RTRIM(ISNULL(G.PACPRINOM, '') + ' ' + ISNULL(G.PACSEGNOM, '') + ' ' + ISNULL(G.PACPRIAPE, '') + ' ' + ISNULL(G.PACSEGAPE, ''))) nombrePaciente,
        CASE P.PSESTADO
          WHEN 0 THEN 'PROGRAMADA'
          WHEN 1 THEN 'CUMPLIDO'
          WHEN 2 THEN 'CANCELADO'
          WHEN 3 THEN 'REPROGRAMADO'
          WHEN 4 THEN 'INCUMPLIDO'
          WHEN 5 THEN 'ANULADO'
          ELSE 'NO REGISTRADA'
        END estadoProgramacion,
        CONVERT(varchar(10), P.PSFECINP, 23) fecha,
        CONVERT(varchar(5), P.PSFECINP, 108) hora,
        ISNULL(CUPS.SIPDESCUP, '') procedimiento,
        A.AINCONSEC ingreso,
        M.GMECODIGO codigoMedico,
        ISNULL(M.GMENOMCOM, '') cirujano,
        ISNULL(E.GEEDESCRI, '') especialidad,
        ISNULL(T.ESTADOACTUAL, 'PROGRAMADO') estadoCodigo,
        ISNULL(T.UPDATEDAT, P.PSFECINP) fechaActualizacion
      FROM PCNPROSAL P
      LEFT JOIN GENPACIEN G ON G.OID = P.GENPACIEN
      LEFT JOIN ADNINGRESO A ON A.OID = P.ADNINGRESO
      LEFT JOIN PCNSALAS S ON S.OID = P.PSSALA
      LEFT JOIN PCNPSDMED PM ON PM.PCNPROSAL = P.OID AND PM.PCNMEDPRIN = 1
      LEFT JOIN GENMEDICO M ON M.OID = PM.GENMEDICO
      LEFT JOIN GENESPMED EM ON EM.MEDICOS = M.OID AND EM.GEMPRINCIPAL = 1
      LEFT JOIN GENESPECI E ON E.OID = EM.ESPECIALIDADES
      LEFT JOIN (
        SELECT PCNPROSAL, SIPDESCUP
        FROM (
          SELECT
            D.PCNPROSAL,
            I.SIPDESCUP,
            ROW_NUMBER() OVER (PARTITION BY D.PCNPROSAL ORDER BY I.OID DESC) rn
          FROM PCNPSDPRC D
          INNER JOIN GENSERIPS I ON I.OID = D.GENSERIPS
        ) procedimientos
        WHERE rn = 1
      ) CUPS ON CUPS.PCNPROSAL = P.OID
      LEFT JOIN EKHPNCIRSEG T ON T.PCNCONSEC = CAST(CAST(P.PSCONSEC AS BIGINT) AS VARCHAR(50))
      WHERE P.PSFECINP >= CONVERT(date, GETDATE())
        AND P.PSFECINP < DATEADD(day, 1, CONVERT(date, GETDATE()))
        AND P.PSESTADO IN (0, 1, 3)
        ${quirofanoId ? 'AND LTRIM(RTRIM(S.SALCODIGO)) = @0' : ''}
      ORDER BY P.PSFECINP`,
      quirofanoId ? [quirofanoId] : []
    );
    const estados = await qr.manager
      .getRepository(EstadoCirugiaOrm)
      .find({ where: { activo: true } });
    return rows.map((row: any) => {
      const estado = estados.find(item => item.codigo === row.estadoCodigo)!;
      const publico = `QX-${String(row.id).padStart(4, '0')}`;
      return {
        id: row.id,
        pcnConsec: row.id,
        sede: row.sede,
        fecha: row.fecha,
        fechaQx: row.fecha,
        horaProgramada: row.hora,
        salaQx: row.salaCodigo,
        nomSalaQx: row.salaNombre,
        pacienteId: row.documento,
        idPaciente: row.documento,
        identificadorPublico: publico,
        paciente: {
          id: row.documento,
          numeroDocumento: row.documento,
          nombreCompleto: row.nombrePaciente,
          identificadorPublico: publico,
        },
        quirofano: {
          id: row.salaCodigo,
          codigo: row.salaCodigo,
          nombre: row.salaNombre,
          activo: true,
        },
        procedimiento: row.procedimiento,
        procedimientoQx: row.procedimiento,
        especialidad: row.especialidad,
        especialidadMedico: row.especialidad,
        cirujano: row.cirujano,
        nomMedico: row.cirujano,
        codigoMedico: row.codigoMedico,
        estadoProgramacion: row.estadoProgramacion,
        estadoActual: estado,
        fechaActualizacion: row.fechaActualizacion,
        ingreso: row.ingreso,
      };
    });
  }
}

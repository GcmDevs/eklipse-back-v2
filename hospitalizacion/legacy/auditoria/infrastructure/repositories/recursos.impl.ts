import { orderBy, unionBy, uniq, uniqBy } from 'lodash';
import { Between, In, IsNull, Like } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { castDataServices, groupByKey, TimerServices } from '@common/application/services';
import {
  generoTypeFactory,
  grupoEstanciaTypeByDaysFactory,
  tipoDocumentoTypeFactory,
  TipoReingresoType,
  TIPOS_REINGRESO,
} from '@hpn/lgc/aud/types/gen';
import { BaseSource } from '@common/infrastructure/services';
import { CamaOrm, DiagnosticoOrm, EstanciaOrm, ServicioOrm } from '@hpn/lgc/aud/orm/temp';
import { IngresoOrm } from '@hpn/lgc/aud/orm/gen';
import { FolioOrm } from '@hpn/lgc/aud/orm/hcn';
import { EspecialidadOrm, MedicoOrm } from '@hpn/lgc/aud/orm/gen/medicos';
import {
  diagnosticosByIdsQuery,
  diagnosticosByIngresoQuery,
  procedimientosByIngresoQuery,
  serviciosByIdsQuery,
} from '../queries';
import { AuditoriaOrm, EkServicioIpsOrm } from '@hpn/lgc/aud/orm/hpn/auditoria';

@Injectable()
export class AuditoriaRecursosImpl extends BaseSource {
  async fetchSubgrupos() {
    const camaRp = this.conn.getRepository(CamaOrm);
    const camas = await camaRp.find({ relations: ['grupo', 'subgrupo'] });
    const subgrupos: any = [];

    const camasReduced = uniqBy(camas, 'subGrupoId');
    const camasGrouped = groupByKey(camasReduced, 'subGrupoId');

    camasGrouped.forEach(c => {
      const sg = c.rows[0].subgrupo;
      sg.grupo = c.rows[0].grupo;
      delete sg.areaServicioId;
      sg.nombreGrupo = sg.grupo.nombre;
      subgrupos.push(sg);
    });

    return subgrupos;
  }

  async fetchIngresos(pattern: string, subGrupoId: number) {
    const estanciaRp = this.conn.getRepository(EstanciaOrm);
    const ingresoRp = this.conn.getRepository(IngresoOrm);

    const estancias = await estanciaRp.find({
      where: pattern
        ? [
            {
              fechaEgreso: IsNull(),
              ingreso: { paciente: { nombreCompleto: Like(`%${pattern}%`) } },
            },
            {
              fechaEgreso: IsNull(),
              ingreso: { consecutivo: Like(`%${pattern}%`) },
            },
          ]
        : [
            {
              fechaEgreso: IsNull(),
              cama: { subGrupoId },
            },
          ],
      take: !subGrupoId ? 5 : undefined,
      order: { id: 'DESC' },
      relations: ['ingreso', 'ingreso.paciente', 'cama', 'cama.grupo', 'cama.subgrupo'],
    });

    const pacientesIds = estancias.map(e => e.ingreso.pacienteId);

    const ingresos = await ingresoRp.find({
      where: { pacienteId: In(pacientesIds) },
      order: { id: 'DESC' },
      relations: ['paciente'],
    });

    const ingresosGrouped = groupByKey(ingresos, 'pacienteId');

    ingresosGrouped.map(i => {
      i.rows = [i.rows[0], i.rows[1]];
    });

    const response = estancias.map(i => {
      const ingresos = ingresosGrouped.filter(ig => ig.key === i.ingreso.pacienteId);
      let fechaIngresoActual = new Date();
      let fechaIngresoAnterior = new Date();
      let fechaEgresoActual = new Date();
      let fechaEgresoAnterior = new Date();
      let tipoReingreso: TipoReingresoType;

      if (ingresos.length) {
        try {
          const rows = orderBy(ingresos[0].rows, 'id', 'desc');
          if (ingresos[0].rows.length > 1) {
            fechaIngresoAnterior = rows[1].fechaIngreso;
            fechaEgresoAnterior = rows[1].fechaEgreso;
          }
          fechaIngresoActual = rows[0].fechaIngreso;
          fechaEgresoActual = rows[0].fechaEgreso || new Date();

          const diffInMs = fechaIngresoActual.getTime() - fechaEgresoAnterior.getTime();
          const diffInMinutes = diffInMs / 1000 / 60;

          if (diffInMinutes < 1440) fechaIngresoActual = fechaIngresoAnterior;

          if (diffInMinutes <= 7200) {
            // 2 horas
            tipoReingreso = TIPOS_REINGRESO.CORTE_FACT;
          } else if (diffInMinutes > 7200 && diffInMinutes <= 259200) {
            // 72 horas
            tipoReingreso = TIPOS_REINGRESO.REINGR_URG;
          } else if (diffInMinutes > 259200 && diffInMinutes <= 1296000) {
            // 15 dias
            tipoReingreso = TIPOS_REINGRESO.REINGR_HOSP;
          } else {
            tipoReingreso = TIPOS_REINGRESO.INGR_NORMAL;
          }
        } catch (error: any) {}
      }

      const diasEstancia = ingresos.length
        ? Math.ceil(TimerServices.getDiffInDays(fechaIngresoActual, fechaEgresoActual))
        : null;

      return {
        id: i.ingreso.id,
        codigo: i.ingreso.consecutivo,
        nombre: i.ingreso.paciente.nombreCompleto,
        ingresos: ingresos.length ? ingresos[0].rows.filter(r => r) : null,
        agrupamientoEstancia: grupoEstanciaTypeByDaysFactory(diasEstancia),
        tipoReingreso,
        diasEstancia,
        paciente: {
          nombreCompleto: i.ingreso.paciente.nombreCompleto,
          fechaNacimiento: i.ingreso.paciente.fechaNacimiento,
          genero: generoTypeFactory(i.ingreso.paciente.generoCode),
          documento: {
            lugarExpedicion: i.ingreso.paciente.lugarExpDoc,
            numero: i.ingreso.paciente.numeroDoc,
            tipo: tipoDocumentoTypeFactory(i.ingreso.paciente.tipoDocumentoCode),
          },
        },
        cama: {
          id: i.cama.id,
          codigo: i.cama.codigo,
          nombre: i.cama.nombre,
          grupo: {
            id: i.cama.grupo.id,
            codigo: i.cama.grupo.codigo,
            nombre: i.cama.grupo.nombre,
          },
          subgrupo: {
            id: i.cama.subgrupo.id,
            codigo: i.cama.subgrupo.codigo,
            nombre: i.cama.subgrupo.nombre,
          },
        },
      };
    });

    return response;
  }

  async fetchMedicos(ingresoId: number) {
    const folioRp = this.conn.getRepository(FolioOrm);
    const folios = await folioRp.find({ where: { ingresoId }, relations: ['medico'], take: 5 });
    const medicos = unionBy(folios, 'medicoId');
    const result = medicos.map(m => {
      return {
        id: m.medico.id,
        codigo: m.medico.codigo,
        nombre: castDataServices.trim(m.medico.nombre),
      };
    });
    return result;
  }

  async fetchAllMedicos(pattern: string, especialidadId: number) {
    const especialidadRp = this.conn.getRepository(EspecialidadOrm);
    const medicoRp = this.conn.getRepository(MedicoOrm);

    const especialidades = await especialidadRp.find({
      where: { id: especialidadId },
    });

    const especialidadesIds = especialidades.map(e => e.id);

    if (especialidades.length) {
      const medicos = await medicoRp.find({
        where: [
          { codigo: Like(`%${pattern}%`), especialidadId: In(especialidadesIds) },
          { nombre: Like(`%${pattern}%`), especialidadId: In(especialidadesIds) },
        ],
      });

      const result = medicos.map(m => {
        return {
          id: m.id,
          codigo: m.codigo,
          nombre: castDataServices.trim(m.nombre),
        };
      });
      return result;
    } else {
      return [];
    }
  }

  async fetchEspecialidades(ingresoId?: number) {
    const folioRp = this.conn.getRepository(FolioOrm);
    const folios = await folioRp.find({ where: { ingresoId }, relations: ['especialidad'] });
    const especialidades = unionBy(folios, 'especialidadId');
    const result = especialidades.map(m => {
      if (m.especialidad) {
        return {
          id: m.especialidad.id,
          codigo: m.especialidad.codigo,
          nombre: castDataServices.trim(m.especialidad.nombre),
        };
      }
    });

    return result;
  }

  async fetchAllEspecialidades(pattern: string) {
    const especialidadRp = this.conn.getRepository(EspecialidadOrm);

    const especialidades = await especialidadRp.find({
      where: [{ codigo: Like(`%${pattern}%`) }, { nombre: Like(`%${pattern}%`) }],
      take: 5,
    });

    const result = especialidades.map(m => {
      return {
        id: m.id,
        codigo: m.codigo,
        nombre: castDataServices.trim(m.nombre),
      };
    });

    return result;
  }

  async fetchDiagnosticos(pattern: string) {
    const diagnosticoRp = this.conn.getRepository(DiagnosticoOrm);

    const diagnosticos = await diagnosticoRp.find({
      where: [{ codigo: Like(`%${pattern}%`) }, { nombre: Like(`%${pattern}%`) }],
      take: 5,
    });

    const result = diagnosticos.map(m => {
      return {
        id: m.id,
        codigo: m.codigo,
        nombre: castDataServices.trim(m.nombre),
      };
    });

    return result;
  }

  async fetchServiciosIps(pattern: string) {
    const servicioIpsRp = this.conn.getRepository(EkServicioIpsOrm);

    const serviciosIps = await servicioIpsRp.find({
      where: [{ codigo: Like(`%${pattern}%`) }, { nombre: Like(`%${pattern}%`) }],
      take: 5,
    });

    const result = serviciosIps.map(m => {
      return {
        id: m.id,
        codigo: m.codigo,
        nombre: castDataServices.trim(m.nombre),
      };
    });

    return result;
  }

  async fetchServicios(pattern: string) {
    const servicioRp = this.conn.getRepository(ServicioOrm);

    const servicios = await servicioRp.find({
      where: [{ codigo: Like(`%${pattern}%`) }, { nombre: Like(`%${pattern}%`) }],
      take: 5,
    });

    const result = servicios.map(m => {
      return {
        id: m.id,
        codigo: m.codigo,
        nombre: castDataServices.trim(m.nombre),
      };
    });

    return result;
  }

  async fetchDiagnosticosById(ingresoId: number, fecha?: Date) {
    let fechaInicio: Date;
    let fechaFin: Date;

    const diagnosticosIds: number[] = [];
    const serviciosIds: number[] = [];

    if (fecha) {
      fechaInicio = new Date(`${fecha}:00:00:00`);
      fechaFin = new Date(`${fecha}:23:59:59`);

      const auditoriaRp = this.conn.getRepository(AuditoriaOrm);
      const auditoria = await auditoriaRp.findOne({
        where: { fechaCreacion: Between(fechaInicio, fechaFin), ingresoId },
      });

      if (auditoria) {
        if (auditoria.diagnostico1Id) diagnosticosIds.push(auditoria.diagnostico1Id);
        if (auditoria.diagnostico2Id) diagnosticosIds.push(auditoria.diagnostico2Id);
        if (auditoria.diagnostico3Id) diagnosticosIds.push(auditoria.diagnostico3Id);
        if (auditoria.servicio1Id) serviciosIds.push(auditoria.servicio1Id);
        if (auditoria.servicio2Id) serviciosIds.push(auditoria.servicio2Id);
        if (auditoria.servicio3Id) serviciosIds.push(auditoria.servicio3Id);
      }
    }

    let diagnosticos: any[] = [];
    let procedimientos: any[] = [];

    if (!fecha) {
      diagnosticos = await this.conn.query(diagnosticosByIngresoQuery(ingresoId));
      procedimientos = await this.conn.query(procedimientosByIngresoQuery(ingresoId));
    } else {
      diagnosticos = diagnosticosIds.length
        ? await this.conn.query(diagnosticosByIdsQuery(diagnosticosIds))
        : [];
      procedimientos = serviciosIds.length
        ? await this.conn.query(serviciosByIdsQuery(serviciosIds))
        : [];
    }

    const resultDiagnosticos = diagnosticos.map(m => {
      return {
        id: m.id,
        codigo: castDataServices.trim(m.codigo),
        nombre: castDataServices.trim(m.nombre),
      };
    });

    const resultProcedimientos = procedimientos.map(m => {
      return {
        id: m.id,
        nombre: castDataServices.trim(m.nombre),
      };
    });

    const resultsDiagnosticos = [];
    const resultsProcedimientos = [];

    const groupedDiagnosticos = groupByKey(resultDiagnosticos, 'id', 'codigo');
    const groupedProcedimientos = groupByKey(resultProcedimientos, 'id', 'nombre');

    groupedDiagnosticos.forEach(g => {
      resultsDiagnosticos.push(g.rows[0]);
    });

    groupedProcedimientos.forEach(g => {
      resultsProcedimientos.push(g.rows[0]);
    });

    return { diagnosticos: resultsDiagnosticos, procedimientos: resultsProcedimientos };
  }

  public async reporte(start: Date, end: Date) {
    try {
      if (start && end) {
        start = new Date(`${start}:00:00:00`);
        end = new Date(`${end}:23:59:59`);
      }
      const auditoriaRp = this.conn.getRepository(AuditoriaOrm);
      const auditorias = await auditoriaRp.find({
        where: { fechaCreacion: start && end ? Between(start, end) : undefined },
      });

      const pacientesIds = uniq(auditorias.map(a => a.pacienteId));
      const usuariosIds = uniq(auditorias.map(a => a.usuarioId));
      const diagnosticosIds = uniq([
        ...auditorias.map(a => a.diagnostico1Id || 0),
        ...auditorias.map(a => a.diagnostico2Id || 0),
        ...auditorias.map(a => a.diagnostico3Id || 0),
      ]);
      const serviciosIds = uniq([
        ...auditorias.map(a => a.servicio1Id || 0),
        ...auditorias.map(a => a.servicio2Id || 0),
        ...auditorias.map(a => a.servicio3Id || 0),
      ]);

      const pacientes = await this.conn.query(
        `SELECT OID id, GPANOMCOM nombreCompleto FROM GENPACIEN WHERE OID IN(${pacientesIds})`
      );

      const usuarios = await this.conn.query(
        `SELECT OID id, USUNOMBRE cedula, USUDESCRI nombre FROM GENUSUARIO WHERE OID IN(${usuariosIds})`
      );

      const diagnosticos = await this.conn.query(
        `SELECT OID id, castDataServices.TRIM(DIACODIGO) codigo, castDataServices.TRIM(DIANOMBRE) nombre
          FROM GENDIAGNO WHERE OID IN(${diagnosticosIds})`
      );

      const servicios = await this.conn.query(
        `SELECT OID id, castDataServices.TRIM(SIPCODIGO) codigo, castDataServices.TRIM(SIPNOMBRE) nombre
          FROM GENSERIPS WHERE OID IN(${serviciosIds})`
      );

      return {
        auditorias,
        pacientes,
        usuarios,
        diagnosticos,
        servicios,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}

import { orderBy } from 'lodash';
import { Between, In, IsNull, Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { GcmGrouped, groupByKey, TimerServices } from '@common/application/services';
import {
  generoTypeFactory,
  grupoEstanciaTypeByDaysFactory,
  tipoDocumentoTypeFactory,
  TipoReingresoType,
  TIPOS_REINGRESO,
} from '@hpn/lgc/aud/types/gen';
import { EstanciaByPaciente, estanciasByConsecutivos } from '../queries';
import {
  AuditoriaOrm,
  EstanciaInactivaOrm,
  EventoSeguridadClinicaOrm,
  InternacionOrm,
} from '@hpn/lgc/aud/orm/hpn/auditoria';
import { BaseSource } from '@common/infrastructure/services';
import { EstanciaOrm } from '@hpn/lgc/aud/orm/temp';
import { IngresoOrm } from '@hpn/lgc/aud/orm/gen';

@Injectable()
export class AuditoriaFetchIngresosImpl extends BaseSource {
  async execute(pattern: string, subGrupoId: number) {
    const now = TimerServices.removeTimeZone(new Date()).toISOString().split('T')[0];

    const dayInMs = 86400000;
    const days = dayInMs * 7;
    const nowWtFt = new Date();

    const nowOneDayLessWtFt = new Date(new Date().getTime() - days);

    const estanciaRp = this.conn.getRepository(EstanciaOrm);
    const ingresoRp = this.conn.getRepository(IngresoOrm);
    const internacionRp = this.conn.getRepository(InternacionOrm);

    const estanciasActuales = await estanciaRp.find({
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
        : subGrupoId
          ? [{ fechaEgreso: IsNull(), cama: { subGrupoId } }]
          : [{ fechaEgreso: IsNull() }],
      take: pattern ? 5 : undefined,
      order: { id: 'DESC' },
      relations: [
        'ingreso',
        'ingreso.paciente',
        'ingreso.detalleContrato',
        'cama',
        'cama.grupo',
        'cama.subgrupo',
      ],
    });

    const estanciasCerradas = await estanciaRp.find({
      where: pattern
        ? [
            {
              fechaEgreso: Between(nowOneDayLessWtFt, nowWtFt),
              ingreso: { paciente: { nombreCompleto: Like(`%${pattern}%`) } },
            },
            {
              fechaEgreso: Between(nowOneDayLessWtFt, nowWtFt),
              ingreso: { consecutivo: Like(`%${pattern}%`) },
            },
          ]
        : subGrupoId
          ? [{ fechaEgreso: Between(nowOneDayLessWtFt, nowWtFt), cama: { subGrupoId } }]
          : [{ fechaEgreso: Between(nowOneDayLessWtFt, nowWtFt) }],
      take: pattern ? 5 : undefined,
      order: { id: 'DESC' },
      relations: [
        'ingreso',
        'ingreso.paciente',
        'ingreso.detalleContrato',
        'cama',
        'cama.grupo',
        'cama.subgrupo',
      ],
    });

    estanciasCerradas.map(ec => {
      ec.isEgresado = true;
    });

    const estancias = [...estanciasActuales];

    estanciasCerradas.forEach(ec => {
      const existActual = estanciasActuales.filter(
        ea => ea.ingreso.consecutivo === ec.ingreso.consecutivo
      );
      if (!existActual.length) estancias.push(ec);
    });

    const pacientesIds = estancias.map(e => e.ingreso.pacienteId);
    const consecutivos = estancias.map(e => +e.ingreso.consecutivo);

    let estanciasQuery: EstanciaByPaciente[] = [];
    let estanciasByDocumento: GcmGrouped<EstanciaByPaciente>[] = [];

    const auditoriasPrevias = await this._fetchAuditorias(pacientesIds);

    if (pacientesIds.length) {
      estanciasQuery = await this.conn.query(estanciasByConsecutivos(consecutivos));

      const estanciasIds = estanciasQuery.map(eq => eq.id);

      const internaciones = await internacionRp.find({ where: { estanciaId: In(estanciasIds) } });

      internaciones.map(i => {
        i.setTypes(false);
      });

      estanciasQuery.map(eq => {
        eq.tieneInternaciones = false;
        const internacionesLocal = internaciones.filter(it => it.estanciaId === eq.id);
        const itnlcl = [];
        if (internacionesLocal.length) {
          eq.tieneInternaciones = true;
          internacionesLocal.forEach(itlc => {
            itnlcl.push({
              isFromBack: true,
              fechaInicio: itlc.fechaInicio,
              fechaFinal: itlc.fechaFinal,
              tipo: itlc.tipo,
            });
          });
        }
        eq.internaciones = itnlcl;
      });

      const estaciasOrderByOidDesc = orderBy(estanciasQuery, 'id', 'asc');

      estanciasByDocumento = groupByKey(estaciasOrderByOidDesc, 'numeroDocumento');
    }

    const ingresos = await ingresoRp.find({
      where: { pacienteId: In(pacientesIds) },
      order: { id: 'DESC' },
      relations: ['paciente'],
    });

    estancias.forEach(i => {
      if (i.ingreso.detalleContrato.codigo[0] === '8') {
        if (['8027', '8028', '8029'].indexOf(i.ingreso.detalleContrato.codigo) >= 0) {
          i.ingreso.detalleContrato.nombreTipoContrato = 'CIA';
        } else {
          i.ingreso.detalleContrato.nombreTipoContrato = 'PGP';
        }
      }
    });

    const ingresosGrouped = groupByKey(ingresos, 'pacienteId');

    ingresosGrouped.map(i => {
      i.rows = [i.rows[0], i.rows[1]];
    });

    const response = estancias.map(i => {
      const ingresos = ingresosGrouped.filter(ig => ig.key === i.ingreso.pacienteId);

      let fechaIngresoActual = new Date();
      let fechaIngresoAnterior = new Date();

      let fechaEgresoAnterior = new Date();

      let tipoReingreso: TipoReingresoType;

      const audiRepts = auditoriasPrevias.auditorias.filter(d => d.key === i.ingreso.pacienteId);

      const audiReptsRows = audiRepts.length ? audiRepts[0].rows : [];

      const audiPriRep = auditoriasPrevias.primerosReportes.filter(
        d => d.pacienteId === i.ingreso.pacienteId
      );

      const audiPriRepRevert = auditoriasPrevias.ultimosReportes.filter(
        d => d.pacienteId === i.ingreso.pacienteId
      );

      let tieneAuditoriaHecha = false;

      if (audiPriRep.length) {
        const fechaCreacion = TimerServices.removeTimeZone(audiPriRepRevert[0].fechaCreacion)
          .toISOString()
          .split('T')[0];

        if (now === fechaCreacion) tieneAuditoriaHecha = true;
      }

      i.ingreso.paciente.setTypes();

      const estanciasByDoc = estanciasByDocumento.filter(
        e => e.key === i.ingreso.paciente.numeroDoc
      );

      i.ingreso.setTypes();

      const estancias = estanciasByDoc
        ? estanciasByDoc.filter(c => c.key === i.ingreso.paciente.numeroDoc)[0]
        : undefined;

      let totalDias = 0;

      if (estancias) {
        estancias.rows.map((r, i) => {
          if (!r.fechaEgreso || i === estancias.rows.length - 2) r.isEstanciaActual = true;
          else r.isEstanciaActual = false;
          totalDias += r.totalDias;
        });
      }

      try {
        const rows = orderBy(ingresos[0].rows, 'id', 'desc');
        if (ingresos[0].rows.length > 1) {
          fechaIngresoAnterior = rows[1].fechaIngreso;
          fechaEgresoAnterior = rows[1].fechaEgreso;
        }
        fechaIngresoActual = rows[0].fechaIngreso;

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

      if (i.isEgresado) {
        if (estancias) {
          estancias.rows.forEach(et => {
            if (!et.fechaEgreso) i.isAnulado = true;
          });
        }
      }

      const estanciasTemp = estancias ? estancias.rows : [];
      const ultimaAuditoriaTemp = audiPriRepRevert.length ? audiPriRepRevert[0] : null;

      if (i.isEgresado && estanciasTemp.length) {
        const ultimaEstancia = estanciasTemp[estanciasTemp.length - 1];
        if (
          ultimaEstancia.fechaEgreso &&
          ultimaAuditoriaTemp &&
          ultimaAuditoriaTemp.fechaCreacion
        ) {
          const fechaEgreso = new Date(
            `${ultimaEstancia.fechaEgreso.toISOString().split('T')[0]}:00:00`
          );
          const fechaUltimaAuditoria = new Date(
            `${ultimaAuditoriaTemp.fechaCreacion.toISOString().split('T')[0]}:00:00`
          );
          const nextDay = fechaUltimaAuditoria.setDate(fechaUltimaAuditoria.getDate() + 1);
          const fecUltAudPlOn = new Date(nextDay);
          if (fechaEgreso <= fechaUltimaAuditoria && new Date() > fecUltAudPlOn) i.isAnulado = true;
        }
      }

      return {
        isAnulado: i.isAnulado,
        isEgresado: i.isEgresado,
        tieneAuditoriaHecha,
        id: i.ingreso.id,
        codigo: i.ingreso.consecutivo,
        nombre: i.ingreso.paciente.nombreCompleto,
        ingresos: ingresos.length ? ingresos[0].rows.filter(r => r) : null,
        agrupamientoEstancia: grupoEstanciaTypeByDaysFactory(totalDias),
        diasEstancia: totalDias,
        causaIngreso: i.ingreso.causa,
        tipoReingreso,
        nombreRegimen: i.ingreso.paciente.regimen.getForHumans(),
        estancias: estanciasTemp,
        paciente: {
          nombreCompleto: i.ingreso.paciente.nombreCompleto,
          fechaNacimiento: i.ingreso.paciente.fechaNacimiento,
          genero: generoTypeFactory(i.ingreso.paciente.generoCode),
          documento: {
            lugarExpedicion: i.ingreso.paciente.lugarExpDoc,
            numero: i.ingreso.paciente.numeroDoc,
            tipo: tipoDocumentoTypeFactory(i.ingreso.paciente.tipoDocumentoCode),
          },
          regimen: i.ingreso.paciente.regimen,
        },
        codigoCama: i.cama.codigo,
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
        contrato: {
          nombre: i.ingreso.detalleContrato.nombre,
          tipo: i.ingreso.detalleContrato.nombreTipoContrato,
        },
        auditorias: audiReptsRows,
        primerAuditoria: audiPriRep.length ? audiPriRep[0] : null,
        ultimaAuditoria: ultimaAuditoriaTemp,
      };
    });

    const responseOrdered = orderBy(response, 'codigoCama', 'asc');

    return responseOrdered.filter(r => !r.isAnulado);
  }

  private async _fetchAuditorias(pacientesIds: number[]) {
    const auditoriaRp = this.conn.getRepository(AuditoriaOrm);
    const estanciaInactivaRp = this.conn.getRepository(EstanciaInactivaOrm);
    const eventoSeguridadClinicaRp = this.conn.getRepository(EventoSeguridadClinicaOrm);

    const auditorias = await auditoriaRp.find({
      where: { pacienteId: In(pacientesIds), isDeleted: false },
      relations: [
        'estudiosDx',
        'medicamentosTrazadores',
        'diagnostico1',
        'diagnostico2',
        'diagnostico3',
        'ekGenserips1',
        'ekGenserips2',
        'ekGenserips3',
        'ekGenserips4',
        'servicio1',
        'servicio2',
        'servicio3',
      ],
    });

    const allEstanciasInactivas = await estanciaInactivaRp.find({
      where: { pacienteId: In(pacientesIds) },
      relations: ['especialidad'],
    });

    allEstanciasInactivas.map(ei => {
      ei.setTypes(false);
    });

    const allEvSeguridadClinica = await eventoSeguridadClinicaRp.find({
      where: { pacienteId: In(pacientesIds) },
    });

    allEvSeguridadClinica.map(ei => {
      ei.setTypes(false);
    });

    auditorias.map(a => {
      a.setTypes(false);
      if (a.medicamentosTrazadores) {
        a.medicamentosTrazadores.map(mt => {
          mt.setTypes(false);
        });
      }
      if (a.estudiosDx) {
        a.estudiosDx.map(edx => {
          edx.setTypes(false);
        });
      }
      const estanciasInactivas = allEstanciasInactivas.filter(e => e.pacienteId == a.pacienteId);
      if (estanciasInactivas.length) a.estanciasInactivas = estanciasInactivas;

      const evsSeguridadClinica = allEvSeguridadClinica.filter(e => e.pacienteId == a.pacienteId);
      if (evsSeguridadClinica.length) a.eventosSeguridadClinica = evsSeguridadClinica;
    });

    const auditoriasOrdered = orderBy(auditorias, 'fechaCreacion', 'asc');
    const auditoriasGrouped = groupByKey(auditoriasOrdered, 'pacienteId', 'id');

    const primerosReportes: AuditoriaOrm[] = [];
    const ultimosReportes: AuditoriaOrm[] = [];

    auditoriasGrouped.forEach(a => {
      const primerReporte = a.rows[0];
      const ultimoReporte = a.rows[a.rows.length - 1];

      primerosReportes.push(primerReporte);

      const now = new Date(
        `${TimerServices.removeTimeZone(new Date()).toISOString().split('T')[0]}:00:00:00`
      );

      let menorInicioEstanciaInactiva: Date;
      let mayorFinEstanciaInactiva: Date;

      a.rows.map(r => {
        if (r.estanciasInactivas) {
          r.estanciasInactivas.map(ei => {
            ei.setTypes(false);
            if (!menorInicioEstanciaInactiva && !mayorFinEstanciaInactiva) {
              menorInicioEstanciaInactiva = ei.inicio;
              mayorFinEstanciaInactiva = ei.fin;
            } else {
              if (menorInicioEstanciaInactiva > ei.inicio) menorInicioEstanciaInactiva = ei.inicio;
              if (mayorFinEstanciaInactiva < ei.fin) mayorFinEstanciaInactiva = ei.fin;
            }
          });
        }
        r.estanciasInactivas;
      });

      if (now <= mayorFinEstanciaInactiva) {
        ultimoReporte.nextAuditoriaIsEstanciaInactiva = true;
        ultimoReporte.fechaLimiteAuditoriaIsEstanciaInactiva = mayorFinEstanciaInactiva;
      }

      ultimosReportes.push(ultimoReporte);
    });

    return { auditorias: auditoriasGrouped, primerosReportes, ultimosReportes };
  }
}

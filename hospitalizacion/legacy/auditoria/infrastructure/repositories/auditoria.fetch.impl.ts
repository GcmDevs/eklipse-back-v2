import { AuditoriaOrm } from '@hpn/lgc/aud/orm/hpn/auditoria';
import { Between, In, IsNull, Not } from 'typeorm';
import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import { groupByKey, TimerServices } from '@common/application/services';
import { grupoEstanciaTypeByDaysFactory, TIPOS_REINGRESO } from '@hpn/lgc/aud/types/gen';
import { causaIngresoFactory, formaIngresoFactory } from '@hpn/lgc/aud/types/temp';
import { additionalDataByCentro } from '@common/domain/types';
import { EstanciaOrm } from '@hpn/lgc/aud/orm/temp';
import { orderBy, uniq } from 'lodash';
import { IngresoOrm } from '@hpn/lgc/aud/orm/gen';
import { tipoIngreNacIPSTypeFactory } from '@hpn/lgc/aud/types/hpn/auditoria';

@Injectable()
export class FetchAuditoriaImpl extends BaseSource {
  async execute(fechaInicio: Date, fechaFinal: Date) {
    try {
      const auditoriaRp = this.conn.getRepository(AuditoriaOrm);
      const estanciaRp = this.conn.getRepository(EstanciaOrm);
      const ingresoRp = this.conn.getRepository(IngresoOrm);

      const estanciasActivas = await estanciaRp.find({
        where: { fechaEgreso: IsNull(), ingresoId: Not(IsNull()) },
        relations: ['ingreso', 'cama'],
      });

      const auditorias = await auditoriaRp.find({
        where: { fechaCreacion: Between(fechaInicio, fechaFinal), isDeleted: false },
        relations: [
          'usuario',
          'paciente',
          'paciente.telefono',
          'paciente.detalleContrato',
          'paciente.detalleContrato.contrato',
          'estancia',
          'estancia.cama',
          'estancia.cama.centro',
          'ingreso',
          'ingreso.detalleContrato',
          'ingreso.detalleContrato.contrato',
        ],
      });

      const pacientesIds = auditorias.map(e => e.pacienteId);

      const ingresos = await ingresoRp.find({
        where: { pacienteId: In(uniq(pacientesIds)) },
        order: { id: 'DESC' },
      });
      const ingresosGrouped = groupByKey(ingresos, 'pacienteId');

      ingresosGrouped.map(i => {
        i.rows = [i.rows[0], i.rows[1]];
      });

      const auditoriasGrouped = groupByKey(auditorias, 'pacienteId');

      auditoriasGrouped.map(auditoria => {
        auditoria.rows = auditoria.rows.map((registro: AuditoriaOrm, i: number) => {
          const ingresosFt = ingresosGrouped.filter(ig => ig.key === registro.pacienteId);
          let ingresos: IngresoOrm[];
          let tipoReingreso = TIPOS_REINGRESO.INGR_NORMAL;
          let diasEstancia = 0;
          if (ingresosFt.length) {
            ingresos = ingresosFt[0].rows.filter(r => r);
            diasEstancia = ingresos.length
              ? Math.ceil(
                  TimerServices.getDiffInDays(ingresos[0].fechaIngreso, ingresos[0].fechaEgreso)
                )
              : null;
            if (ingresos.length > 1) {
              const diffInTime =
                ingresos[0].fechaIngreso.getTime() -
                (ingresos[1].fechaEgreso
                  ? ingresos[1].fechaEgreso.getTime()
                  : ingresos[0].fechaIngreso.getTime());
              if (diffInTime <= 129600000) {
                diasEstancia = Math.ceil(
                  TimerServices.getDiffInDays(ingresos[1].fechaIngreso, ingresos[0].fechaEgreso)
                );
                if (diffInTime <= 720000) {
                  // 2 horas
                  tipoReingreso = TIPOS_REINGRESO.CORTE_FACT;
                } else if (diffInTime > 720000 && diffInTime <= 25920000) {
                  // 72 horas
                  tipoReingreso = TIPOS_REINGRESO.REINGR_URG;
                } else if (diffInTime > 25920000 && diffInTime <= 129600000) {
                  // 15 dias
                  tipoReingreso = TIPOS_REINGRESO.REINGR_HOSP;
                } else {
                  tipoReingreso = TIPOS_REINGRESO.INGR_NORMAL;
                }
              }
            }
          }

          const camaActual = estanciasActivas.filter(
            ea => ea.ingreso.pacienteId === registro.paciente.id
          );
          if (registro.motivoIngresoNacidoEnInstitucionCode) {
            registro.motivoIngresoNacidoEnInstitucion = tipoIngreNacIPSTypeFactory(
              registro.motivoIngresoNacidoEnInstitucionCode
            );
          }
          if (registro.usuario) {
            registro.usuario = {
              cedula: registro.usuario.cedula,
              nombreCompleto: registro.usuario.nombreCompleto,
            } as any;
          }
          if (registro.ingreso) {
            registro.contrato = {
              id: registro.ingreso.detalleContrato.contrato.id,
              codigo: registro.ingreso.detalleContrato.contrato.codigo,
              nombre: registro.ingreso.detalleContrato.contrato.nombre,
            };
            registro.ingreso = {
              id: registro.ingreso.id,
              consecutivo: registro.ingreso.consecutivo,
              fechaIngreso: registro.ingreso.fechaIngreso,
              causa: causaIngresoFactory(registro.ingreso.causaCode),
              forma: formaIngresoFactory(registro.ingreso.formaCode),
            } as any;
          }
          if (registro.estancia) {
            const centroId = registro.estancia.cama.centro.id;
            const dataCentro = additionalDataByCentro(this.auth.context, 0, centroId);
            registro.estancia.cama.centro.nit = dataCentro.nit;
            registro.centro = registro.estancia.cama.centro;
            registro.estancia = {
              id: registro.estancia.id,
              cama: registro.estancia.cama,
              fechaIngreso: registro.estancia.fechaIngreso,
              fechaEgreso: registro.estancia.fechaEgreso,
            } as any;
          }
          if (registro.paciente) {
            if (!i) {
              const contrato = registro.paciente.detalleContrato.contrato;
              registro.paciente.setTypes(false);
              registro.paciente = {
                tipoReingreso,
                diasEstancia,
                ingresos,
                agrupamientoEstancia: grupoEstanciaTypeByDaysFactory(diasEstancia),
                id: registro.paciente.id,
                documento: registro.paciente.documento,
                tipoDocumento: registro.paciente.tipoDocumento,
                nombreCompleto: registro.paciente.nombreCompleto,
                fechaNacimiento: registro.paciente.fechaNacimiento,
                genero: registro.paciente.genero,
                regimen: registro.paciente.regimen,
                contrato: {
                  id: contrato.id,
                  codigo: contrato.codigo,
                  nombre: contrato.nombre,
                },
                causaIngreso: registro.ingreso.causa,
                formaIngreso: registro.ingreso.forma,
                camaActual: camaActual.length
                  ? {
                      id: camaActual[0].cama.id,
                      codigo: camaActual[0].cama.codigo,
                      nombre: camaActual[0].cama.nombre,
                    }
                  : undefined,
                tipoContrato: contrato.codigo[0] === '8' ? 'PGP' : 'EVENTO',
              } as any;
              if (registro.paciente.telefono) {
                registro.paciente.numeroTelefono = registro.paciente.telefono.telefono;
              } else {
                registro.paciente.numeroTelefono = 'NO TIENE';
              }
              (auditoria as any).paciente = registro.paciente;
            }
            delete registro.paciente;
            delete registro.pacienteId;
          }
          return registro;
        });
        (auditoria as any).paciente.registros = orderBy(auditoria.rows, 'id', 'desc');
        delete auditoria.key;
        delete auditoria.name;
        delete auditoria.rows;
      });

      return auditoriasGrouped.map((r: any) => r.paciente);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}

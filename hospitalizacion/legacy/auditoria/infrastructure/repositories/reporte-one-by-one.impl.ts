import { uniq } from 'lodash';
import { Between } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { AuditoriaOrm } from '@hpn/lgc/aud/orm/hpn/auditoria';
import {
  agruEstanProlErpTypeFactory,
  agruEstanProlIpsTypeFactory,
  estanciaProlongadaERPUsuarioFactory,
  estanciaProlongadaIpsFactory,
  estudioDxTypeFactory,
  medicamentoTrazadorTypeFactory,
  tipoInternacionTypeFactory,
} from '@hpn/lgc/aud/types/hpn/auditoria';

export interface UsuarioRes {
  id: number;
  cedula: string;
  nombreCompleto: string;
}

export interface PacienteRes {
  id: number;
  numeroDoc: string;
  nombreCompleto: string;
  detalleContratoId: number;
}

export interface DiagnosticoRes {
  id: number;
  codigo: string;
  nombre: string;
}

export interface DetalleContratoRes {
  id: number;
  codigo: string;
  nombre: string;
}

export interface DiagnosticoRes {
  id: number;
  consecutivo: string;
}

@Injectable()
export class AuditoriaReporteOneByOneImpl extends BaseSource {
  public async execute(start: Date, end: Date): Promise<any[]> {
    try {
      if (start && end) {
        start = new Date(`${start}:00:00:00`);
        end = new Date(`${end}:23:59:59`);
      }
      const auditoriaRp = this.conn.getRepository(AuditoriaOrm);

      const auditorias = await auditoriaRp.find({
        where: { fechaCreacion: start && end ? Between(start, end) : undefined },
        relations: [
          'medicamentosTrazadores',
          'estudiosDx',
          'estanciasInactivas',
          'internaciones',
          'internaciones.estancia',
          'internaciones.estancia.cama',
        ],
      });

      let usuariosIds: number[] = [0];
      let pacientesIds: number[] = [0];
      let diagnosticosIds: number[] = [0];
      let serviciosIds: number[] = [0];
      let ingresosIds: number[] = [0];
      let ekGenseripsIds: number[] = [0];

      auditorias.forEach(au => {
        usuariosIds.push(au.usuarioId);
        pacientesIds.push(au.pacienteId);
        if (au.ingresoId) ingresosIds.push(au.ingresoId);
        if (au.servicio1Id) serviciosIds.push(au.servicio1Id);
        if (au.servicio2Id) serviciosIds.push(au.servicio2Id);
        if (au.servicio3Id) serviciosIds.push(au.servicio3Id);
        if (au.ekGenserips1Id) ekGenseripsIds.push(au.ekGenserips1Id);
        if (au.ekGenserips2Id) ekGenseripsIds.push(au.ekGenserips2Id);
        if (au.ekGenserips3Id) ekGenseripsIds.push(au.ekGenserips3Id);
        if (au.ekGenserips4Id) ekGenseripsIds.push(au.ekGenserips4Id);
        if (au.diagnostico1Id) diagnosticosIds.push(au.diagnostico1Id);
        if (au.diagnostico2Id) diagnosticosIds.push(au.diagnostico2Id);
        if (au.diagnostico3Id) diagnosticosIds.push(au.diagnostico3Id);
      });

      usuariosIds = [...uniq(usuariosIds), 0];
      pacientesIds = [...uniq(pacientesIds), 0];
      diagnosticosIds = [...uniq(diagnosticosIds), 0];
      ingresosIds = [...uniq(ingresosIds), 0];

      const usuarios: UsuarioRes[] = await this.conn.query(
        `SELECT OID id, USUNOMBRE cedula, USUDESCRI nombreCompleto FROM GENUSUARIO WHERE OID IN(${usuariosIds})`
      );

      const pacientes: PacienteRes[] = await this.conn.query(
        `SELECT OID id, PACNUMDOC numeroDoc, GENDETCON detalleContratoId, GPANOMCOM nombreCompleto FROM GENPACIEN WHERE OID IN(${pacientesIds})`
      );

      const contratosIds = [...pacientes.map(c => c.detalleContratoId), 0];

      const detalleContratos: DetalleContratoRes[] = await this.conn.query(
        `select OID id, GDECODIGO codigo, GDENOMBRE nombre, GENCONTRA1 contratoId from GENDETCON WHERE OID IN(${uniq(
          contratosIds
        )})`
      );

      const diagnosticos: DiagnosticoRes[] = await this.conn.query(
        `SELECT OID id, DIACODIGO codigo, DIANOMBRE nombre FROM GENDIAGNO WHERE OID IN(${diagnosticosIds})`
      );

      const servicios: DiagnosticoRes[] = await this.conn.query(
        `SELECT OID id, SIPCODIGO codigo, SIPNOMBRE nombre FROM GENSERIPS WHERE OID IN(${serviciosIds})`
      );

      const ingresos: DiagnosticoRes[] = await this.conn.query(
        `select OID id, AINCONSEC consecutivo from ADNINGRESO where oid IN(${ingresosIds})`
      );

      const serviciosIps: DetalleContratoRes[] = await this.conn.query(
        `select OID id, CODIGO codigo, NOMBRE nombre from EKGENSERIPS where oid IN(${uniq(
          ekGenseripsIds
        )})`
      );

      auditorias.map(au => {
        au.usuario = usuarios.find(usu => usu.id === au.usuarioId) as any;
        au.paciente = pacientes.find(pac => pac.id === au.pacienteId) as any;
        au.ingreso = ingresos.find(ing => ing.id === au.ingresoId) as any;
        au.detalleContrato = detalleContratos.find(
          ct => ct.id === au.paciente.detalleContratoId
        ) as any;
      });

      return auditorias.map(au => {
        au.setTypes(false);
        return {
          id: au.id,
          ingreso: au.ingreso.consecutivo,
          nombreContrato: au.detalleContrato.nombre,
          fechaCreacion: au.fechaCreacion,
          pacienteDocumento: au.paciente.numeroDoc,
          pacienteNombreCompleto: au.paciente.nombreCompleto,
          auditorDocumento: au.usuario.cedula,
          auditorNombreCompleto: au.usuario.nombreCompleto,
          resumenClinico: au.resumenClinicoGestionIntervencion,
          tipoHospitalizacion: au.tipoHospitalizacionCode
            ? au.tipoHospitalizacion.getForHumans()
            : 'NO DEFINIDO',
          criterioUCI: au.criterioUCICode ? au.criterioUCI.getForHumans() : 'NO DEFINIDO',
          diagnostico1: au.diagnostico1Id
            ? diagnosticos.filter(diag => diag.id === au.diagnostico1Id)[0].nombre
            : 'NO DEFINIDO',
          diagnostico2: au.diagnostico2Id
            ? diagnosticos.filter(diag => diag.id === au.diagnostico2Id)[0].nombre
            : 'NO DEFINIDO',
          diagnostico3: au.diagnostico3Id
            ? diagnosticos.filter(diag => diag.id === au.diagnostico3Id)[0].nombre
            : 'NO DEFINIDO',
          cups1: au.ekGenserips1Id
            ? serviciosIps.find(sv => sv.id === au.ekGenserips1Id).nombre
            : 'NO DEFINIDO',
          cups2: au.ekGenserips2Id
            ? serviciosIps.find(sv => sv.id === au.ekGenserips2Id).nombre
            : 'NO DEFINIDO',
          cups3: au.ekGenserips3Id
            ? serviciosIps.find(sv => sv.id === au.ekGenserips3Id).nombre
            : 'NO DEFINIDO',
          cups4: au.ekGenserips4Id
            ? serviciosIps.find(sv => sv.id === au.ekGenserips4Id).nombre
            : 'NO DEFINIDO',
          servicio1: au.servicio1Id
            ? servicios.filter(serv => serv.id === au.servicio1Id)[0].nombre
            : 'NO DEFINIDO',
          servicio2: au.servicio2Id
            ? servicios.filter(serv => serv.id === au.servicio2Id)[0].nombre
            : 'NO DEFINIDO',
          servicio3: au.servicio3Id
            ? servicios.filter(serv => serv.id === au.servicio3Id)[0].nombre
            : 'NO DEFINIDO',
          medicamentosTrazadores: au.medicamentosTrazadores.map(mt => {
            return {
              auditoriaId: au.id,
              ingreso: au.ingreso.consecutivo,
              pacienteDocumento: au.paciente.numeroDoc,
              pacienteNombreCompleto: au.paciente.nombreCompleto,
              nombre: medicamentoTrazadorTypeFactory(mt.codigo).getForHumans(),
              observacion: mt.observacion,
            };
          }),
          cups: {
            id: au.id,
            ingreso: au.ingreso.consecutivo,
            nombreContrato: au.detalleContrato.nombre,
            cups1Codigo: au.ekGenserips1Id
              ? serviciosIps.find(sv => sv.id === au.ekGenserips1Id).codigo
              : 'NO DEFINIDO',
            cups1Nombre: au.ekGenserips1Id
              ? serviciosIps.find(sv => sv.id === au.ekGenserips1Id).nombre
              : 'NO DEFINIDO',
            cups2Codigo: au.ekGenserips2Id
              ? serviciosIps.find(sv => sv.id === au.ekGenserips2Id).codigo
              : 'NO DEFINIDO',
            cups2Nombre: au.ekGenserips2Id
              ? serviciosIps.find(sv => sv.id === au.ekGenserips2Id).nombre
              : 'NO DEFINIDO',
            cups3Codigo: au.ekGenserips3Id
              ? serviciosIps.find(sv => sv.id === au.ekGenserips3Id).codigo
              : 'NO DEFINIDO',
            cups3Nombre: au.ekGenserips3Id
              ? serviciosIps.find(sv => sv.id === au.ekGenserips3Id).nombre
              : 'NO DEFINIDO',
            cups4Codigo: au.ekGenserips4Id
              ? serviciosIps.find(sv => sv.id === au.ekGenserips4Id).codigo
              : 'NO DEFINIDO',
            cups4Nombre: au.ekGenserips4Id
              ? serviciosIps.find(sv => sv.id === au.ekGenserips4Id).nombre
              : 'NO DEFINIDO',
          },
          estudiosDx: au.estudiosDx.map(ed => {
            return {
              auditoriaId: au.id,
              ingreso: au.ingreso.consecutivo,
              nombreContrato: au.detalleContrato.nombre,
              pacienteDocumento: au.paciente.numeroDoc,
              pacienteNombreCompleto: au.paciente.nombreCompleto,
              nombre: estudioDxTypeFactory(ed.estudioDxCode).getForHumans(),
              fechaInicio: ed.inicio,
              fechaFinal: ed.fin,
            };
          }),
          estudiosDxObservacion: au.estudiosDxObservacion,
          actorResponsable: au.actorResponsableCode
            ? au.actorResponsable.getForHumans()
            : 'NO DEFINIDO',
          estanciasInactivas: au.estanciasInactivas.map(ei => {
            return {
              auditoriaId: au.id,
              ingreso: au.ingreso.consecutivo,
              pacienteDocumento: au.paciente.numeroDoc,
              pacienteNombreCompleto: au.paciente.nombreCompleto,
              fechaInicio: ei.inicio,
              fechaFinal: ei.fin,
              erpUsuMotivo: ei.motivoEstanProlonErpUsuCode
                ? estanciaProlongadaERPUsuarioFactory(ei.motivoEstanProlonErpUsuCode).getForHumans()
                : 'NO DEFINIDO',
              erpUsuAgrupador: ei.agruEstanProlonErpUsuCode
                ? agruEstanProlErpTypeFactory(ei.agruEstanProlonErpUsuCode).getForHumans()
                : 'NO DEFINIDO',
              erpUsuObservacion: ei.observacionEstanProlonErpUsu,
              ipsMotivo: ei.motivoEstanProlonIpsCode
                ? estanciaProlongadaIpsFactory(ei.motivoEstanProlonIpsCode).getForHumans()
                : 'NO DEFINIDO',
              ipsAgrupador: ei.agruEstanProlonIpsCode
                ? agruEstanProlIpsTypeFactory(ei.agruEstanProlonIpsCode).getForHumans()
                : 'NO DEFINIDO',
              ipsObservacion: ei.observacionEstanProlonIps,
            };
          }),
          egresoDestino: au.destinoEgresoCode ? au.destinoEgreso.getForHumans() : 'NO DEFINIDO',
          egresoCondicion: au.condicionEgresoCode
            ? au.condicionEgreso.getForHumans()
            : 'NO DEFINIDO',
          egresoFechaSolicitud: au.fechaNovedadEgresos || 'NO DEFINIDO',
          egresoFechaSolucion: au.fechaSolucionNovedad || 'NO DEFINIDO',
          internaciones: au.internaciones.map(i => {
            return {
              auditoriaId: au.id,
              ingreso: au.ingreso.consecutivo,
              nombreContrato: au.detalleContrato.nombre,
              pacienteDocumento: au.paciente.numeroDoc,
              pacienteNombreCompleto: au.paciente.nombreCompleto,
              fechaInicio: i.fechaInicio,
              fechaFinal: i.fechaFinal,
              servicio: tipoInternacionTypeFactory(i.tipoCode).getForHumans(),
              cama: i.estancia && i.estancia.cama ? i.estancia.cama.codigo : 'NO DEFINIDO',
            };
          }),
        };
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}

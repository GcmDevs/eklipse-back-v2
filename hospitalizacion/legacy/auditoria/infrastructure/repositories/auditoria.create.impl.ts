import { CreateAuditoriaDto } from '@hpn/lgc/aud/presentation/dtos';
import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { EstanciaOrm } from '@hpn/lgc/aud/orm/temp';
import { IngresoOrm } from '@hpn/lgc/aud/orm/gen';
import {
  AuditoriaOrm,
  EstanciaInactivaOrm,
  EstudioDxOrm,
  EventoSeguridadClinicaOrm,
  InternacionOrm,
  MedicamentoTrazadorOrm,
} from '@hpn/lgc/aud/orm/hpn/auditoria';
import { uniq } from 'lodash';
import { In } from 'typeorm';

@Injectable()
export class CreateAuditoriaImpl extends BaseSource {
  async execute(body: CreateAuditoriaDto) {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const medicamentoTrazadorRp = this.qr.manager.getRepository(MedicamentoTrazadorOrm);
      const eventoSeguridadClinicaRp = this.qr.manager.getRepository(EventoSeguridadClinicaOrm);
      const estanciaInactivaRp = this.qr.manager.getRepository(EstanciaInactivaOrm);
      const internacionRp = this.qr.manager.getRepository(InternacionOrm);
      const auditoriaRp = this.qr.manager.getRepository(AuditoriaOrm);
      const estudioDxRp = this.qr.manager.getRepository(EstudioDxOrm);
      const estanciaRp = this.qr.manager.getRepository(EstanciaOrm);
      const ingresoRp = this.qr.manager.getRepository(IngresoOrm);

      const ingreso = await ingresoRp.findOne({ where: { id: body.ingresoId } });

      const estancia = await estanciaRp.findOne({
        where: { ingresoId: body.ingresoId },
        order: { id: 'DESC' },
      });

      const newAuditoria = new AuditoriaOrm();
      newAuditoria.fechaCreacion = new Date();
      newAuditoria.ingresoId = body.ingresoId;
      newAuditoria.isEstanciaInactiva = false;
      newAuditoria.usuarioId = this.auth.id;
      if (estancia) newAuditoria.estanciaId = estancia.id;
      newAuditoria.pacienteId = ingreso.pacienteId;

      newAuditoria.motivoIngresoNacidoEnInstitucionCode = body.motivoIngresoNacidoEnInstitucionCode;
      newAuditoria.criterioUCICode = body.criterioUCICode;

      newAuditoria.diasEstanciaDx = body.diasEstanciaDx;

      newAuditoria.destinoEgresoCode = body.destinoEgresoCode;
      newAuditoria.condicionEgresoCode = body.condicionEgresoCode;

      newAuditoria.actorResponsableCode = body.actorResponsableCode;

      newAuditoria.causaEstanciaProlongadaErpUsuarioCode = body.motivoEstanciaProlongadaErpUsu1Code;
      newAuditoria.causaEstanciaProlongadaErpUsuario2Code =
        body.motivoEstanciaProlongadaErpUsu2Code;
      newAuditoria.causaEstanciaProlongadaErpUsuario3Code =
        body.motivoEstanciaProlongadaErpUsu3Code;

      newAuditoria.causaEstanciaProlongadaIpsCode = body.motivoEstanciaProlongadaIps1Code;
      newAuditoria.causaEstanciaProlongadaIps2Code = body.motivoEstanciaProlongadaIps2Code;
      newAuditoria.causaEstanciaProlongadaIps3Code = body.motivoEstanciaProlongadaIps3Code;

      newAuditoria.resumenClinicoGestionIntervencion = body.resumenClinicoGestionIntervencion;
      newAuditoria.isEventoSeguridadClinica = null;
      newAuditoria.edadGestacionalMadre = body.edadGestacionalMadre;
      newAuditoria.pesoRecienNacido = body.pesoRecienNacido;
      newAuditoria.estudiosDxObservacion = body.estudiosDxObservacion;

      if (body.fechaNovedadEgresos) {
        newAuditoria.fechaNovedadEgresos = new Date(`${body.fechaNovedadEgresos}:00:00`);
      }

      if (body.fechaSolucionNovedad) {
        newAuditoria.fechaSolucionNovedad = new Date(`${body.fechaSolucionNovedad}:00:00`);
      }

      newAuditoria.tipoHospitalizacionCode = body.tipoHospitalizacionCode;
      newAuditoria.fallaAtencionCode = body.fallaAtencionCode;

      newAuditoria.servicio1Id = body.servicio1Id;
      newAuditoria.servicio2Id = body.servicio2Id;
      newAuditoria.servicio3Id = body.servicio3Id;

      newAuditoria.ekGenserips1Id = body.ekGenserips1Id ? body.ekGenserips1Id : null;
      newAuditoria.ekGenserips2Id = body.ekGenserips2Id ? body.ekGenserips2Id : null;
      newAuditoria.ekGenserips3Id = body.ekGenserips3Id ? body.ekGenserips3Id : null;
      newAuditoria.ekGenserips4Id = body.ekGenserips4Id ? body.ekGenserips4Id : null;

      newAuditoria.diagnostico1Id = body.diagnostico1Id;
      newAuditoria.diagnostico2Id = body.diagnostico2Id;
      newAuditoria.diagnostico3Id = body.diagnostico3Id;

      const saved = await auditoriaRp.save(newAuditoria);

      if (
        body.evenSegCliFechaEvento1 &&
        body.evenSegCliFechaReporteEvento1 &&
        body.evenSegCliDescripcionEvento1 &&
        body.evenSegCliClasificacionEvento1Code
      ) {
        const newEnt = new EventoSeguridadClinicaOrm();
        newEnt.auditoriaId = saved.id;
        newEnt.ingresoId = ingreso.id;
        newEnt.pacienteId = ingreso.pacienteId;
        newEnt.eventoCode = body.evenSegCliClasificacionEvento1Code;
        newEnt.fechaEvento = new Date(`${body.evenSegCliFechaEvento1}:00:00`);
        newEnt.fechaReporteEvento = new Date(`${body.evenSegCliFechaReporteEvento1}:00:00`);
        newEnt.descripcion = body.evenSegCliDescripcionEvento1;
        await eventoSeguridadClinicaRp.save(newEnt);
      }

      if (
        body.evenSegCliFechaEvento2 &&
        body.evenSegCliFechaReporteEvento2 &&
        body.evenSegCliDescripcionEvento2 &&
        body.evenSegCliClasificacionEvento2Code
      ) {
        const newEnt = new EventoSeguridadClinicaOrm();
        newEnt.auditoriaId = saved.id;
        newEnt.ingresoId = ingreso.id;
        newEnt.pacienteId = ingreso.pacienteId;
        newEnt.eventoCode = body.evenSegCliClasificacionEvento2Code;
        newEnt.fechaEvento = new Date(`${body.evenSegCliFechaEvento2}:00:00`);
        newEnt.fechaReporteEvento = new Date(`${body.evenSegCliFechaReporteEvento2}:00:00`);
        newEnt.descripcion = body.evenSegCliDescripcionEvento2;
        await eventoSeguridadClinicaRp.save(newEnt);
      }

      if (
        body.evenSegCliFechaEvento3 &&
        body.evenSegCliFechaReporteEvento3 &&
        body.evenSegCliDescripcionEvento3 &&
        body.evenSegCliClasificacionEvento3Code
      ) {
        const newEnt = new EventoSeguridadClinicaOrm();
        newEnt.auditoriaId = saved.id;
        newEnt.ingresoId = ingreso.id;
        newEnt.pacienteId = ingreso.pacienteId;
        newEnt.eventoCode = body.evenSegCliClasificacionEvento3Code;
        newEnt.fechaEvento = new Date(`${body.evenSegCliFechaEvento3}:00:00`);
        newEnt.fechaReporteEvento = new Date(`${body.evenSegCliFechaReporteEvento3}:00:00`);
        newEnt.descripcion = body.evenSegCliDescripcionEvento3;
        await eventoSeguridadClinicaRp.save(newEnt);
      }

      if (body.medicamentosTrazadores && body.medicamentosTrazadores.length) {
        const medicamentosTrazadores: MedicamentoTrazadorOrm[] = [];
        body.medicamentosTrazadores.forEach(mt => {
          const newEnt = new MedicamentoTrazadorOrm();
          newEnt.auditoriaId = saved.id;
          newEnt.codigo = mt.code;
          newEnt.observacion = mt.observacion;
          medicamentosTrazadores.push(newEnt);
        });
        await medicamentoTrazadorRp.save(medicamentosTrazadores);
      }

      if (body.inicioEstanciaInactiva1 && body.finEstanciaInactiva1) {
        const newEnt = new EstanciaInactivaOrm();
        newEnt.auditoriaId = saved.id;
        newEnt.ingresoId = ingreso.id;
        newEnt.pacienteId = ingreso.pacienteId;
        newEnt.agruEstanProlonErpUsuCode = body.agruEstanProlonErpUsuCode1;
        newEnt.agruEstanProlonIpsCode = body.agruEstanProlonIpsCode1;
        newEnt.observacionEstanProlonErpUsu = body.obsEstanProlonErpUsu1;
        newEnt.observacionEstanProlonIps = body.obsEstanProlonIps1;
        newEnt.motivoEstanProlonErpUsuCode = body.motivoEstanciaProlongadaErpUsu1Code;
        newEnt.motivoEstanProlonIpsCode = body.motivoEstanciaProlongadaIps1Code;
        newEnt.especialidadId = body.especialidad1Id;
        newEnt.inicio = new Date(`${body.inicioEstanciaInactiva1}:00:00`);
        newEnt.fin = new Date(`${body.finEstanciaInactiva1}:00:00`);
        await estanciaInactivaRp.save(newEnt);
      }

      if (body.inicioEstanciaInactiva2 && body.finEstanciaInactiva2) {
        const newEnt = new EstanciaInactivaOrm();
        newEnt.auditoriaId = saved.id;
        newEnt.ingresoId = ingreso.id;
        newEnt.pacienteId = ingreso.pacienteId;
        newEnt.agruEstanProlonErpUsuCode = body.agruEstanProlonErpUsuCode2;
        newEnt.agruEstanProlonIpsCode = body.agruEstanProlonIpsCode2;
        newEnt.observacionEstanProlonErpUsu = body.obsEstanProlonErpUsu2;
        newEnt.observacionEstanProlonIps = body.obsEstanProlonIps2;
        newEnt.motivoEstanProlonErpUsuCode = body.motivoEstanciaProlongadaErpUsu2Code;
        newEnt.motivoEstanProlonIpsCode = body.motivoEstanciaProlongadaIps2Code;
        newEnt.especialidadId = body.especialidad2Id;
        newEnt.inicio = new Date(`${body.inicioEstanciaInactiva2}:00:00`);
        newEnt.fin = new Date(`${body.finEstanciaInactiva2}:00:00`);
        await estanciaInactivaRp.save(newEnt);
      }

      if (body.inicioEstanciaInactiva3 && body.finEstanciaInactiva3) {
        const newEnt = new EstanciaInactivaOrm();
        newEnt.auditoriaId = saved.id;
        newEnt.ingresoId = ingreso.id;
        newEnt.pacienteId = ingreso.pacienteId;
        newEnt.especialidadId = body.especialidad3Id;
        newEnt.agruEstanProlonErpUsuCode = body.agruEstanProlonErpUsuCode3;
        newEnt.agruEstanProlonIpsCode = body.agruEstanProlonIpsCode3;
        newEnt.observacionEstanProlonErpUsu = body.obsEstanProlonErpUsu3;
        newEnt.observacionEstanProlonIps = body.obsEstanProlonIps3;
        newEnt.motivoEstanProlonErpUsuCode = body.motivoEstanciaProlongadaErpUsu3Code;
        newEnt.motivoEstanProlonIpsCode = body.motivoEstanciaProlongadaIps3Code;
        newEnt.inicio = new Date(`${body.inicioEstanciaInactiva3}:00:00`);
        newEnt.fin = new Date(`${body.finEstanciaInactiva3}:00:00`);
        await estanciaInactivaRp.save(newEnt);
      }

      if (body.estudiosDx && body.estudiosDx.length) {
        const estudioDx: EstudioDxOrm[] = [];
        body.estudiosDx.forEach(mt => {
          const newEnt = new EstudioDxOrm();
          newEnt.auditoriaId = saved.id;
          newEnt.estudioDxCode = mt.code;
          if (mt.inicio) newEnt.inicio = new Date(mt.inicio);
          if (mt.inicio && mt.final) newEnt.fin = new Date(mt.final);
          estudioDx.push(newEnt);
        });
        await estudioDxRp.save(estudioDx);
      }

      if (body.internaciones && body.internaciones.length) {
        const estanciasIds: number[] = [];

        const internaciones: InternacionOrm[] = [];

        for (let index = 0; index < body.internaciones.length; index++) {
          const internacionDto = body.internaciones[index];
          estanciasIds.push(internacionDto.estanciaId);
          const newInternacion = new InternacionOrm();
          newInternacion.auditoriaId = saved.id;
          newInternacion.ingresoId = ingreso.id;
          newInternacion.pacienteId = ingreso.pacienteId;
          newInternacion.estanciaId = internacionDto.estanciaId;
          newInternacion.fechaInicio = internacionDto.fechaInicio;
          newInternacion.fechaFinal = internacionDto.fechaFinal;
          newInternacion.tipoCode = internacionDto.tipoCode;
          internaciones.push(newInternacion);
        }

        const internacionesAborrar = await internacionRp.find({
          where: { estanciaId: In(uniq(estanciasIds)) },
        });

        await internacionRp.remove(internacionesAborrar);

        await internacionRp.save(internaciones);
      }

      await this.qr.commitTransaction();

      return saved;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}

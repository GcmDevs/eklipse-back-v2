import { CreateAuditoriaDto } from '@hpn/lgc/aud/presentation/dtos';
import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { EstanciaOrm } from '@hpn/lgc/aud/orm/temp';
import { IngresoOrm } from '@hpn/lgc/aud/orm/gen';
import {
  AuditoriaOrm,
  EstudioDxOrm,
  InternacionOrm,
  MedicamentoTrazadorOrm,
} from '@hpn/lgc/aud/orm/hpn/auditoria';
import { uniq } from 'lodash';
import { In } from 'typeorm';

@Injectable()
export class UpdateAuditoriaImpl extends BaseSource {
  async execute(id: number, body: CreateAuditoriaDto) {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const medicamentoTrazadorRp = this.qr.manager.getRepository(MedicamentoTrazadorOrm);
      const internacionRp = this.qr.manager.getRepository(InternacionOrm);
      const auditoriaRp = this.qr.manager.getRepository(AuditoriaOrm);
      const estudioDxRp = this.qr.manager.getRepository(EstudioDxOrm);
      const estanciaRp = this.qr.manager.getRepository(EstanciaOrm);
      const ingresoRp = this.qr.manager.getRepository(IngresoOrm);

      const mediTrazViejos = await medicamentoTrazadorRp.find({ where: { auditoriaId: id } });
      await medicamentoTrazadorRp.remove(mediTrazViejos);

      const estDx = await estudioDxRp.find({ where: { auditoriaId: id } });
      await estudioDxRp.remove(estDx);

      const ingreso = await ingresoRp.findOne({ where: { id: body.ingresoId } });

      const au = await auditoriaRp.findOne({ where: { id, isDeleted: false } });

      au.criterioUCICode = body.criterioUCICode ? body.criterioUCICode : null;
      au.diasEstanciaDx = body.diasEstanciaDx ? body.diasEstanciaDx : null;
      au.destinoEgresoCode = body.destinoEgresoCode ? body.destinoEgresoCode : null;
      au.condicionEgresoCode = body.condicionEgresoCode ? body.condicionEgresoCode : null;
      au.actorResponsableCode = body.actorResponsableCode ? body.actorResponsableCode : null;
      au.causaEstanciaProlongadaErpUsuarioCode = body.motivoEstanciaProlongadaErpUsu1Code
        ? body.motivoEstanciaProlongadaErpUsu1Code
        : null;
      au.causaEstanciaProlongadaIpsCode = body.motivoEstanciaProlongadaIps1Code
        ? body.motivoEstanciaProlongadaIps1Code
        : null;
      au.resumenClinicoGestionIntervencion = body.resumenClinicoGestionIntervencion
        ? body.resumenClinicoGestionIntervencion
        : null;
      /* au.observacionEstanciaProlongadaIps = body.observacionEstanciaProlongadaIps
        ? body.observacionEstanciaProlongadaIps
        : null;
      au.observacionEstanciaProlongadaErpUsuario = body.observacionEstanciaProlongadaErpUsuario
        ? body.observacionEstanciaProlongadaErpUsuario
        : null; */
      au.estudiosDxObservacion = body.estudiosDxObservacion ? body.estudiosDxObservacion : null;
      au.fechaNovedadEgresos = body.fechaNovedadEgresos
        ? new Date(`${body.fechaNovedadEgresos}:00:00`)
        : null;
      au.fechaSolucionNovedad = au.fechaSolucionNovedad
        ? new Date(`${body.fechaSolucionNovedad}:00:00`)
        : null;

      au.servicio1Id = body.servicio1Id ? body.servicio1Id : null;
      au.servicio2Id = body.servicio2Id ? body.servicio2Id : null;
      au.servicio3Id = body.servicio3Id ? body.servicio3Id : null;

      au.ekGenserips1Id = body.ekGenserips1Id ? body.ekGenserips1Id : null;
      au.ekGenserips2Id = body.ekGenserips2Id ? body.ekGenserips2Id : null;
      au.ekGenserips3Id = body.ekGenserips3Id ? body.ekGenserips3Id : null;
      au.ekGenserips4Id = body.ekGenserips4Id ? body.ekGenserips4Id : null;

      au.diagnostico1Id = body.diagnostico1Id ? body.diagnostico1Id : null;
      au.diagnostico2Id = body.diagnostico2Id ? body.diagnostico2Id : null;
      au.diagnostico3Id = body.diagnostico3Id ? body.diagnostico3Id : null;

      au.tipoHospitalizacionCode = body.tipoHospitalizacionCode
        ? body.tipoHospitalizacionCode
        : null;
      au.fallaAtencionCode = body.fallaAtencionCode ? body.fallaAtencionCode : null;

      const saved = await auditoriaRp.save(au);

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

      if (body.estudiosDx && body.estudiosDx.length) {
        const estudioDx: EstudioDxOrm[] = [];
        body.estudiosDx.forEach(mt => {
          const newEnt = new EstudioDxOrm();
          newEnt.auditoriaId = saved.id;
          newEnt.estudioDxCode = mt.code;
          if (mt.inicio) newEnt.inicio = new Date(mt.inicio);
          if (mt.final) newEnt.fin = new Date(mt.final);
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

        let estanciaAbierta = 0;
        const estancias = await estanciaRp.find({ where: { id: In(uniq(estanciasIds)) } });

        estancias.forEach(e => {
          if (!e.fechaEgreso) estanciaAbierta = e.id;
        });

        if (estanciaAbierta) {
          const internacionesAborrar = await internacionRp.find({
            where: { estanciaId: estanciaAbierta },
          });
          await internacionRp.remove(internacionesAborrar);
        }

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

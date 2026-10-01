import { BadRequestException, Injectable } from '@nestjs/common';
import { TIPO_ENTIDADES } from '@hpn/gestion-clinica/v1/domain/types';
import { EkEmpleadoOrm, MotivoTrasladoOrm, ServicioOrm, VehiculoOrm } from '../orm';
import { BaseSource } from '@common/infrastructure/services';
import { CreateEmpleadoDto, CreateEntidadDto } from '../../presentation/dtos';
import { GCM_CONTEXTS } from '@common/domain/types';

@Injectable()
export class CreateEmpleadoOrEntidadService extends BaseSource {
  public async addEntiad(body: CreateEntidadDto) {
    const qr = this.dynamicQR(this.auth.context);
    try {
      await qr.connect();

      await qr.startTransaction();

      if (body.tipoEntidadCode === TIPO_ENTIDADES.MOTIVO_TRASLADO.getCode()) {
        const motivoTrasladoRp = qr.manager.getRepository(MotivoTrasladoOrm);

        const motivo = await motivoTrasladoRp.findOne({
          where: { nombre: body.nombre.toUpperCase() },
        });

        if (motivo) {
          throw new Error(`Este motivo de traslado ya se encuentra agregado`);
        }

        const newMotivoTraslado = new MotivoTrasladoOrm();

        newMotivoTraslado.nombre = body.nombre.toUpperCase();

        await motivoTrasladoRp.save(newMotivoTraslado);
      }

      if (body.tipoEntidadCode === TIPO_ENTIDADES.SERVICIO.getCode()) {
        const servicioRp = qr.manager.getRepository(ServicioOrm);

        const servicio = await servicioRp.findOne({ where: { nombre: body.nombre.toUpperCase() } });

        if (servicio) {
          throw new Error(`Este servicio ya se encuentra agregado`);
        }

        const newServicio = new ServicioOrm();

        newServicio.nombre = body.nombre.toUpperCase();

        await servicioRp.save(newServicio);
      }

      if (body.tipoEntidadCode === TIPO_ENTIDADES.VEHICULO.getCode()) {
        const qr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);

        await qr.connect();

        const vehiculoRp = qr.manager.getRepository(VehiculoOrm);

        const Vehiculo = await vehiculoRp.findOne({ where: { placa: body.nombre.toUpperCase() } });

        if (Vehiculo) {
          throw new Error(`Este Vehiculo ya se encuentra agregado`);
        }

        const newVehiculo = new VehiculoOrm();

        newVehiculo.placa = body.nombre.toUpperCase();

        await vehiculoRp.save(newVehiculo);
      }

      await qr.commitTransaction();

      return true;
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error);
    } finally {
      await qr.release();
    }
  }

  public async addEmpleado(body: CreateEmpleadoDto) {
    const qr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);
    try {
      await qr.connect();

      await qr.startTransaction();

      const empleadoRp = qr.manager.getRepository(EkEmpleadoOrm);

      const empleado = await empleadoRp.findOne({
        where: { documento: body.documento },
      });

      if (empleado) {
        throw new Error(`Ya se encuenta registrado un empleado con este numero de documento`);
      }

      const newEmpleado = new EkEmpleadoOrm();

      newEmpleado.nombre = body.nombre;
      newEmpleado.documento = body.documento;
      newEmpleado.tipoCode = body.tipoEmpleadoCode as any;
      if (body.telefono) {
        newEmpleado.telefono = body.telefono;
      }
      // newEmpleado.creadoPorId = usuarioId;
      // newEmpleado.fechaCreacion = new Date();
      // newEmpleado.centroId = body.institucionId;

      await empleadoRp.save(newEmpleado);

      await qr.commitTransaction();
      return true;
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error);
    } finally {
      await qr.release();
    }
  }
}

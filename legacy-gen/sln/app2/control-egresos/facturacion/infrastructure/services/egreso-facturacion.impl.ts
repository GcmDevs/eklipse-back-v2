import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { Egreso, EgresosResponse } from '../../domain/models';
import { getEgresosFacturacionQuery } from '../queries/egresos-facturacion/get-egresos-facturacion';
import { PendienteDto } from '../../presentation/dtos/pendiente-model';
import { AsignarDto } from '../../presentation/dtos/asignar-model';
import { getDateRange, removeTimeZone, RSAServices } from '@common/application/services';
import { getUsuarioQuery } from '../queries/egresos-facturacion/get-usuario';
import { AsignarUsuarioOrm } from '@sln/orm/sln/control-egresos/asignar-usuario';
import { CreatePendienteOrm } from '@sln/orm/sln/control-egresos';
//import { SLN_AUTHORITIES } from '@authorities/facturacion';
//import { log } from 'console';

@Injectable()
export class EgresoFacturacionImpl extends BaseSource {
  public async getEgresosFacturacion(inicio: Date, final: Date): Promise<EgresosResponse> {
    const id = this.auth.id;
    // const banderaPermisos = await this.hasAnyAuthority([
    //   SLN_AUTHORITIES.CONTROL_EGRESOS.ASIGNAR_USUARIO,
    //   //  SLN_AUTHORITIES.CONTROL_EGRESOS.CREAR_PENDIENTES
    // ]);
    inicio = removeTimeZone(inicio);
    final = removeTimeZone(final);

    const dateRange = getDateRange(inicio, final, true);

    let egresos: any = [];

    for (let index = 0; index < dateRange.length; index++) {
      const el = dateRange[index];
      const temp = await this.conn.query(getEgresosFacturacionQuery(true, id), [
        removeTimeZone(el.start).toISOString().split('T')[0],
        removeTimeZone(el.end).toISOString().split('T')[0],
      ]);
      egresos.push(...temp);
    }

    // Mapear los egresos para reemplazar USUARIOASIGNADO con la cédula obtenida
    const egresosModificados = await Promise.all(
      egresos.map(async (egreso: Egreso) => {
        // Consultar la cédula usando USUARIOASIGNADO
        if (!egreso.USUARIOASIGNADO) {
          // console.log(`Egreso procesado - NUMERO_INGRESO: ${egreso.NUMERO_INGRESO}, USUARIOASIGNADO: null, Cédula: null`);
          return {
            ...egreso,
            USUARIOASIGNADO: null, // O un valor por defecto, ej. "",
            USUARIOASIGNADONOMBRE: null, // O un valor por defecto, ej. "",
          };
        }
        const usuario = await this.conn.query(getUsuarioQuery(), [egreso.USUARIOASIGNADO]);
        const cedula = usuario.length > 0 ? usuario[0].USUNOMBRE : null; // Ajusta según la estructura de la respuesta
        const nombre = usuario.length > 0 ? usuario[0].USUDESCRI : null; // Ajusta según la estructura de la respuesta

        // Imprimir log para verificar el proceso
        // console.log(`Egreso procesado - ID: ${egreso.NUMERO_INGRESO}, USUARIOASIGNADO: ${egreso.USUARIOASIGNADO}, Cédula: ${cedula}`);

        return {
          ...egreso, // Mantener todos los campos originales
          USUARIOASIGNADO: cedula, // Reemplazar USUARIOASIGNADO con la cédula,
          USUARIOASIGNADONOMBRE: nombre, // Reemplazar USUARIOASIGNADO con la cédula,
        };
      })
    );

    return {
      egresos: egresosModificados,
    };
  }

  async savePendiente(form: PendienteDto): Promise<boolean> {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      // Validar la existencia del ingreso
      const ingreso = this.qr.query('SELECT * FROM ADNINGRESO WHERE AINCONSEC = 0', [
        form.numero_ingreso,
      ]);
      if (!ingreso) {
        throw new Error('No se encontró el ingreso');
      }
      // Verificar si ya existe un pendiente para este ingreso
      const pendienteRp = this.qr.manager.getRepository(CreatePendienteOrm);

      const existingPendiente = await pendienteRp.findOne({
        where: { numero_ingreso: form.numero_ingreso },
      });
      if (existingPendiente) {
        // Actualizar el pendiente existente
        existingPendiente.estado = form.estado;
        existingPendiente.fecha = new Date();
        existingPendiente.numero_ingreso = form.numero_ingreso;
        existingPendiente.motivo_no_facturacion = form.motivo_no_facturacion;
        existingPendiente.observacion = form.observacion;
        existingPendiente.creadoPorId = this.auth.id;
        await pendienteRp.save(existingPendiente);
      } else {
        // Crear y guardar el nuevo pendiente
        const newPendiente = new CreatePendienteOrm();
        newPendiente.estado = form.estado;
        newPendiente.fecha = new Date();
        newPendiente.numero_ingreso = form.numero_ingreso;
        newPendiente.motivo_no_facturacion = form.motivo_no_facturacion;
        newPendiente.observacion = form.observacion;
        newPendiente.creadoPorId = this.auth.id;
        await pendienteRp.save(newPendiente);
      }

      // if (existingPendiente) {
      //     throw new Error('El ingreso ya tiene un pendiente');
      // }

      // Crear y guardar el nuevo pendiente
      // const newPendiente = new CreatePendienteOrm();
      // newPendiente.estado = form.estado;
      // newPendiente.fecha = new Date();
      // newPendiente.numero_ingreso = form.numero_ingreso;
      // newPendiente.motivo_no_facturacion = form.motivo_no_facturacion;
      // newPendiente.observacion = form.observacion;
      // await pendienteRp.save(newPendiente);
      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      console.error('Error al guardar el pendiente:', error);
      return false;
    } finally {
      await this.qr.release();
    }
  }

  async saveAsignar(form: AsignarDto): Promise<boolean> {
    let transactionStarted = false;
    try {
      transactionStarted = true;
      await this.qr.connect();
      await this.qr.startTransaction();
      // Validar la existencia del ingreso
      const ingreso = this.qr.query('SELECT * FROM ADNINGRESO WHERE AINCONSEC = 0', [
        form.numero_ingreso,
      ]);
      if (!ingreso) throw new Error('No se encontró el ingreso');

      // Verificar si ya existe un pendiente para este ingreso
      const asignadoRp = this.qr.manager.getRepository(AsignarUsuarioOrm);

      const existingAsignado = await asignadoRp.findOne({
        where: { numero_ingreso: form.numero_ingreso },
      });

      if (existingAsignado) {
        // Actualizar el registro existente
        existingAsignado.estado = form.estado;
        existingAsignado.tipoCuenta = form.tipoCuenta;
        existingAsignado.observacion = form.observacion;
        existingAsignado.creadoPorId = this.auth.id;
        existingAsignado.usuarioOriginalId = existingAsignado.creadoPorId; // Guardamos el usuario original
        existingAsignado.UsuarioAsignadoId = RSAServices.decryptId(form.usuarioAsignadoId); // El nuevo pasa a ser el usuario asignado
        existingAsignado.fechaReasignacion = new Date();
        await asignadoRp.save(existingAsignado);
      } else {
        // Crear y guardar un nuevo registro
        const newAsignado = new AsignarUsuarioOrm();
        newAsignado.estado = form.estado;
        newAsignado.fecha = new Date();
        newAsignado.numero_ingreso = form.numero_ingreso;
        newAsignado.tipoCuenta = form.tipoCuenta;
        newAsignado.observacion = form.observacion;
        newAsignado.creadoPorId = this.auth.id;
        newAsignado.UsuarioAsignadoId = RSAServices.decryptId(form.usuarioAsignadoId);
        await asignadoRp.save(newAsignado);
      }

      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      if (transactionStarted) {
        await this.qr.rollbackTransaction();
      }

      console.error('Error al guardar el pendiente:', error);
      return false;
    } finally {
      if (transactionStarted) {
        await this.qr.release();
      }
    }
  }
}

import { BaseSource } from '@common/infrastructure/services';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FacturadoresOrm } from '@sln/orm/sln/control-egresos/facturadores';
import { HistorialFacturadorOrm } from '@sln/orm/sln/control-egresos/historial-facturador';
import { UsuarioOrm } from '@sln/orm/gen';
import { Like } from 'typeorm';
import {
  fetchFacturasFinalizadasQuery,
  fetchFacturasAsignadasQuery,
  fetchIngresoAbiertos,
  generarExcelFacturacionEgresosQuery,
} from './query/query-facturadores';

@Injectable()
export class FacturadoresImpl extends BaseSource {
  public async getFacturadores() {
    try {
      const facturadoresRepo = this.conn.getRepository(FacturadoresOrm);

      const facturadores = await facturadoresRepo.find({
        relations: ['usuario', 'rol'],
      });

      if (!facturadores) {
        throw new NotFoundException('No se encontraron facturadores');
      }

      return facturadores.map(facturador => ({
        id: facturador.id,
        usuarioId: facturador.usuarioId,
        usuarioNombre: facturador.usuario.nombreCompleto,
        usuarioCedula: facturador.usuario.cedula,
        rolId: facturador.rolId,
        rolNombre: facturador.rol.nombre,
        estado: facturador.estado,
      }));
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async toggleFacturadorEstado(facturadorId: number, nuevoEstado: boolean) {
    return await this.conn.transaction(async manager => {
      const facturadoresRepo = manager.getRepository(FacturadoresOrm);
      const historialRepo = manager.getRepository(HistorialFacturadorOrm);
      const facturador = await facturadoresRepo.findOne({ where: { id: facturadorId } });

      if (!facturador) throw new NotFoundException('Facturador no encontrado');

      const fecha = new Date();
      const estadoAnterior = facturador.estado;
      facturador.estado = nuevoEstado;
      facturador.fechaCambioEstado = fecha;

      await facturadoresRepo.save(facturador);
      await historialRepo.save(
        historialRepo.create({
          facturadorId,
          estadoAnterior,
          estadoNuevo: nuevoEstado,
          fecha,
          usuarioCambioId: this.auth.id,
        })
      );

      return true;
    });
  }

  public async facturasAsignadas(usuarioId: number) {
    try {
      const query = await this.conn.query(fetchFacturasAsignadasQuery(usuarioId));

      return query;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async facturasFinalizadas(usuarioId: number) {
    try {
      const query = await this.conn.query(fetchFacturasFinalizadasQuery(usuarioId));

      return query;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async ingresoAbiertos() {
    try {
      const query = await this.conn.query(fetchIngresoAbiertos());

      return query;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async generarExcelEgresosFacturacion(start: Date, end: Date) {
    const inicioFt = start.toISOString().split('T')[0];
    const finalFt = end.toISOString().split('T')[0];
    try {
      const query = await this.conn.query(generarExcelFacturacionEgresosQuery(), [
        inicioFt,
        finalFt,
      ]);
      return query;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async actualizarFacturador(
    facturadorId: number,
    payload: { rolId: number; estado: boolean }
  ) {
    return await this.conn.transaction(async manager => {
      const facturadoresRepo = manager.getRepository(FacturadoresOrm);
      const historialRepo = manager.getRepository(HistorialFacturadorOrm);
      const facturador = await facturadoresRepo.findOne({ where: { id: facturadorId } });

      if (!facturador) throw new NotFoundException('Facturador no encontrado');

      const estadoAnterior = facturador.estado;
      const estadoCambio = estadoAnterior !== payload.estado;
      facturador.rolId = payload.rolId;
      facturador.estado = payload.estado;

      if (estadoCambio) facturador.fechaCambioEstado = new Date();
      await facturadoresRepo.save(facturador);

      if (estadoCambio) {
        await historialRepo.save(
          historialRepo.create({
            facturadorId,
            estadoAnterior,
            estadoNuevo: payload.estado,
            fecha: facturador.fechaCambioEstado,
            usuarioCambioId: this.auth.id,
          })
        );
      }

      return true;
    });
  }

  public async agregarFacturadores() {
    const USUARIOS = [
      { cedula: '1006790332', rol: 1 },
      { cedula: '1065565471', rol: 2 },
      { cedula: '1193594720', rol: 2 },
      { cedula: '17953148', rol: 2 },
      { cedula: '57442712', rol: 2 },
      { cedula: '1045708349', rol: 3 },
      { cedula: '1003239721', rol: 3 },
      { cedula: '1003238409', rol: 3 },
      { cedula: '49696558', rol: 3 },
      { cedula: '1065853403', rol: 3 },
      { cedula: '1024554563', rol: 3 },
      { cedula: '1065596194', rol: 3 },
      { cedula: '1003376778', rol: 3 },
      { cedula: '1233342912', rol: 4 },
      { cedula: '1065616149', rol: 5 },
      { cedula: '1065830198', rol: 5 },
      { cedula: '49605391', rol: 5 },
      { cedula: '1098718650', rol: 5 },
      { cedula: '1003243855', rol: 5 },
    ];

    try {
      const facturadoresRepo = this.conn.getRepository(FacturadoresOrm);
      const usuariosRepo = this.conn.getRepository(UsuarioOrm);

      for (const usuario of USUARIOS) {
        const user = await usuariosRepo.findOne({
          where: { cedula: Like(usuario.cedula) },
        });

        if (user) {
          const nuevoFacturador = facturadoresRepo.create({
            usuarioId: user.id,
            rolId: usuario.rol,
            estado: true,
            fechaCreacion: new Date(),
          });

          await facturadoresRepo.save(nuevoFacturador);
        }
      }
      return true;
    } catch (error) {
      console.log(error);
    }
  }
}

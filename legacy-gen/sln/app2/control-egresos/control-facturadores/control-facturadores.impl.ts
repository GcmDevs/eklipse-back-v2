import { BaseSource } from '@common/infrastructure/services';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FacturadoresOrm } from '@sln/orm/sln/control-egresos/facturadores';
import { HistorialFacturadorOrm } from '@sln/orm/sln/control-egresos/historial-facturador';
import { RolFacturadorOrm } from '@sln/orm/sln/control-egresos/rol-facturador';
import { UsuarioOrm } from '@sln/orm/gen';
import { EntityManager, Like } from 'typeorm';
import {
  fetchFacturasFinalizadasQuery,
  fetchFacturasAsignadasQuery,
  fetchIngresoAbiertos,
  generarExcelFacturacionEgresosQuery,
  fetchComportamientoRobotQuery,
  fetchDetalleComportamientoRobotQuery,
} from './query/query-facturadores';

@Injectable()
export class FacturadoresImpl extends BaseSource {
  private async verificarHistorialRoles(manager: EntityManager): Promise<void> {
    const [schema] = await manager.query(`
      SELECT COL_LENGTH('dbo.EKSLNEGRFACTURHIST', 'ROLANTERIOR') AS rolAnterior,
             COL_LENGTH('dbo.EKSLNEGRFACTURHIST', 'ROLNUEVO') AS rolNuevo
    `);
    if (!schema?.rolAnterior || !schema?.rolNuevo) {
      throw new ServiceUnavailableException(
        'Falta actualizar el historial de facturadores en esta sede. Ejecuta el script 2026-10-29-historial-roles-facturadores.sql antes de guardar cambios.'
      );
    }
  }
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
        usuarioNombre: facturador.usuario?.nombreCompleto ?? 'Sin usuario registrado',
        usuarioCedula: facturador.usuario?.cedula ?? '',
        rolId: facturador.rolId,
        rolNombre: facturador.rol?.nombre ?? 'Sin rol',
        estado: facturador.estado,
      }));
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async getRoles() {
    return this.conn.getRepository(RolFacturadorOrm).find({
      select: { id: true, nombre: true },
      order: { nombre: 'ASC' },
    });
  }

  public async toggleFacturadorEstado(facturadorId: number, nuevoEstado: boolean) {
    return await this.conn.transaction(async manager => {
      const facturadoresRepo = manager.getRepository(FacturadoresOrm);
      const historialRepo = manager.getRepository(HistorialFacturadorOrm);
      const facturador = await facturadoresRepo.findOne({
        where: { id: facturadorId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!facturador) throw new NotFoundException('Facturador no encontrado');
      if (facturador.estado === nuevoEstado) return true;

      await this.verificarHistorialRoles(manager);

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
          rolAnteriorId: facturador.rolId,
          rolNuevoId: facturador.rolId,
          fecha,
          usuarioCambioId: this.auth.id,
        })
      );

      return true;
    });
  }

  public async facturasAsignadas(usuarioId: number, inicio: Date, fin: Date) {
    try {
      const query = await this.conn.query(fetchFacturasAsignadasQuery(), [usuarioId, inicio, fin]);

      return query;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async facturasFinalizadas(usuarioId: number, inicio: Date, fin: Date) {
    try {
      const query = await this.conn.query(fetchFacturasFinalizadasQuery(), [
        usuarioId,
        inicio,
        fin,
      ]);

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

  public async comportamientoRobot(fecha: Date) {
    return this.conn.query(fetchComportamientoRobotQuery(), [fecha.toISOString().slice(0, 10)]);
  }

  public async detalleComportamientoRobot(usuarioId: number, fecha: Date) {
    return this.conn.query(fetchDetalleComportamientoRobotQuery(), [
      usuarioId,
      fecha.toISOString().slice(0, 10),
    ]);
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
      const facturador = await facturadoresRepo.findOne({
        where: { id: facturadorId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!facturador) throw new NotFoundException('Facturador no encontrado');

      const estadoAnterior = facturador.estado;
      const rolAnteriorId = facturador.rolId;
      const estadoCambio = estadoAnterior !== payload.estado;
      const rolCambio = rolAnteriorId !== payload.rolId;
      const rol = await manager
        .getRepository(RolFacturadorOrm)
        .findOne({ where: { id: payload.rolId } });
      if (!rol) throw new BadRequestException('El rol seleccionado no existe.');
      if (!estadoCambio && !rolCambio) return true;
      await this.verificarHistorialRoles(manager);
      const fecha = new Date();
      facturador.rolId = payload.rolId;
      facturador.estado = payload.estado;

      if (estadoCambio) facturador.fechaCambioEstado = fecha;
      await facturadoresRepo.save(facturador);

      await historialRepo.save(
        historialRepo.create({
          facturadorId,
          estadoAnterior,
          estadoNuevo: payload.estado,
          rolAnteriorId,
          rolNuevoId: payload.rolId,
          fecha,
          usuarioCambioId: this.auth.id,
        })
      );

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

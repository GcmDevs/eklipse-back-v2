import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { CrearDetalleConteoDto } from '@farmacia/inventario/dto/inventarios.dto';
import { AsignacionConteoOrm, DetalleConteoOrm, ProductoEstantesOrm } from '@orm/inn/inventario';

@Injectable()
export class DetalleConteoImpl extends BaseSource {
  public async crearDetalle(dto: CrearDetalleConteoDto) {
    const { usuarioId, numeroConteo, cantidadContada, productoEstanteId, contextCode } = dto;

    const ctx = gcmContextFactory(contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      const detalleRepo = qr.manager.getRepository(DetalleConteoOrm);
      const asignacionRepo = qr.manager.getRepository(AsignacionConteoOrm);
      const productoRepo = qr.manager.getRepository(ProductoEstantesOrm);

      const asignacion = await asignacionRepo.findOne({
        where: { usuarioId, numeroConteo },
      });

      if (!asignacion) {
        throw new NotFoundException(
          'No se encontró asignación de conteo para el usuario y número de conteo proporcionados'
        );
      }

      const productoEstante = await productoRepo.findOne({ where: { id: productoEstanteId } });

      if (!productoEstante) {
        throw new NotFoundException('No se encontró el producto en el estante proporcionado');
      }

      const detalleEntity = detalleRepo.create({
        usuarioId,
        numeroConteo,
        cantidadContada,
      });

      const savedDetalle = await detalleRepo.save(detalleEntity);

      return savedDetalle;
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Error creando detalle de conteo');
    } finally {
      await qr.release();
    }
  }
}

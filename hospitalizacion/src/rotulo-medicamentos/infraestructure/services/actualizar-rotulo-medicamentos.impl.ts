import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RotuloMedicamentoOrm } from '../orm/rotulo-medicamentos';
import { ActualizarRotuloDto } from '@hpn/rotulo-medicamentos/presentation/dto/rotulo-medicamentos.dto';
import { TipoRotulo } from '@hpn/rotulo-medicamentos/shared/types';
import { validarHorariosSolucion } from '@hpn/rotulo-medicamentos/shared/utils/validar-horarios-solucion.util';

@Injectable()
export class ActualizarRotuloMedicamentosImpl extends BaseSource {
  private contexto = () => {
    const context = this.auth.context.getCode();
    return gcmContextFactory(context);
  };
  public async actualizar(id: number, body: ActualizarRotuloDto): Promise<boolean> {
    const cxt = this.contexto();
    const qr = this.dynamicQR(cxt);
    try {
      await qr.startTransaction();
      const rotuloRp = qr.manager.getRepository(RotuloMedicamentoOrm);
      const rotulo = await rotuloRp.findOne({ where: { id } });
      if (!rotulo) {
        throw new BadRequestException('Rótulo no encontrado');
      }

      const tipoRotulo = rotulo.tipoRotulo ?? TipoRotulo.Medicamento;
      if (body.tipoRotulo && body.tipoRotulo !== tipoRotulo) {
        throw new BadRequestException('El tipo del rótulo no puede modificarse');
      }

      validarHorariosSolucion(tipoRotulo, body.preparacion, body.inicio);
      rotulo.updatedAt = new Date();
      rotulo.fechaRotulo = new Date(body.fechaRotulo);
      rotulo.inicio = body.inicio ?? null;

      if (tipoRotulo === TipoRotulo.Solucion) {
        rotulo.mezcla = body.mezcla?.trim() || null;
        if (body.preparacion !== undefined) rotulo.preparacion = body.preparacion;
        rotulo.velocidadInfusion = body.velocidadInfusion?.trim();
        rotulo.finalizacion = body.finalizacion;
      } else {
        rotulo.dosis = body.dosis;
        rotulo.unidadMedida = body.unidadMedida;
        rotulo.viaAdministracion = body.viaAdministracion ?? null;
      }
      await rotuloRp.save(rotulo);
      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}

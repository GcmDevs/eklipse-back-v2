import { BaseSource } from '@common/infrastructure/services';
import { TIPOS_DOCUMENTO } from '@inn/ek-types/inn/documentos';
import { Injectable } from '@nestjs/common';
import { DocumentoOrm } from '@inn/orm/inn';
import { In } from 'typeorm';
import { DevolucionSumPacOrm } from '../orm/devolucion-tradicional';
import { MotivoDevolucionOrm } from '@inn/orm/hcn';
import { groupByKey } from '@common/application/services';

export interface FetchSumPacI {
  start: Date;
  end: Date;
  incluyeAnulados: boolean;
  codigos: string[];
  /** Traer solo si tiene cantidad devuelta. */
  customCond1: boolean;
  /** Busa por consecutivo o cedula. */
  pattern: string;
}

@Injectable()
export class SuministroPacienteCrudSource extends BaseSource {
  public async fetch(payload: FetchSumPacI): Promise<DocumentoOrm[]> {
    const { start, end, incluyeAnulados, codigos, customCond1, pattern } = payload;

    const documentoRp = this.conn.getRepository(DocumentoOrm);

    const documentos = await documentoRp
      .createQueryBuilder('documento')
      .leftJoinAndSelect('documento.creadoPor', 'creadoPor', 'documento.creadoPorId = creadoPor.id')
      .leftJoinAndSelect(
        'documento.confirmadoPor',
        'confirmadoPor',
        'documento.confirmadoPorId = confirmadoPor.id'
      )
      .leftJoinAndSelect(
        'documento.suministrosPaciente',
        'suministrosPaciente',
        'documento.id = suministrosPaciente.id'
      )
      .leftJoinAndSelect(
        'suministrosPaciente.areaServicio',
        'areaServicio',
        'suministrosPaciente.areaServicioId = areaServicio.id'
      )
      .leftJoinAndSelect(
        'suministrosPaciente.ingreso',
        'ingreso',
        'suministrosPaciente.ingresoId = ingreso.id'
      )
      .leftJoinAndSelect('ingreso.paciente', 'paciente', 'ingreso.pacienteId = paciente.id')
      .leftJoinAndSelect(
        'suministrosPaciente.detalle',
        'detalle',
        'detalle.suministroPacienteId = suministrosPaciente.id'
      )
      .leftJoinAndSelect('detalle.producto', 'producto', 'detalle.productoId = producto.id')
      .leftJoinAndSelect(
        'detalle.motivosDevolucion',
        'motivosDevolucion',
        'motivosDevolucion.suministroId = detalle.id'
      )
      .leftJoinAndSelect('detalle.lote', 'lote', 'detalle.loteId = lote.id')
      .where(
        `${start && end ? 'documento.fechaCreacion between :start and :end and ' : ''} 
        ${pattern ? `(paciente.numDoc like '%${pattern}%') and ` : ''} 
        ${!incluyeAnulados ? 'documento.fechaAnulacion is null and ' : ''}
        ${codigos ? `producto.codigo in(${codigos}) and ` : ''}
        ${customCond1 ? 'detalle.cantidadDevuelta > 0 and ' : ''}
        documento.tipoCode in(${TIPOS_DOCUMENTO.suministroPaciente.getCode()})`,
        {
          start,
          end,
        }
      )
      .getMany();

    const documentosIds = documentos.map(el => el.id);

    const devSumPacRp = this.conn.getRepository(DevolucionSumPacOrm);
    const devSumPacs = await devSumPacRp.find({
      where: { documentoId: In(documentosIds) },
      relations: ['creadoPor', 'detalle'],
    });

    documentos.map(dc => {
      let devSumPac: DevolucionSumPacOrm;
      let hasDevSumPac = devSumPacs.filter(dsp => dsp.documentoId === dc.id);
      if (hasDevSumPac.length) {
        devSumPac = hasDevSumPac[0];
        devSumPac.setTypes(true);
        delete devSumPac.documentoId;
        delete devSumPac.creadoPorId;
        delete devSumPac.creadoPor.id;
        delete devSumPac.creadoPor.estadoCode;
        devSumPac.detalle.map(rs => {
          delete rs.devolucionId;
        });
        dc.suministrosPaciente.infoDevolucion = devSumPac;
      }

      delete dc.creadoPor.id;
      delete dc.creadoPor.estadoCode;
      delete dc.confirmadoPor.id;
      delete dc.confirmadoPor.estadoCode;
      delete dc.creadoPorId;
      delete dc.confirmadoPorId;
      delete dc.anuladoPorId;
      delete dc.fechaAnulacion;
      delete dc.suministrosPaciente.id;
      delete dc.suministrosPaciente.areaServicioId;
      delete dc.suministrosPaciente.ingresoId;
      delete dc.suministrosPaciente.tipo;
      delete dc.suministrosPaciente.ingreso.pacienteId;
      dc.suministrosPaciente.ingreso.paciente.setTypes(true);
      dc.suministrosPaciente.detalle.map(dt => {
        if (devSumPac) {
          dt.estadoCode = devSumPac.detalle.filter(rs => rs.suministroId === dt.id)[0].estadoCode;
        }

        dt.motivosDevolucion.map(md => {
          delete md.id;
          delete md.suministroId;
        });

        const a = groupByKey(dt.motivosDevolucion, 'motivo');

        dt.motivosDevolucion = [];

        a.forEach(el => {
          let cant = 0;
          el.rows.forEach(r => {
            cant += r.cantidad;
          });

          const nmd = new MotivoDevolucionOrm();
          nmd.cantidad = cant;
          nmd.motivo = el.key;
          dt.motivosDevolucion.push(nmd);
        });

        delete dt.suministroPacienteId;
        delete dt.loteId;
        delete dt.producto.marca;
        delete dt.producto.precioSugerido;
        dt.producto.setTypes(true);
        delete dt.productoId;
      });
      if (
        dc.suministrosPaciente &&
        dc.suministrosPaciente.infoDevolucion &&
        dc.suministrosPaciente.infoDevolucion.detalle
      ) {
        delete dc.suministrosPaciente.infoDevolucion.detalle;
      }
      dc.setTypes(true);
    });

    return documentos;
  }
}

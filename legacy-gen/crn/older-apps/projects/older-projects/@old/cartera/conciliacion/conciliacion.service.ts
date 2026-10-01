import { BadRequestException, Injectable } from '@nestjs/common';
import { ConciliacionCarteraDto } from './dto';
import { ConciliacionRepository } from './repository';
import * as path from 'path';

@Injectable()
export class ConciliacionService {
  constructor(private readonly repository: ConciliacionRepository) {}

  async getConciliaciones() {
    try {
      const data = await this.repository.getConciliaciones();
      if (data) {
        return {
          success: true,
          message: 'Lista de Conciliaciones Pendientes',
          data,
        };
      } else {
        return { success: false, message: 'No hay Conciliaciones Pendientes' };
      }
    } catch (error) {
      return { success: false, message: 'No hay Conciliaciones Pendientes' };
    }
  }

  async updateConciliacion(id: number, conciliacion: ConciliacionCarteraDto) {
    return this.repository.updateConciliacion(id, conciliacion);
  }

  async updateActa(OID: number, namefile: string) {
    return this.repository.updateActa(OID, namefile);
  }

  async deleteConciliacion(OID: number) {
    return this.repository.deleteConciliacion(OID);
  }

  async getActa(OID: number) {
    try {
      const ruta = await this.repository.getActa(OID);
      if (ruta) {
        const file = path.join(__dirname, '../../../', ruta[0].Ruta);
        return file;
      }
      return '';
    } catch (error) {
      throw new BadRequestException('Ocurrio un Error al Obtener el Acta');
    }
  }
}

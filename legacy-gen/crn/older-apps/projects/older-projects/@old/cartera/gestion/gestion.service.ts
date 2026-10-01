import { Injectable } from '@nestjs/common';
import { GestionCarteraDto } from './dto/gestion.dto';
import { GestionRepository } from './repository';

@Injectable()
export class GestionService {
  constructor(private readonly repository: GestionRepository) {}

  async getGestions() {
    try {
      const data = await this.repository.getGestions();
      if (data) {
        return { success: true, message: 'Gestiones', data };
      } else {
        return { success: false, message: 'No hay gestiones' };
      }
    } catch (error) {
      return { success: false, message: 'No hay gestiones' };
    }
  }

  async getTercero(nit: string) {
    try {
      const data = await this.repository.getTercero(nit);
      if (data) {
        return { success: true, message: 'Tercero', data };
      } else {
        return { success: false, message: 'Tercero no encontrado', data: [] };
      }
    } catch (error) {
      return { success: false, message: 'Tercero no encontrado' };
    }
  }

  async addGestion(gestion: GestionCarteraDto) {
    return await this.repository.addGestion(gestion);
  }

  async deleteGestion(id: number) {
    return await this.repository.deleteGestion(id);
  }

  async updateGestion(id: number, gestion: GestionCarteraDto) {
    return await this.repository.updateGestion(id, gestion);
  }
}

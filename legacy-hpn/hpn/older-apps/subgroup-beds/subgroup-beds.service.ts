import { Injectable } from '@nestjs/common';
import { SubgroupsRepository } from './repository';
import { IBaseService } from './base';

@Injectable()
export class SubgroupBedsService implements IBaseService {
  constructor(private readonly repository: SubgroupsRepository) {}

  async getItems(center?: number): Promise<any> {
    try {
      const data = await this.repository.getItems(center);
      if (!data) {
        return {
          success: false,
          message: 'No se Encontraron Subgrupos',
        };
      } else {
        return {
          success: true,
          message: 'Subgrupos',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'No se encontraron Subgrupos',
      };
    }
  }

  async getItem(id: number): Promise<any> {
    try {
      const data = await this.repository.getItem(id);
      if (!data) {
        return {
          success: false,
          message: 'No se Encontro Subgrupo',
        };
      } else {
        return {
          success: true,
          message: 'Subgrupo',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'No se Encontro Subgrupo',
      };
    }
  }
}

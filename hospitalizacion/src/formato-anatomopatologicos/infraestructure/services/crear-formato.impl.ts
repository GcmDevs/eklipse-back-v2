import { BaseSource } from '@common/infrastructure/services';
import { CrearFormatoMuestraAnatomopatologicaDto } from '@hpn/formato-anatomopatologicos/presentation/dtos';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CrearFormatoMuestrasAnatomopatologicasImpl extends BaseSource {
  public async execute(dto: CrearFormatoMuestraAnatomopatologicaDto) {
    try {
    } catch (error) {}
  }
}

import { Controller, Get } from '@nestjs/common';
import { EklipseService } from './eklipse.service';

@Controller('V1/V2/V3')
export class EklipseController {
  constructor(private readonly eklipseService: EklipseService) {}

  @Get('v10/ekl/centros')
  fetchCentros() {
    return this.eklipseService.fetchCentros();
  }
}

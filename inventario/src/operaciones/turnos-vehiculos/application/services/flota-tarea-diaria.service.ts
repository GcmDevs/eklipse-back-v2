import { Inject, Injectable, Logger } from '@nestjs/common';
import { VencimientoService } from './vencimiento.service';

/**
 * Tarea diaria de UN tenant: solo barre vencimientos. Ya no inserta filas SIN_VERIFICAR.
 */
@Injectable()
export class FlotaTareaDiariaService {
  private readonly logger = new Logger(FlotaTareaDiariaService.name);

  constructor(private readonly vencimientoService: VencimientoService) {}

  async ejecutar(): Promise<void> {
    await this.vencimientoService.resolverTodosVencidos(new Date());
    this.logger.log('Tarea diaria completada (solo barrido de vencimientos)');
  }
}

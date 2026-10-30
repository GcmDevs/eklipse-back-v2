import { INN_AUTHORITIES } from '@inn/authorities';
import {
  AuthoritiesGuard,
  CurrentUserGuard,
  StrictAuthRequest,
  StrictJwtAuthGuard,
} from '@common/infrastructure/guards';
import { Authorities } from '@common/presentation/decorators';
import { buildFlotaStream, flotaStreamTtlMs } from '@inn/operaciones/turnos-vehiculos/application/helpers/flota-stream.helper';
import { FlotaSseBus } from '@inn/operaciones/turnos-vehiculos/application/services/flota-sse.bus';
import { Controller, MessageEvent, Req, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';

@ApiBearerAuth()
@UseGuards(StrictJwtAuthGuard, CurrentUserGuard, AuthoritiesGuard)
@Controller('/v4/inn/amb')
export class FlotaStreamController {
  constructor(private readonly sseBus: FlotaSseBus) { }

  @Authorities([INN_AUTHORITIES.GESTION_FLOTA.OPERAR])
  @Sse('/stream')
  stream(@Req() req: StrictAuthRequest): Observable<MessageEvent> {
    return buildFlotaStream(this.sseBus.stream(), flotaStreamTtlMs(req.tokenExp));
  }
}

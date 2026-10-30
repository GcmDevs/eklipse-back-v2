import { FlotaSsePayload } from '@inn/operaciones/turnos-vehiculos/domain/read';
import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class FlotaSseBus {
  private readonly subject = new Subject<FlotaSsePayload>();

  publish(payload: FlotaSsePayload): void {
    this.subject.next(payload);
  }

  stream(): Observable<FlotaSsePayload> {
    return this.subject.asObservable();
  }
}

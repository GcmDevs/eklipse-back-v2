import { CtmType } from '@common/domain/types';
import { SolEstadoEspecificoCode } from '../_deprecated';

export type EstadoEspecificoCode = 101 | SolEstadoEspecificoCode;

export class EstadoEspecificoType extends CtmType<EstadoEspecificoCode> {}

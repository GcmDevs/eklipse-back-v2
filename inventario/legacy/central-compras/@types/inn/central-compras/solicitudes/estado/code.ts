import { CtmType } from '@common/domain/types';
import { SolEstadoCode } from '../_deprecated';

export type EstadoCode = SolEstadoCode | 101;

export class EstadoType extends CtmType<EstadoCode> {}

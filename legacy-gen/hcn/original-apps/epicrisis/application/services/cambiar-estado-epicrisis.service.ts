import { EpicrisisDto } from '../data-transfers';

export abstract class CambiarEstadoEpicrisisService {
  abstract findByConsecutivo(consecutivo: number): Promise<EpicrisisDto>;

  abstract confirmar(consecutivo: number): Promise<boolean>;

  abstract desconfirmar(consecutivo: number): Promise<boolean>;
}

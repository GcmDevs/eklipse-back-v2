import { ConsecutivosModule } from './consecutivos/consecutivos.module';
import { FirmaModule } from './firmas/firma.module';
import { GenModule } from './gen/gen.module';
import { MediaModule } from './media/media.module';
import { TercerosModule } from './terceros/tercero.module';

export const COR_MODULES = [
  FirmaModule,
  TercerosModule,
  ConsecutivosModule,
  MediaModule,
  GenModule,
];

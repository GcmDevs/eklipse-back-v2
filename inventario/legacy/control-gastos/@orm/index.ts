import { LGC_CGT_ADN_ENTITIES } from './adn';
import { LGC_CGT_GEN_ENTITIES } from './gen';
import { LGC_CGT_INN_ENTITIES } from './inn';

export const LGC_CGT_ENTITIES = [
  ...LGC_CGT_ADN_ENTITIES,
  ...LGC_CGT_GEN_ENTITIES,
  ...LGC_CGT_INN_ENTITIES,
];

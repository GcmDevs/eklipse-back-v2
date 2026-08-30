import { LGC_AFN_ADN_ENTITIES } from './adn';
import { LGC_AFN_GEN_ENTITIES } from './gen';
import { LGC_AFN_INN_ENTITIES } from './inn';

export const LGC_AFN_ENTITIES = [
  ...LGC_AFN_ADN_ENTITIES,
  ...LGC_AFN_GEN_ENTITIES,
  ...LGC_AFN_INN_ENTITIES,
];

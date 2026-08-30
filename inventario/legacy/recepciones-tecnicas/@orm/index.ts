import { LGC_RCT_ADN_ENTITIES } from './adn';
import { LGC_RCT_GEN_ENTITIES } from './gen';
import { LGC_RCT_INN_ENTITIES } from './inn';
import { LGC_RCT_SHARED_ENTITIES } from './shared-bd';

export const LGC_RCT_ENTITIES = [
  ...LGC_RCT_ADN_ENTITIES,
  ...LGC_RCT_GEN_ENTITIES,
  ...LGC_RCT_INN_ENTITIES,
  ...LGC_RCT_SHARED_ENTITIES,
];

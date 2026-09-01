import { LGC_TAS_ADN_ENTITIES } from './adn';
import { LGC_TAS_GCN_ENTITIES } from './gcn';
import { LGC_TAS_GEN_ENTITIES } from './gen';
import { LGC_TAS_HCN_ENTITIES } from './hcn';
import { LGC_TAS_OLD_GENERAL_ENTITIES } from './old/general';
import { LGC_TAS_TEMP_ENTITIES } from './temp';

export const LGC_TAS_ENTITIES = [
  ...LGC_TAS_ADN_ENTITIES,
  ...LGC_TAS_GCN_ENTITIES,
  ...LGC_TAS_GEN_ENTITIES,
  ...LGC_TAS_HCN_ENTITIES,
  ...LGC_TAS_OLD_GENERAL_ENTITIES,
  ...LGC_TAS_TEMP_ENTITIES,
];

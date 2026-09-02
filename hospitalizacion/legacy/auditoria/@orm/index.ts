import { LGC_AUD_ADN_ENTITIES } from './adn';
import { LGC_AUD_GEN_ENTITIES } from './gen';
import { LGC_AUD_HCN_ENTITIES } from './hcn';
import { LGC_AUD_HPN_AUDITORIA_ENTITIES } from './hpn/auditoria';
import { LGC_AUD_TEMP_ENTITIES } from './temp';

export const LGC_AUD_ENTITIES = [
  ...LGC_AUD_ADN_ENTITIES,
  ...LGC_AUD_GEN_ENTITIES,
  ...LGC_AUD_HCN_ENTITIES,
  ...LGC_AUD_HPN_AUDITORIA_ENTITIES,
  ...LGC_AUD_TEMP_ENTITIES,
];

import { TBNMS__ADN__ } from './adn';
import { TBNMS__CRN__ } from './crn';
import { TBNMS__GEN__ } from './gen';
import { TBNMS__HPN__ } from './hpn';
import { TBNMS__INN__ } from './inn';
import { TBNMS__SLN__ } from './sln';
import { TBNMS__HCN__ } from './hcn';
import { TBNMS__COR__ } from './core';

export const TABLE_NAMES = {
  adn: { ...TBNMS__ADN__ },
  cor: { ...TBNMS__COR__ },
  crn: { ...TBNMS__CRN__ },
  gen: { ...TBNMS__GEN__ },
  inn: { ...TBNMS__INN__ },
  sln: { ...TBNMS__SLN__ },
  hpn: { ...TBNMS__HPN__ },
  hcn: { ...TBNMS__HCN__ },
};

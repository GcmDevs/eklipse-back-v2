import { FLLCT__COR__ } from './cor';
import { FLLCT__CRN__ } from './crn';
import { FLLCT__GEN__ } from './gen';
import { FLLCT__INN__ } from './inn';
import { FLLCT__USR__ } from './usr';
export * from './base';

export const FILE_LOCATIONS = {
  gen: { ...FLLCT__GEN__ },
  crn: { ...FLLCT__CRN__ },
  inn: { ...FLLCT__INN__ },
  usr: { ...FLLCT__USR__ },
  cor: { ...FLLCT__COR__ }
};

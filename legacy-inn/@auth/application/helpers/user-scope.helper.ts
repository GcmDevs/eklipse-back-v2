import { UserScopeContext } from '@auth/domain/interfaces/data-scope.interfaces';
import { getUser } from '@common/infrastructure/services';

export const buildUserScope = (): UserScopeContext => {
  const user = getUser();
  return {
    id: user.id,
    metadatos: {},
  };
};

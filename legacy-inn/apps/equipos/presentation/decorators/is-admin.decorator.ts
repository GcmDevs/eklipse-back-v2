import { fetchAuthsByUser, getUser } from '@common/infrastructure/services';
import { createParamDecorator } from '@nestjs/common';

export const HasDirectAuthority = createParamDecorator(
  async (authority: string): Promise<boolean> => {
    const user = getUser();
    const userAuthorities = await fetchAuthsByUser({ id: user.id, ctx: user.context });
    return userAuthorities.onlyCodes.includes(authority);
  }
);

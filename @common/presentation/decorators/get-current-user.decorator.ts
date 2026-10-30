import { UserRequest } from "@common/domain/types";
import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";

export const GetCurrentUser = createParamDecorator((data: unknown, context: ExecutionContext): UserRequest => {
    const req = context.switchToHttp().getRequest();
    const currentUser = req.user;

    if (!currentUser) throw new UnauthorizedException();
    return currentUser
});
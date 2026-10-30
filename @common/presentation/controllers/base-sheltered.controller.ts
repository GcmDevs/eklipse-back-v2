import { CurrentUserGuard } from "@common/infrastructure/guards";
import { UseFilters, UseGuards, UseInterceptors } from "@nestjs/common";
import { CustomExceptionFilter } from "../filters";
import { CustomResponseInterceptor } from "../interceptors";
import { CommonGuards } from "../decorators";

@UseFilters(CustomExceptionFilter)
@UseInterceptors(CustomResponseInterceptor)
@UseGuards(CurrentUserGuard)
@CommonGuards()
export abstract class BaseShelteredController {}
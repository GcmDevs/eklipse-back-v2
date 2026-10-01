import { AuthProveedorOrm } from './auth-tercero.orm';
import { EkCenterOrm } from './ek-center.orm';
import { LastAuthOrm } from './last-auth.orm';

export * from './auth-tercero.orm';
export * from './ek-center.orm';
export * from './last-auth.orm';

export const ORM_SECURITY_ENTITIES = [AuthProveedorOrm, EkCenterOrm, LastAuthOrm];

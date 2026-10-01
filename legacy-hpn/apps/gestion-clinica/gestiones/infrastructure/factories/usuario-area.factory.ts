import { UsuarioAreaOrm } from '@orm/gcn';

export const dataToUsuarioArea = (areaId: number, userId: number, createdBy: number) => {
  const _ = new UsuarioAreaOrm();
  _.area = areaId;
  _.user = userId;
  _.createdBy = createdBy;
  return _;
};

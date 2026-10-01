import { GcmContextType } from './contexts.type';

export interface UserRequest {
  id: number;
  nombre: string;
  documento: string;
  table: string;
  context: GcmContextType;
}

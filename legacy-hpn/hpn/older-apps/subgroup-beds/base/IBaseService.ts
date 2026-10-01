export interface IBaseService {
  getItems(center?: number): Promise<any>;
  getItem(id: number): Promise<any>;
}

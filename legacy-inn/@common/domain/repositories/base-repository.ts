export interface BaseRepository<TDomain, TView> {
  save(entity: TDomain): Promise<TDomain>;
  findById(id: number): Promise<TDomain | null>;
  update(updateEntity: TDomain): Promise<TDomain>;
  delete(id: number): Promise<void>;
  exists(id: number): Promise<boolean>;
  findViewById(id: number): Promise<TView | null>;
  findAllView(page: number, limit: number): Promise<[TView[], number]>;
}

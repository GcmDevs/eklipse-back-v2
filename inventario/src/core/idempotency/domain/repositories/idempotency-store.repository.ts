export interface IdempotencyStoreRepository {
  findByKey(key: string): Promise<{ responseBody: string; responseHash: string } | null>;
  save(key: string, responseHash: string, responseBody: string, ttlMinutes?: number): Promise<void>;
  exists(key: string): Promise<boolean>;
}

import { Injectable } from '@nestjs/common';

interface CacheEntry {
  permisos: Set<string>;
  expiresAt: number;
}

@Injectable()
export class PermisoCacheService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttlMs = 5 * 60 * 1000;

  get(userId: number, context: string | number): Set<string> | null {
    const key = this.buildKey(userId, context);
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.permisos;
  }

  set(userId: number, context: string | number, permisos: Set<string>): void {
    const key = this.buildKey(userId, context);
    this.cache.set(key, {
      permisos,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  invalidate(userId: number, context: string | number): void {
    this.cache.delete(this.buildKey(userId, context));
  }

  private buildKey(userId: number, context: string | number): string {
    return `${userId}:${context}`;
  }
}

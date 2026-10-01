import { KeyPrefix } from 'apps/motor-formatos/domain';
import { randomBytes } from 'crypto';

export class KeyUtils {
  public static generate(prefix: KeyPrefix, label: string): string {
    const slug = KeyUtils.toSlug(label);
    const nonce = KeyUtils.nonce();
    return `${prefix}_${slug}_${nonce}`;
  }

  public static preserveOrGenerate(
    existingKey: string | undefined | null,
    prefix: KeyPrefix,
    label: string
  ): string {
    if (existingKey && KeyUtils.isValid(existingKey)) {
      return existingKey;
    }
    return KeyUtils.generate(prefix, label);
  }

  public static isValid(key: string): boolean {
    return /^[a-z][a-z0-9_]{4,}$/.test(key);
  }

  private static toSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 30);
  }

  private static nonce(): string {
    const buf = randomBytes(4);
    return buf.readUInt32BE(0).toString(36).padStart(6, '0').substring(0, 6);
  }
}
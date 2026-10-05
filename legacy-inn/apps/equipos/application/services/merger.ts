import { BadRequestException } from '@nestjs/common';

export class LegacyDataMerger {
  private missingFields: string[] = [];

  getValue<T>(
    userValue: T | undefined | null,
    legacyValue: T | undefined | null,
    fieldName: string,
    isRequired: boolean = false
  ): T | null {
    if (userValue !== undefined && userValue !== null) {
      return userValue as T;
    }

    if (legacyValue !== undefined && legacyValue !== null) {
      return legacyValue;
    }

    if (isRequired) {
      this.missingFields.push(fieldName);
    }

    return null;
  }

  validateAndThrow(): void {
    if (this.missingFields.length > 0) {
      throw new BadRequestException(
        `Faltan los siguientes campos obligatorios: ${this.missingFields.join(', ')}. ` +
          `Estos campos no están en el legacy ni fueron proporcionados por el usuario.`
      );
    }
  }

  getMissingFields(): string[] {
    return this.missingFields;
  }
}

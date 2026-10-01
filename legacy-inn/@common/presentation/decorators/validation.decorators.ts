import { applyDecorators } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  ArrayNotEmpty,
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  ValidateIf,
  ValidateBy,
} from 'class-validator';

type ClassType<T = unknown> = new (...args: never[]) => T;
type EnumType = Record<string, string | number>;
type ValidationPredicate<T = any> = (object: T, value?: any) => boolean;

interface TextValidationOptions {
  minLength?: number;
  maxLength?: number;
}

interface NumberValidationOptions {
  min?: number;
  max?: number;
}

function textLengthDecorators(options: TextValidationOptions): PropertyDecorator[] {
  const decorators: PropertyDecorator[] = [];
  if (options.minLength !== undefined) {
    decorators.push(
      MinLength(options.minLength, {
        message: ({ property }) =>
          `${property} debe tener al menos ${options.minLength} caracteres.`,
      })
    );
  }
  if (options.maxLength !== undefined) {
    decorators.push(
      MaxLength(options.maxLength, {
        message: ({ property }) => `${property} no puede superar ${options.maxLength} caracteres.`,
      })
    );
  }
  return decorators;
}

function numberRangeDecorators(options: NumberValidationOptions): PropertyDecorator[] {
  const decorators: PropertyDecorator[] = [];
  if (options.min !== undefined) {
    decorators.push(
      Min(options.min, {
        message: ({ property }) => `${property} debe ser mayor o igual a ${options.min}.`,
      })
    );
  }
  if (options.max !== undefined) {
    decorators.push(
      Max(options.max, {
        message: ({ property }) => `${property} debe ser menor o igual a ${options.max}.`,
      })
    );
  }
  return decorators;
}

export function RequiredText(options: TextValidationOptions = {}): PropertyDecorator {
  return applyDecorators(
    IsString({ message: ({ property }) => `${property} debe ser un texto.` }),
    IsNotEmpty({ message: ({ property }) => `${property} es obligatorio.` }),
    Matches(/\S/, {
      message: ({ property }) => `${property} no puede contener únicamente espacios.`,
    }),
    ...textLengthDecorators(options)
  );
}

export function RequiredTextWhen<T = any>(
  predicate: ValidationPredicate<T>,
  options: TextValidationOptions = {}
): PropertyDecorator {
  return applyDecorators(ValidateIf(predicate as ValidationPredicate), RequiredText(options));
}

export function TextAllowedOnlyWhen<T = any>(
  predicate: ValidationPredicate<T>,
  options: TextValidationOptions = {}
): PropertyDecorator {
  return ValidateBy({
    name: 'textAllowedOnlyWhen',
    constraints: [predicate, options],
    validator: {
      validate(value: unknown, args): boolean {
        const [condition, validationOptions] = args.constraints as [
          ValidationPredicate,
          TextValidationOptions,
        ];
        if (!condition(args.object, value)) {
          return value === undefined || value === null || value === '';
        }
        if (typeof value !== 'string' || !/\S/.test(value)) return false;
        if (validationOptions.minLength !== undefined && value.length < validationOptions.minLength)
          return false;
        return (
          validationOptions.maxLength === undefined || value.length <= validationOptions.maxLength
        );
      },
      defaultMessage(args): string {
        return `${args.property} es obligatorio únicamente cuando aplica la condición indicada.`;
      },
    },
  });
}

export function OptionalText(options: TextValidationOptions = {}): PropertyDecorator {
  return applyDecorators(
    IsOptional(),
    IsString({ message: ({ property }) => `${property} debe ser un texto.` }),
    ...textLengthDecorators(options)
  );
}

export function RequiredInteger(options: NumberValidationOptions = {}): PropertyDecorator {
  return applyDecorators(
    Type(() => Number),
    IsInt({ message: ({ property }) => `${property} debe ser un número entero.` }),
    ...numberRangeDecorators(options)
  );
}

export function RequiredIntegerWhen<T = any>(
  predicate: ValidationPredicate<T>,
  options: NumberValidationOptions = {}
): PropertyDecorator {
  return applyDecorators(ValidateIf(predicate as ValidationPredicate), RequiredInteger(options));
}

export function OptionalInteger(options: NumberValidationOptions = {}): PropertyDecorator {
  return applyDecorators(
    IsOptional(),
    Type(() => Number),
    IsInt({ message: ({ property }) => `${property} debe ser un número entero.` }),
    ...numberRangeDecorators(options)
  );
}

export function RequiredNumber(options: NumberValidationOptions = {}): PropertyDecorator {
  return applyDecorators(
    Type(() => Number),
    IsNumber({}, { message: ({ property }) => `${property} debe ser un número.` }),
    ...numberRangeDecorators(options)
  );
}

export function RequiredNumberWhen<T = any>(
  predicate: ValidationPredicate<T>,
  options: NumberValidationOptions = {}
): PropertyDecorator {
  return applyDecorators(ValidateIf(predicate as ValidationPredicate), RequiredNumber(options));
}

export function OptionalNumber(options: NumberValidationOptions = {}): PropertyDecorator {
  return applyDecorators(
    IsOptional(),
    Type(() => Number),
    IsNumber({}, { message: ({ property }) => `${property} debe ser un número.` }),
    ...numberRangeDecorators(options)
  );
}

export function RequiredEnum(enumType: EnumType): PropertyDecorator {
  return applyDecorators(
    IsNotEmpty({ message: ({ property }) => `${property} es obligatorio.` }),
    IsEnum(enumType, {
      message: ({ property }) => `${property} contiene un valor no permitido.`,
    })
  );
}

export function OptionalEnum(enumType: EnumType): PropertyDecorator {
  return applyDecorators(
    IsOptional(),
    IsEnum(enumType, {
      message: ({ property }) => `${property} contiene un valor no permitido.`,
    })
  );
}

export function RequiredEnumWhen<T = any>(
  enumType: EnumType,
  predicate: ValidationPredicate<T>
): PropertyDecorator {
  return applyDecorators(ValidateIf(predicate as ValidationPredicate), RequiredEnum(enumType));
}

export function RequiredBoolean(): PropertyDecorator {
  return applyDecorators(
    IsBoolean({ message: ({ property }) => `${property} debe ser verdadero o falso.` })
  );
}

export function OptionalBoolean(): PropertyDecorator {
  return applyDecorators(
    IsOptional(),
    IsBoolean({ message: ({ property }) => `${property} debe ser verdadero o falso.` })
  );
}

export function OptionalBooleanQuery(): PropertyDecorator {
  return applyDecorators(
    IsOptional(),
    Transform(({ value }) => {
      if (value === true || value === 'true') return true;
      if (value === false || value === 'false') return false;
      return value;
    }),
    IsBoolean({ message: ({ property }) => `${property} debe ser verdadero o falso.` })
  );
}

export function RequiredObject(): PropertyDecorator {
  return applyDecorators(
    IsObject({ message: ({ property }) => `${property} debe ser un objeto.` })
  );
}

export function RequiredDateString(): PropertyDecorator {
  return applyDecorators(
    IsDateString({}, { message: ({ property }) => `${property} debe ser una fecha ISO válida.` })
  );
}

export function OptionalDateString(): PropertyDecorator {
  return applyDecorators(
    IsOptional(),
    IsDateString({}, { message: ({ property }) => `${property} debe ser una fecha ISO válida.` })
  );
}

export function OptionalDate(): PropertyDecorator {
  return applyDecorators(
    IsOptional(),
    Type(() => Date),
    IsDate({ message: ({ property }) => `${property} debe ser una fecha válida.` })
  );
}

export function RequiredDate(): PropertyDecorator {
  return applyDecorators(
    Type(() => Date),
    IsDate({ message: ({ property }) => `${property} debe ser una fecha válida.` })
  );
}

export function RequiredNested(type: () => ClassType): PropertyDecorator {
  return applyDecorators(ValidateNested(), Type(type));
}

export function OptionalNested(type: () => ClassType): PropertyDecorator {
  return applyDecorators(IsOptional(), ValidateNested(), Type(type));
}

export function OptionalNestedWhen<T = any>(
  type: () => ClassType,
  predicate: ValidationPredicate<T>
): PropertyDecorator {
  return applyDecorators(
    ValidateIf(predicate as ValidationPredicate),
    IsOptional(),
    ValidateNested(),
    Type(type)
  );
}

export function RequiredNestedArray(type: () => ClassType): PropertyDecorator {
  return applyDecorators(IsArray(), ValidateNested({ each: true }), Type(type));
}

export function OptionalNestedArray(
  type: () => ClassType,
  options: { minSize?: number; maxSize?: number } = {}
): PropertyDecorator {
  const decorators: PropertyDecorator[] = [
    IsOptional(),
    IsArray(),
    ValidateNested({ each: true }),
    Type(type),
  ];
  if (options.minSize !== undefined) {
    decorators.push(ArrayMinSize(options.minSize));
  }
  if (options.maxSize !== undefined) {
    decorators.push(ArrayMaxSize(options.maxSize));
  }
  return applyDecorators(...decorators);
}

export function OptionalIntegerArray(
  options: NumberValidationOptions & { nonEmpty?: boolean } = {}
): PropertyDecorator {
  const rangeDecorators: PropertyDecorator[] = [];
  if (options.min !== undefined) {
    rangeDecorators.push(
      Min(options.min, {
        each: true,
        message: ({ property }) =>
          `Cada valor de ${property} debe ser mayor o igual a ${options.min}.`,
      })
    );
  }
  if (options.max !== undefined) {
    rangeDecorators.push(
      Max(options.max, {
        each: true,
        message: ({ property }) =>
          `Cada valor de ${property} debe ser menor o igual a ${options.max}.`,
      })
    );
  }

  const decorators: PropertyDecorator[] = [
    IsOptional(),
    Transform(({ value }) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (Array.isArray(value)) return value.map(Number);
      if (typeof value === 'string' && value.startsWith('[')) {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) && parsed.length ? parsed.map(Number) : undefined;
        } catch {
          return value;
        }
      }
      return [Number(value)];
    }),
    IsArray({ message: ({ property }) => `${property} debe ser una lista.` }),
    IsInt({
      each: true,
      message: ({ property }) => `Cada valor de ${property} debe ser un número entero.`,
    }),
  ];
  if (options.nonEmpty) {
    decorators.push(
      ArrayNotEmpty({
        message: ({ property }) => `${property} debe contener al menos un elemento.`,
      })
    );
  }
  decorators.push(...rangeDecorators);
  return applyDecorators(...decorators);
}

export function RequiredIntegerArray(options: NumberValidationOptions = {}): PropertyDecorator {
  const rangeDecorators: PropertyDecorator[] = [];
  if (options.min !== undefined) {
    rangeDecorators.push(
      Min(options.min, {
        each: true,
        message: ({ property }) =>
          `Cada valor de ${property} debe ser mayor o igual a ${options.min}.`,
      })
    );
  }
  if (options.max !== undefined) {
    rangeDecorators.push(
      Max(options.max, {
        each: true,
        message: ({ property }) =>
          `Cada valor de ${property} debe ser menor o igual a ${options.max}.`,
      })
    );
  }

  return applyDecorators(
    IsArray({ message: ({ property }) => `${property} debe ser una lista.` }),
    ArrayNotEmpty({
      message: ({ property }) => `${property} debe contener al menos un elemento.`,
    }),
    IsInt({
      each: true,
      message: ({ property }) => `Cada valor de ${property} debe ser un número entero.`,
    }),
    ...rangeDecorators
  );
}

import { BadInputError } from '@common/domain/errors';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EntregaDeclaracion } from './entities/entrega-declaracion.entity';
import { LimpiezaFlota } from './entities/limpieza.entity';
import {
  CausaCierreDeclaracion,
  EstadoDeclaracion,
  EstadoLimpieza,
  RespuestaEntregaItem,
  RolDeclaracion,
} from './enums';
import {
  countPendientesLimpieza,
  isItemAplicableLimpieza,
  parseRolDeclaracion,
} from './policies/declaracion-modalidad.policy';
import {
  flattenPlantillaLimpiezaPorTipo,
  seedLimpiezaItemsFromPlantilla,
} from './policies/plantilla-merge.policy';
import {
  PatchDotacionItemDto,
  PatchEntregaItemDto,
  PatchLimpiezaItemDto,
} from '../presentation/dto/flota.dto';
import { PlantillaEstructuraJson } from './types';
import { VencimientoService } from '../application/services/vencimiento.service';

const mockPlantillaLimpieza: PlantillaEstructuraJson = {
  categorias: [
    {
      key: 'cat_lim_movil',
      nombre: 'Unidad móvil',
      orden: 1,
      items: Array.from({ length: 17 }, (_, i) => ({
        key: `lim_${String(i + 1).padStart(2, '0')}`,
        texto: `Item movil ${i + 1}`,
        orden: i + 1,
      })),
    },
    {
      key: 'cat_lim_admin',
      nombre: 'Carro administrativo',
      orden: 2,
      items: [
        { key: 'lim_18', texto: 'Item admin 18', orden: 1 },
        { key: 'lim_19', texto: 'Item admin 19', orden: 2 },
        { key: 'lim_20', texto: 'Item admin 20', orden: 3 },
        { key: 'lim_21', texto: 'Item admin 21', orden: 4 },
      ],
    },
  ],
};

describe('Correcciones Defectos Backend Flota', () => {
  describe('1. Declaración de entrega que se cierra al guardar', () => {
    it('no vence una declaración EN_EDICION sin límite de edición definido', async () => {
      const declSinLimite = EntregaDeclaracion.rebuild(
        1,
        10,
        RolDeclaracion.ENTREGA,
        100,
        new Date(),
        EstadoDeclaracion.EN_EDICION,
        undefined,
        undefined,
        undefined, // limiteEdicion undefined
        undefined,
        {
          items: [
            { key: 'it_01', respuesta: RespuestaEntregaItem.SIN_REPORTAR, observacion: null, evidencias: [] },
          ],
        },
        new Date(),
        new Date(),
      );

      const mockDeclRepo: any = {
        findById: jest.fn().mockResolvedValue(declSinLimite),
        update: jest.fn(),
      };

      const service = new VencimientoService(
        null as any,
        null as any,
        null as any,
        mockDeclRepo,
        null as any,
        null as any,
        null as any,
        null as any,
        null as any,
      );

      await service.ensureResolvedBeforeUse({ declId: 1 }, new Date());
      expect(mockDeclRepo.update).not.toHaveBeenCalled();
      expect(declSinLimite.getEstado).toBe(EstadoDeclaracion.EN_EDICION);
    });

    it('permite guardar un ítem en declaración ENTREGA sin límite de edición y se mantiene editable', () => {
      const decl = EntregaDeclaracion.rebuild(
        1,
        10,
        RolDeclaracion.ENTREGA,
        100,
        new Date(),
        EstadoDeclaracion.EN_EDICION,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          items: [
            { key: 'it_01', respuesta: RespuestaEntregaItem.SIN_REPORTAR, observacion: null, evidencias: [] },
          ],
        },
        new Date(),
        new Date(),
      );

      decl.updateItem('it_01', { respuesta: RespuestaEntregaItem.SI }, new Date(), 100);
      expect(decl.getDatos.items[0].respuesta).toBe(RespuestaEntregaItem.SI);
      expect(decl.getEstado).toBe(EstadoDeclaracion.EN_EDICION);
    });
  });

  describe('2. Contrato del error INCOMPLETA', () => {
    it('en EntregaDeclaracion devuelve businessCode INCOMPLETA con details.pendientes como entero', () => {
      const decl = EntregaDeclaracion.rebuild(
        1,
        10,
        RolDeclaracion.ENTREGA,
        100,
        new Date(),
        EstadoDeclaracion.EN_EDICION,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          items: [
            { key: 'it_01', respuesta: RespuestaEntregaItem.SI, observacion: null, evidencias: [] },
            { key: 'it_02', respuesta: RespuestaEntregaItem.SIN_REPORTAR, observacion: null, evidencias: [] },
            { key: 'it_03', respuesta: RespuestaEntregaItem.SIN_REPORTAR, observacion: null, evidencias: [] },
          ],
        },
        new Date(),
        new Date(),
      );

      try {
        decl.cerrarManual(false, new Date(), 100);
        fail('Debió lanzar BadInputError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadInputError);
        expect(err.businessCode).toBe('INCOMPLETA');
        expect(typeof err.details?.pendientes).toBe('number');
        expect(err.details?.pendientes).toBe(2);
        expect(Number.isInteger(err.details?.pendientes)).toBe(true);
      }
    });

    it('en EntregaDeclaracion con confirmarIncompleto = true se cierra como PARCIAL', () => {
      const decl = EntregaDeclaracion.rebuild(
        1,
        10,
        RolDeclaracion.ENTREGA,
        100,
        new Date(),
        EstadoDeclaracion.EN_EDICION,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          items: [
            { key: 'it_01', respuesta: RespuestaEntregaItem.SI, observacion: null, evidencias: [] },
            { key: 'it_02', respuesta: RespuestaEntregaItem.SIN_REPORTAR, observacion: null, evidencias: [] },
          ],
        },
        new Date(),
        new Date(),
      );

      decl.cerrarManual(true, new Date(), 100);
      expect(decl.getEstado).toBe(EstadoDeclaracion.CERRADA);
      expect(decl.getCausaCierre).toBe(CausaCierreDeclaracion.MANUAL);
    });

    it('en LimpiezaFlota devuelve businessCode INCOMPLETA con details.pendientes como entero', () => {
      const datos = {
        items: [
          { key: 'lim_01', respuesta: 'C' as const, observacion: null, evidencias: [] },
          { key: 'lim_02', respuesta: null, observacion: null, evidencias: [] },
          { key: 'lim_03', respuesta: null, observacion: null, evidencias: [] },
        ],
      };
      const limpieza = LimpiezaFlota.createBorrador(1, 10, 5, 100, datos);

      try {
        limpieza.finalizar(false, new Date(), 100, 'AMBULANCIA');
        fail('Debió lanzar BadInputError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadInputError);
        expect(err.businessCode).toBe('INCOMPLETA');
        expect(typeof err.details?.pendientes).toBe('number');
        expect(err.details?.pendientes).toBe(2);
        expect(Number.isInteger(err.details?.pendientes)).toBe(true);
      }
    });
  });

  describe('3. Aplicabilidad de limpieza (AMBULANCIA vs CARRO_ADMINISTRATIVO)', () => {
    it('isItemAplicableLimpieza clasifica lim_01..lim_17 para AMBULANCIA y lim_18..lim_21 para ADMIN', () => {
      expect(isItemAplicableLimpieza('lim_01', 'AMBULANCIA')).toBe(true);
      expect(isItemAplicableLimpieza('lim_17', 'AMBULANCIA')).toBe(true);
      expect(isItemAplicableLimpieza('lim_18', 'AMBULANCIA')).toBe(false);
      expect(isItemAplicableLimpieza('lim_21', 'AMBULANCIA')).toBe(false);

      expect(isItemAplicableLimpieza('lim_18', 'CARRO_ADMINISTRATIVO')).toBe(true);
      expect(isItemAplicableLimpieza('lim_21', 'CARRO_ADMINISTRATIVO')).toBe(true);
      expect(isItemAplicableLimpieza('lim_01', 'CARRO_ADMINISTRATIVO')).toBe(false);
    });

    it('seedLimpiezaItemsFromPlantilla para AMBULANCIA genera exactamente 17 ítems', () => {
      const items = seedLimpiezaItemsFromPlantilla(mockPlantillaLimpieza, 'AMBULANCIA');
      expect(items).toHaveLength(17);
      expect(items.every(i => isItemAplicableLimpieza(i.key, 'AMBULANCIA'))).toBe(true);
    });

    it('flattenPlantillaLimpiezaPorTipo para CARRO_ADMINISTRATIVO genera exactamente 4 ítems', () => {
      const items = flattenPlantillaLimpiezaPorTipo(mockPlantillaLimpieza, 'CARRO_ADMINISTRATIVO');
      expect(items).toHaveLength(4);
      expect(items.map(i => i.key)).toEqual(['lim_18', 'lim_19', 'lim_20', 'lim_21']);
    });

    it('countPendientesLimpieza solo cuenta ítems aplicables al tipo de vehículo', () => {
      const items = [
        { key: 'lim_01', respuesta: 'C' as const },
        { key: 'lim_02', respuesta: null },
        { key: 'lim_18', respuesta: null }, // no aplicable para AMBULANCIA
      ];
      expect(countPendientesLimpieza(items, 'AMBULANCIA')).toBe(1);
      expect(countPendientesLimpieza(items, 'CARRO_ADMINISTRATIVO')).toBe(1);
    });

    it('LimpiezaFlota queda DILIGENCIADO cuando todos los aplicables a AMBULANCIA están respondidos', () => {
      const items = seedLimpiezaItemsFromPlantilla(mockPlantillaLimpieza, 'AMBULANCIA');
      for (const item of items) {
        item.respuesta = 'C';
      }
      const limpieza = LimpiezaFlota.createBorrador(1, 10, 5, 100, { items });
      limpieza.finalizar(false, new Date(), 100, 'AMBULANCIA');
      expect(limpieza.getEstado).toBe(EstadoLimpieza.DILIGENCIADO);
    });
  });

  describe('5 & 8. Validación de DTOs y Evidencias', () => {
    it('PatchEntregaItemDto rechaza respuestas no permitidas', async () => {
      const dto = plainToInstance(PatchEntregaItemDto, {
        respuesta: 'INVENTADO',
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'respuesta')).toBe(true);
    });

    it('PatchEntregaItemDto rechaza evidencias con ID <= 0', async () => {
      const dtoCero = plainToInstance(PatchEntregaItemDto, {
        respuesta: 'SI',
        evidencias: [0],
      });
      const errorsCero = await validate(dtoCero);
      expect(errorsCero.some(e => e.property === 'evidencias')).toBe(true);

      const dtoNegativo = plainToInstance(PatchEntregaItemDto, {
        respuesta: 'SI',
        evidencias: [-3],
      });
      const errorsNeg = await validate(dtoNegativo);
      expect(errorsNeg.some(e => e.property === 'evidencias')).toBe(true);

      const dtoValido = plainToInstance(PatchEntregaItemDto, {
        respuesta: 'SI',
        evidencias: [1, 2, 45],
      });
      const errorsValido = await validate(dtoValido);
      expect(errorsValido.some(e => e.property === 'evidencias')).toBe(false);
    });

    it('PatchEntregaItemDto exige observación cuando respuesta es NO', async () => {
      const dtoSinObs = plainToInstance(PatchEntregaItemDto, {
        respuesta: 'NO',
      });
      const errors = await validate(dtoSinObs);
      expect(errors.some(e => e.property === 'observacion')).toBe(true);

      const dtoConObs = plainToInstance(PatchEntregaItemDto, {
        respuesta: 'NO',
        observacion: 'Falta linterna de emergencia',
      });
      const errorsOk = await validate(dtoConObs);
      expect(errorsOk.length).toBe(0);
    });

    it('PatchLimpiezaItemDto rechaza respuestas no válidas', async () => {
      const dto = plainToInstance(PatchLimpiezaItemDto, {
        respuesta: 'NO_PERMITIDO',
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'respuesta')).toBe(true);
    });

    it('PatchLimpiezaItemDto exige observación para NC', async () => {
      const dto = plainToInstance(PatchLimpiezaItemDto, {
        respuesta: 'NC',
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'observacion')).toBe(true);
    });

    it('PatchLimpiezaItemDto rechaza evidencias <= 0', async () => {
      const dto = plainToInstance(PatchLimpiezaItemDto, {
        respuesta: 'C',
        evidencias: [0],
      });
      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'evidencias')).toBe(true);
    });

    it('PatchDotacionItemDto valida estado con enum EstadoItemDotacion', async () => {
      const dtoInvalido = plainToInstance(PatchDotacionItemDto, {
        estado: 'ESTADO_RARO',
      });
      const errors = await validate(dtoInvalido);
      expect(errors.some(e => e.property === 'estado')).toBe(true);

      const dtoValido = plainToInstance(PatchDotacionItemDto, {
        estado: 'CONFORME',
      });
      const errorsValido = await validate(dtoValido);
      expect(errorsValido.length).toBe(0);
    });
  });

  describe('7. Borrado y preservación de observaciones', () => {
    it('EntregaDeclaracion: omitir observacion en patch conserva la existente', () => {
      const decl = EntregaDeclaracion.rebuild(
        1,
        10,
        RolDeclaracion.ENTREGA,
        100,
        new Date(),
        EstadoDeclaracion.EN_EDICION,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          items: [
            { key: 'it_01', respuesta: RespuestaEntregaItem.SI, observacion: 'Obs existente', evidencias: [] },
          ],
        },
        new Date(),
        new Date(),
      );

      // Omitimos observacion
      decl.updateItem('it_01', { respuesta: RespuestaEntregaItem.SI }, new Date(), 100);
      expect(decl.getDatos.items[0].observacion).toBe('Obs existente');
    });

    it('EntregaDeclaracion: enviar null borra la observación si respuesta es SI', () => {
      const decl = EntregaDeclaracion.rebuild(
        1,
        10,
        RolDeclaracion.ENTREGA,
        100,
        new Date(),
        EstadoDeclaracion.EN_EDICION,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          items: [
            { key: 'it_01', respuesta: RespuestaEntregaItem.SI, observacion: 'Obs previa', evidencias: [] },
          ],
        },
        new Date(),
        new Date(),
      );

      decl.updateItem('it_01', { observacion: null }, new Date(), 100);
      expect(decl.getDatos.items[0].observacion).toBeNull();
    });

    it('EntregaDeclaracion: enviar null o vacio falla si la respuesta es NO', () => {
      const decl = EntregaDeclaracion.rebuild(
        1,
        10,
        RolDeclaracion.ENTREGA,
        100,
        new Date(),
        EstadoDeclaracion.EN_EDICION,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          items: [
            { key: 'it_01', respuesta: RespuestaEntregaItem.NO, observacion: 'Motivo', evidencias: [] },
          ],
        },
        new Date(),
        new Date(),
      );

      expect(() => {
        decl.updateItem('it_01', { observacion: null }, new Date(), 100);
      }).toThrow(BadInputError);

      expect(() => {
        decl.updateItem('it_01', { observacion: '   ' }, new Date(), 100);
      }).toThrow(BadInputError);
    });

    it('LimpiezaFlota: omitir observacion en patch conserva la existente', () => {
      const limpieza = LimpiezaFlota.createBorrador(1, 10, 5, 100, {
        items: [{ key: 'lim_01', respuesta: 'C', observacion: 'Conservar esto', evidencias: [] }],
      });

      limpieza.updateItem('lim_01', { respuesta: 'C' }, 100, 'AMBULANCIA');
      expect(limpieza.getDatos?.items[0].observacion).toBe('Conservar esto');
    });

    it('LimpiezaFlota: enviar null o cadena vacía borra la observación si respuesta no es NC', () => {
      const limpieza = LimpiezaFlota.createBorrador(1, 10, 5, 100, {
        items: [{ key: 'lim_01', respuesta: 'C', observacion: 'Previa', evidencias: [] }],
      });

      limpieza.updateItem('lim_01', { observacion: null }, 100, 'AMBULANCIA');
      expect(limpieza.getDatos?.items[0].observacion).toBeNull();
    });

    it('LimpiezaFlota: enviar null o vacio falla si la respuesta es NC', () => {
      const limpieza = LimpiezaFlota.createBorrador(1, 10, 5, 100, {
        items: [{ key: 'lim_01', respuesta: 'NC', observacion: 'Sucio', evidencias: [] }],
      });

      expect(() => {
        limpieza.updateItem('lim_01', { observacion: null }, 100, 'AMBULANCIA');
      }).toThrow(BadInputError);

      expect(() => {
        limpieza.updateItem('lim_01', { observacion: '' }, 100, 'AMBULANCIA');
      }).toThrow(BadInputError);
    });
  });

  describe('8. Validación de Evidencias en Entidades de Dominio', () => {
    it('EntregaDeclaracion rechaza IDs de evidencia <= 0', () => {
      const decl = EntregaDeclaracion.rebuild(
        1,
        10,
        RolDeclaracion.ENTREGA,
        100,
        new Date(),
        EstadoDeclaracion.EN_EDICION,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          items: [{ key: 'it_01', respuesta: RespuestaEntregaItem.SI, observacion: null, evidencias: [] }],
        },
        new Date(),
        new Date(),
      );

      expect(() => {
        decl.updateItem('it_01', { evidencias: [0] }, new Date(), 100);
      }).toThrow(BadInputError);

      expect(() => {
        decl.updateItem('it_01', { evidencias: [-1] }, new Date(), 100);
      }).toThrow(BadInputError);
    });

    it('LimpiezaFlota rechaza IDs de evidencia <= 0', () => {
      const limpieza = LimpiezaFlota.createBorrador(1, 10, 5, 100, {
        items: [{ key: 'lim_01', respuesta: 'C', observacion: null, evidencias: [] }],
      });

      expect(() => {
        limpieza.updateItem('lim_01', { evidencias: [0] }, 100, 'AMBULANCIA');
      }).toThrow(BadInputError);

      expect(() => {
        limpieza.updateItem('lim_01', { evidencias: [-2] }, 100, 'AMBULANCIA');
      }).toThrow(BadInputError);
    });
  });

  describe('5. Validación de rol en rutas (:rol)', () => {
    it('parseRolDeclaracion acepta únicamente ENTREGA y RECEPCION', () => {
      expect(parseRolDeclaracion('ENTREGA')).toBe(RolDeclaracion.ENTREGA);
      expect(parseRolDeclaracion('entrega')).toBe(RolDeclaracion.ENTREGA);
      expect(parseRolDeclaracion('RECEPCION')).toBe(RolDeclaracion.RECEPCION);
      expect(parseRolDeclaracion('recepcion')).toBe(RolDeclaracion.RECEPCION);

      expect(() => parseRolDeclaracion('OTRO')).toThrow(BadInputError);
      expect(() => parseRolDeclaracion('SUPERVISOR')).toThrow(BadInputError);
      expect(() => parseRolDeclaracion('')).toThrow(BadInputError);
      expect(() => parseRolDeclaracion(null as any)).toThrow(BadInputError);
    });
  });
});

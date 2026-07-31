import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TipoRotulo } from '../../shared/types';
import { CrearRotuloDto } from './rotulo-medicamentos.dto';

const base = {
  consecutivo: 1,
  pacienteId: 1,
  folio: 1,
  codigoProducto: 'ABC',
  documento: '123',
  fechaRotulo: '2026-07-28',
  cama: '201',
};

describe('CrearRotuloDto', () => {
  it('mantiene compatible el contrato anterior como medicamento', async () => {
    const dto = plainToInstance(CrearRotuloDto, {
      ...base,
      dosis: 1,
      unidadMedida: 'mg',
      inicio: '10:00',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('acepta una solución completa sin dosis, unidad ni preparación', async () => {
    const dto = plainToInstance(CrearRotuloDto, {
      ...base,
      tipoRotulo: TipoRotulo.Solucion,
      inicio: '10:00',
      velocidadInfusion: '100 ml/h',
      finalizacion: '08:00',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rechaza soluciones incompletas y horas inválidas cuando preparación es enviada', async () => {
    const dto = plainToInstance(CrearRotuloDto, {
      ...base,
      tipoRotulo: TipoRotulo.Solucion,
      preparacion: '25:00',
      inicio: '10:00',
    });
    const propiedades = (await validate(dto)).map(error => error.property);
    expect(propiedades).toEqual(
      expect.arrayContaining(['preparacion', 'velocidadInfusion', 'finalizacion'])
    );
  });
});

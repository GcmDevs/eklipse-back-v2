import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAmbulanciaFlotaDto } from './flota.dto';

describe('CreateAmbulanciaFlotaDto (POST /ambulancias)', () => {
  it('acepta { activoId, tipoAmbulancia }', async () => {
    const dto = plainToInstance(CreateAmbulanciaFlotaDto, { activoId: 44, tipoAmbulancia: 'TAM' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.activoId).toBe(44);
  });

  it('rechaza el body viejo { vehiculoId, tipoAmbulancia }', async () => {
    const dto = plainToInstance(CreateAmbulanciaFlotaDto, { vehiculoId: 44, tipoAmbulancia: 'TAM' });
    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'activoId')).toBe(true);
    expect((dto as any).vehiculoId).toBe(44);
    expect(dto.activoId).toBeUndefined();
  });
});

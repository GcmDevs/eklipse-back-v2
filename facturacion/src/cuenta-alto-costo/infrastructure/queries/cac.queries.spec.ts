import { readFileSync } from 'fs';
import { join } from 'path';
import { CONSULTAS_CAC } from './cac.queries';
import { CAMPOS_CAC } from '../../presentation/dtos/cac.dto';

describe('Consultas originales CAC', () => {
  const original = readFileSync(join(__dirname, 'consultas.original.txt'), 'utf8');
  for (const seccion of CONSULTAS_CAC) {
    it(`conserva SELECT, INSERT y UPDATE de ${seccion.tabla}`, () => {
      expect(original).toContain(seccion.select);
      expect(original).toContain(seccion.insert);
      expect(original).toContain(seccion.update);
    });
  }
  it('cubre los 133 campos de las ocho tablas', () => {
    expect(CONSULTAS_CAC.length).toBe(8);
    expect(new Set(CONSULTAS_CAC.flatMap(seccion => seccion.campos)).size).toBe(133);
    expect(CAMPOS_CAC.length).toBe(133);
  });
});

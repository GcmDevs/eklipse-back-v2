import { ForbiddenException } from '@nestjs/common';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { Actor, Auditoria, PERMISOS_PRE, PermisoPre } from './modelo';
import {
  consultar,
  editar,
  exigir,
  normalizarHallazgos,
  puede,
  recepcion,
  versionEsperada,
} from './reglas';
import { calcularHoras, festivos, reglasHoras } from './horas';
const causal = [{ code: 'FA0101', specific: 'Prueba', general: 'Facturación' }];
const hallazgo = {
  codigo: 'FA0101',
  servicio: 'Servicio',
  cantidad: 1.125,
  valorUnitario: 100.12,
  motivo: 'Motivo',
  area: 'Área',
  descripcion: 'Descripción',
  destino: 'preglosa',
};
describe('Reglas de auditoría', () => {
  it.each([ADMIN_AUTHORITY, 'admin'])(
    'habilita todas las capacidades con la autoridad %s',
    permiso => {
      const a: Actor = { id: 1, contexto: 'ALTACENTRO', nombre: 'Prueba', permisos: [permiso] };
      for (const capacidad of Object.keys(PERMISOS_PRE) as PermisoPre[]) {
        expect(puede(a, capacidad)).toBe(true);
        expect(() => exigir(a, capacidad)).not.toThrow();
      }
    }
  );
  it('no concede administración por códigos parciales ni permisos ajenos', () => {
    const a: Actor = {
      id: 1,
      contexto: 'ALTACENTRO',
      nombre: 'Prueba',
      permisos: ['001', '001001', '004', '004007', '004006001'],
    };
    for (const capacidad of Object.keys(PERMISOS_PRE) as PermisoPre[]) {
      expect(puede(a, capacidad)).toBe(false);
      expect(() => exigir(a, capacidad)).toThrow(ForbiddenException);
    }
  });
  it('conserva el destino y los importes al guardar repetidamente', () => {
    const primero = normalizarHallazgos([hallazgo], causal);
    expect(primero[0].preglosa).toBe(112.64);
    expect(normalizarHallazgos(primero, causal)).toEqual(primero);
    expect(
      normalizarHallazgos([{ ...hallazgo, destino: 'porFacturar' }], causal)[0].porFacturar
    ).toBe(112.64);
  });
  it('no acepta valores calculados por el cliente ni identificadores repetidos', () => {
    const h = normalizarHallazgos([{ ...hallazgo, preglosa: 1 }], causal)[0];
    expect(h.preglosa).toBe(112.64);
    expect(() => normalizarHallazgos([h, h], causal)).toThrow('repetidos');
    expect(() => normalizarHallazgos([{ ...hallazgo, cantidad: 1.1234 }], causal)).toThrow(
      'cantidad'
    );
    expect(() => normalizarHallazgos([{ ...hallazgo, valorUnitario: null }], causal)).toThrow(
      'Completa'
    );
    expect(() => normalizarHallazgos([{ ...hallazgo, destino: 'desconocido' }], causal)).toThrow(
      'destino'
    );
  });
  it('permite cerrar sin hallazgos y rechaza causales desconocidas', () => {
    expect(normalizarHallazgos([], causal)).toEqual([]);
    expect(() => normalizarHallazgos([{ ...hallazgo, codigo: 'INVALID' }], causal)).toThrow(
      'causal'
    );
  });
  it('aísla contexto, asignación y estado incluso para administradores', () => {
    const a: Actor = {
      id: 1,
      contexto: 'ALTACENTRO',
      nombre: 'Prueba',
      permisos: [PERMISOS_PRE.auditar],
    };
    const r = { contexto: 'ALTACENTRO', responsableId: 1, estado: 'En auditoría' } as Auditoria;
    expect(() => consultar(a, r)).not.toThrow();
    expect(() => editar(a, r)).not.toThrow();
    expect(() => consultar(a, { ...r, responsableId: 2 })).toThrow(ForbiddenException);
    const admin = { ...a, permisos: [ADMIN_AUTHORITY] };
    expect(() => consultar(admin, { ...r, responsableId: 2 })).not.toThrow();
    expect(() => consultar(admin, { ...r, contexto: 'SANJUAN' })).toThrow(ForbiddenException);
    expect(() => editar(admin, { ...r, responsableId: 2 })).toThrow(ForbiddenException);
    expect(() => editar(admin, { ...r, estado: 'Finalizado' })).toThrow(ForbiddenException);
    expect(() => editar(a, { ...r, estado: 'Finalizado' })).toThrow(ForbiddenException);
  });
  it('protege versiones y las fechas reales de recepción', () => {
    expect(() => versionEsperada({ version: 2 }, 1)).toThrow('cambió');
    expect(recepcion('2025-01-01T08:30')).toBe('2025-01-01T13:30:00.000Z');
    expect(() => recepcion('2025-02-30T08:00')).toThrow();
    expect(() => recepcion('2099-01-01T08:00')).toThrow('futuro');
  });
});
describe('Horas extras versionadas', () => {
  const p = { fecha: '2026-10-27', inicio: '18:00', fin: '20:00', descanso: 0 };
  const salarios = [{ usuario: 1, vigencia: '2025-01-01', salario: 2100000 }];
  it('separa diurnas y nocturnas y aplica el salario vigente', () => {
    const c = calcularHoras(p, salarios);
    expect(c.minutos).toBe(120);
    expect(c.valor).toBe(30000);
    expect(c.segmentos.map(s => [s.minutos, s.nocturna, s.factor])).toEqual([
      [60, false, 1.25],
      [60, true, 1.75],
    ]);
  });
  it('separa medianoche y cambio de salario', () => {
    const c = calcularHoras(
      { ...p, fecha: '2026-10-30', inicio: '23:00', fin: '01:00', diaSiguiente: true },
      [...salarios, { usuario: 1, vigencia: '2026-10-31', salario: 4200000 }]
    );
    expect(c.segmentos.map(s => s.salario)).toEqual([2100000, 4200000]);
    expect(c.minutos).toBe(120);
  });
  it('incluye festivos móviles y no duplica descanso con festivo', () => {
    expect(festivos(2026).get('2026-04-02')).toContain('Jueves Santo');
    expect(festivos(2026).get('2026-07-13')).toContain('Chiquinquirá');
    const c = calcularHoras(
      { ...p, fecha: '2026-07-20', inicio: '10:00', fin: '11:00', descanso: 1 },
      salarios
    );
    expect(c.segmentos[0].factor).toBe(2.15);
  });
  it('respeta las fechas de cambio de reglas', () => {
    expect(reglasHoras('2025-07-14').divisor).toBe(230);
    expect(reglasHoras('2025-07-15').divisor).toBe(220);
    expect(reglasHoras('2026-07-14').divisor).toBe(220);
    expect(reglasHoras('2026-07-15').divisor).toBe(210);
    expect(reglasHoras('2025-12-24').noche).toBe(21);
    expect(reglasHoras('2025-12-25').noche).toBe(19);
    expect(reglasHoras('2026-06-30').descanso).toBe(0.8);
    expect(reglasHoras('2026-07-01').descanso).toBe(0.9);
    expect(reglasHoras('2027-07-01').descanso).toBe(1);
  });
  it('rechaza horarios invertidos, más de 24 horas y salarios inexistentes', () => {
    expect(() => calcularHoras({ ...p, inicio: '20:00', fin: '19:00' }, salarios)).toThrow(
      'intervalo'
    );
    expect(() => calcularHoras({ ...p, diaSiguiente: true }, salarios)).toThrow('intervalo');
    expect(() => calcularHoras(p, [])).toThrow('salario');
  });
});

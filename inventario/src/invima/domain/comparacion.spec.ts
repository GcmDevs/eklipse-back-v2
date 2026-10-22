import { construirFiltro, evaluarCoincidencias, separarCum } from './comparacion';
import { CandidatoInvima } from './invima.models';

const candidato = {
  clave: 'a'.repeat(64),
  cum: '20048021-41',
  nombre: 'CARDIK',
  registroSanitario: 'INVIMA 2023M-0013598-R2',
  estadoRegistro: 'Vigente',
  estadoCum: 'Inactivo',
  presentacion: 'Caja 30',
  titular: 'Laboratorio',
} as CandidatoInvima;
describe('Comparación INVIMA', () => {
  it('normaliza ceros iniciales sin convertir identificadores a números JS', () => {
    expect(separarCum('00020048021-00041')).toEqual(['20048021', '41']);
    expect(construirFiltro({ nombre: 'CARDIK', cum: '00020048021-00041' }, 'CUM')).toBe(
      'expedientecum = 20048021 AND consecutivocum = 41'
    );
    expect(separarCum('2004802141')).toBeNull();
  });
  it('escapa comillas y trata comodines como texto', () => {
    expect(construirFiltro({ nombre: "Ó'Brian 100%_" }, 'NOMBRE')).toBe(
      "contains(unaccent(upper(producto)), unaccent(upper('Ó''Brian'))) AND contains(unaccent(upper(producto)), unaccent(upper('100%_')))"
    );
    expect(() => construirFiltro({ nombre: 'X', cum: '1 OR 1=1' }, 'CUM')).toThrow();
  });
  it('asocia CUM exacto sin confundir estado de registro con estado CUM', () => {
    const result = evaluarCoincidencias(
      { nombre: 'CARDIK', cum: '20048021-41', registroSanitario: '2023M-0013598-R2' },
      [candidato],
      'CUM',
      true
    );
    expect(result.resultado).toBe('EXACTA');
    expect(result.seleccionado.estadoCum).toBe('Inactivo');
    expect(result.seleccionado.estadoRegistro).toBe('Vigente');
  });
  it.each(['Vencido', 'En tramite renov', 'Cancelado', 'Negado'])(
    'conserva el estado publicado %s',
    estadoRegistro => {
      expect(
        evaluarCoincidencias(
          { nombre: 'X', cum: candidato.cum },
          [{ ...candidato, estadoRegistro }],
          'CUM',
          true
        ).seleccionado.estadoRegistro
      ).toBe(estadoRegistro);
    }
  );
  it('no asocia automáticamente registros o nombres', () => {
    expect(evaluarCoincidencias({ nombre: 'CARDIK' }, [candidato], 'NOMBRE', true).resultado).toBe(
      'REVISION'
    );
    expect(
      evaluarCoincidencias(
        { nombre: 'CARDIK', registroSanitario: candidato.registroSanitario },
        [candidato],
        'REGISTRO',
        true
      ).seleccionado
    ).toBeNull();
  });
  it('explica contradicciones y sugerencias tras CUM sin coincidencias', () => {
    const result = evaluarCoincidencias(
      { nombre: 'CARDIK', cum: '123-1', registroSanitario: 'INVIMA OTRO' },
      [candidato],
      'NOMBRE',
      true
    );
    expect(result.resultado).toBe('REVISION');
    expect(result.advertencias.join(' ')).toContain('No se encontró el CUM indicado');
    expect(result.advertencias.join(' ')).toContain(
      'No se encontró el registro sanitario indicado'
    );
    expect(result.advertencias.join(' ')).toContain('difiere del ingresado');
  });
  it('no elige CUM con estados contradictorios o páginas sin revisar', () => {
    expect(
      evaluarCoincidencias(
        { nombre: 'X', cum: candidato.cum },
        [candidato, { ...candidato, estadoRegistro: 'Cancelado' }],
        'CUM',
        true
      ).resultado
    ).toBe('REVISION');
    expect(
      evaluarCoincidencias({ nombre: 'X', cum: candidato.cum }, [candidato], 'CUM', true, false)
        .resultado
    ).toBe('REVISION');
  });
  it('solo declara sin coincidencias con cobertura completa', () => {
    expect(evaluarCoincidencias({ nombre: 'X' }, [], 'NOMBRE', true).resultado).toBe(
      'SIN_COINCIDENCIAS'
    );
    expect(evaluarCoincidencias({ nombre: 'X' }, [], 'NOMBRE', false).resultado).toBe('INCOMPLETA');
    expect(
      evaluarCoincidencias({ nombre: 'X', cum: candidato.cum }, [candidato], 'CUM', false)
        .seleccionado
    ).toBeNull();
  });
});

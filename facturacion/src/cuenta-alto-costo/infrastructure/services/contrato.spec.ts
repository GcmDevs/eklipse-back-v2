import { prepararConsulta, validarRegistro, versionRegistro } from './contrato';

describe('Contrato CAC', () => {
  it('envía valores como parámetros sin interpolarlos en el SQL original', () => {
    const sql = 'SELECT @DOCUMENTO documento WHERE @DOCUMENTO = @DOCUMENTO';
    const ataque = "x'; DROP TABLE GENPACIEN;--";
    const query = prepararConsulta(sql, { DOCUMENTO: ataque });
    expect(query.sql.endsWith(sql)).toBe(true);
    expect(query.sql).not.toContain(ataque);
    expect(query.parametros).toEqual([ataque]);
  });

  it('rechaza parámetros ausentes en vez de convertirlos silenciosamente en null', () => {
    expect(() => prepararConsulta('SELECT @FALTANTE', {})).toThrow();
  });

  it('rechaza claves desconocidas del payload', () => {
    expect(() =>
      validarRegistro({ tipoDocumento: 1, documento: '123', datos: { SQL: 'DELETE' } })
    ).toThrow();
  });

  it('la versión cambia cuando cambia un dato, independientemente del orden de propiedades', () => {
    expect(versionRegistro({ A: '1', B: null })).toEqual(versionRegistro({ B: null, A: '1' }));
    expect(versionRegistro({ A: '1' })).not.toEqual(versionRegistro({ A: '2' }));
  });
});

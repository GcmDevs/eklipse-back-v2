jest.mock('@common/infrastructure/services/base.source', () => ({ BaseSource: class {} }));
import { Request } from 'express';
import { CuentaAltoCostoImpl } from './cac.impl';
import { CAMPOS_CAC, DatosCac, GuardarCacDto } from '../../presentation/dtos/cac.dto';
import { CONSULTAS_CAC } from '../queries/cac.queries';
import { DIAGNOSTICOS_ONCOLOGICOS_SQL } from '../queries/diagnosticos';

function entorno(fallarTabla?: string, nacimiento: string | null = '2000-01-01') {
  const filas = new Map<string, Record<string, unknown>[]>();
  const ejecutar = jest.fn(async (sql: string, parametros: unknown[]) => {
    if (/from GENPACIEN/i.test(sql))
      return [
        {
          PACPRINOM: 'PRUEBA',
          PACPRIAPE: 'CAC',
          GPAFECNAC: nacimiento,
          'Fecha de nacimiento': nacimiento,
        },
      ];
    if (sql.includes('from GENDIAGNO'))
      return [
        { DIACODIGO: 'C509', DIANOMBRE: 'Mama', DIAGTIPCANCER: 1 },
        { DIACODIGO: 'C910', DIANOMBRE: 'Leucemia', DIAGTIPCANCER: 7 },
      ];
    const tabla = CONSULTAS_CAC.find(seccion => sql.includes(seccion.tabla));
    if (!tabla) throw new Error('Consulta no esperada');
    const escritura = /\b(INSERT INTO|UPDATE)\s/.test(sql);
    if (escritura) {
      if (tabla.tabla === fallarTabla) throw new Error('Fallo simulado de BD');
      const datos: Record<string, unknown> = {};
      for (const declaracion of sql.matchAll(/DECLARE @([A-Z0-9_]+) nvarchar\(max\) = @(\d+)/g))
        datos[declaracion[1]] = parametros[Number(declaracion[2])];
      filas.set(tabla.tabla, [
        Object.fromEntries(tabla.campos.map(campo => [campo, datos[campo] ?? null])),
      ]);
      return [];
    }
    return filas.get(tabla.tabla) ?? [];
  });
  const qr = {
    isTransactionActive: false,
    query: ejecutar,
    connect: jest.fn(async () => undefined),
    startTransaction: jest.fn(async () => {
      qr.isTransactionActive = true;
    }),
    commitTransaction: jest.fn(async () => {
      qr.isTransactionActive = false;
    }),
    rollbackTransaction: jest.fn(async () => {
      qr.isTransactionActive = false;
    }),
    release: jest.fn(async () => undefined),
  };
  const servicio = new CuentaAltoCostoImpl({} as Request);
  Object.assign(servicio, { conn: { query: ejecutar }, qr });
  const datos = Object.fromEntries(CAMPOS_CAC.map(campo => [campo, null])) as DatosCac;
  Object.assign(datos, {
    TIPDOCUSUARIO: 'CC',
    NUMDOCUSUARIO: '123456',
    CODCIE10: 'C509',
    IDETIPOTRATAMIENTO: '1',
  });
  const payload: GuardarCacDto = { tipoDocumento: 1, documento: '123456', version: null, datos };
  return { servicio, qr, filas, payload };
}

describe('Persistencia CAC', () => {
  it('guarda el código CIE-10 sin punto en Nombre Neoplasia', async () => {
    const { servicio, payload } = entorno();
    payload.datos.CODCIE10 = 'C50.9';
    payload.datos.NOMNEOPLASIA = 'OTRO';
    const guardado = await servicio.guardar(payload);
    expect(guardado.registro.datos.NOMNEOPLASIA).toBe('C509');
  });
  it('conserva la consulta del catálogo y admite la columna repetida de MSSQL', async () => {
    const { servicio, qr } = entorno();
    qr.query.mockResolvedValueOnce([
      { DIACODIGO: ' C509 ', DIANOMBRE: ' Mama ', DIAGTIPCANCER: [1, 1] },
    ]);
    expect(await servicio.diagnosticosOncologicos()).toEqual({
      diagnosticos: [{ codigo: 'C509', nombre: 'Mama', tipoCancer: 1 }],
    });
    expect(qr.query).toHaveBeenCalledWith(DIAGNOSTICOS_ONCOLOGICOS_SQL);
  });
  it('calcula la clasificación con el nacimiento aunque el cliente envíe otro grupo', async () => {
    const { servicio, payload } = entorno();
    payload.datos.CODCIE10 = 'C91.0';
    payload.datos.CANPRIORIZADO = '7';
    const guardado = await servicio.guardar(payload);
    expect(guardado.registro.datos.CODCIE10).toBe('C910');
    expect(guardado.registro.datos.CANPRIORIZADO).toBe('8');
  });
  it('rechaza un código ajeno al catálogo antes de iniciar escrituras', async () => {
    const { servicio, qr, payload } = entorno();
    payload.datos.CODCIE10 = 'J00';
    await expect(servicio.guardar(payload)).rejects.toThrow('catálogo oncológico');
    expect(qr.connect).not.toHaveBeenCalled();
  });
  it('impide guardar una clasificación dependiente de edad sin nacimiento conocido', async () => {
    const { servicio, qr, payload } = entorno(undefined, '1800-01-01');
    payload.datos.CODCIE10 = 'C910';
    await expect(servicio.guardar(payload)).rejects.toThrow('fecha de nacimiento');
    expect(qr.connect).not.toHaveBeenCalled();
  });
  it('guarda las ocho secciones y confirma antes de liberar la conexión', async () => {
    const { servicio, qr, payload, filas } = entorno();
    const resultado = await servicio.guardar(payload);
    expect(resultado.exitoso).toBe(true);
    expect(filas.size).toBe(8);
    expect(qr.commitTransaction).toHaveBeenCalledTimes(1);
    expect(qr.rollbackTransaction).not.toHaveBeenCalled();
    expect(qr.release).toHaveBeenCalledTimes(1);
    expect(qr.connect.mock.invocationCallOrder[0]).toBeLessThan(
      qr.startTransaction.mock.invocationCallOrder[0]
    );
    expect(qr.commitTransaction.mock.invocationCallOrder[0]).toBeLessThan(
      qr.release.mock.invocationCallOrder[0]
    );
  });
  it('revierte y libera la conexión si una sección falla', async () => {
    const { servicio, qr, payload } = entorno('CACAntecedentes');
    await expect(servicio.guardar(payload)).rejects.toThrow('No se pudo guardar');
    expect(qr.commitTransaction).not.toHaveBeenCalled();
    expect(qr.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(qr.release).toHaveBeenCalledTimes(1);
  });
  it('rechaza un segundo registro del paciente aunque use otro diagnóstico', async () => {
    const { servicio, qr, payload, filas } = entorno();
    filas.set('CACIdentificacionGeneral', [{ ...payload.datos, CODCIE10: 'C001' }]);
    await expect(servicio.guardar(payload)).rejects.toThrow('El registro cambió');
    expect(qr.commitTransaction).not.toHaveBeenCalled();
    expect(qr.rollbackTransaction).toHaveBeenCalledTimes(1);
  });
  it('bloquea pacientes con registros maestros duplicados', async () => {
    const { servicio, qr, payload, filas } = entorno();
    filas.set('CACIdentificacionGeneral', [payload.datos, payload.datos]);
    await expect(servicio.guardar(payload)).rejects.toThrow('duplicados');
    expect(qr.startTransaction).not.toHaveBeenCalled();
  });
  it('rechaza cambios al diagnóstico o tratamiento existentes', async () => {
    const { servicio, payload } = entorno();
    const guardado = await servicio.guardar(payload);
    await expect(
      servicio.guardar({
        ...payload,
        version: guardado.registro.version,
        datos: { ...payload.datos, IDETIPOTRATAMIENTO: '2' },
      })
    ).rejects.toThrow('quedan definidos');
  });
  it('libera la conexión cuando falla el inicio de transacción', async () => {
    const { servicio, qr, payload } = entorno();
    qr.startTransaction.mockRejectedValueOnce(new Error('Conexión perdida'));
    await expect(servicio.guardar(payload)).rejects.toThrow();
    expect(qr.release).toHaveBeenCalledTimes(1);
    expect(qr.rollbackTransaction).not.toHaveBeenCalled();
  });
});

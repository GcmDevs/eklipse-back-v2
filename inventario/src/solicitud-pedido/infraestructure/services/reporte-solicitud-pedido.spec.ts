import { GCM_CONTEXTS } from '@common/domain/types';
import {
  calcularPrioridadReporte,
  transformarReporteSolicitudPedido,
} from './reporte-solicitud-pedido';
import { obtenerConfiguracionReporte } from './reporte-configuracion';

describe('reporte de solicitud de pedido', () => {
  const contextCode = GCM_CONTEXTS.ALTACENTRO.getCode();

  it('consolida productos, suma filas repetidas y agrega meses sin movimiento', () => {
    const reporte = transformarReporteSolicitudPedido(
      [
        {
          año: 2026,
          mes: 5,
          'COD AGRUPAMIENTO': 'A1',
          'NOM AGRUPAMIENTO': 'Medicamentos',
          iprcodigo: ' m10001 ',
          IPRDESCOR: 'Producto prueba',
          APROVECHAMIENTO: '2',
          ENTRADA: '10',
          'SALIDA SIN FORMULA': '30',
          'SALIDA CORREGIDA': '24',
          'DESPACHO CONSUMO': '5',
          'SALIDA FV': '28',
          'EXISTENCIA ACTUAL': '20',
          IGRNOMBRE: 'MEDICAMENTOS',
        },
        {
          ANO: 2026,
          MES: 5,
          IPRCODIGO: 'M10001',
          APROVECHAMIENTO: 1,
          ENTRADA: 2,
          SALIDA_CORREGIDA: 6,
          'EXISTENCIA ACTUAL': 20,
        },
        {
          año: 2026,
          mes: 7,
          iprcodigo: 'M10001',
          'SALIDA CORREGIDA': 30,
          'EXISTENCIA ACTUAL': 20,
        },
      ],
      contextCode,
      1
    );

    expect(reporte.periodo).toEqual({ desde: '2026-05', hasta: '2026-07', meses: 3 });
    expect(reporte.productos).toHaveLength(1);
    expect(reporte.productos[0]).toMatchObject({
      codigoProducto: 'M10001',
      aprovechamiento: 3,
      existenciaActual: 20,
      totalSalidas: 60,
      consumoPromedioMensual: 20,
      prioridadCode: 1,
      prioridad: 'NORMAL',
    });
    expect(reporte.productos[0].movimientosMensuales).toEqual([
      expect.objectContaining({ anio: 2026, mes: 5, entrada: 12, salidaCorregida: 30 }),
      expect.objectContaining({ anio: 2026, mes: 6, salidaCorregida: 0 }),
      expect.objectContaining({ anio: 2026, mes: 7, salidaCorregida: 30 }),
    ]);
  });

  it('no multiplica la existencia repetida por cada mes y normaliza valores nulos', () => {
    const reporte = transformarReporteSolicitudPedido(
      [5, 6, 7].map(mes => ({
        año: 2026,
        mes,
        iprcodigo: 'P1',
        'SALIDA CORREGIDA': null,
        'EXISTENCIA ACTUAL': '15',
      })),
      contextCode,
      2
    );

    expect(reporte.productos[0].existenciaActual).toBe(15);
    expect(reporte.productos[0].inventarioDias).toBeNull();
    expect(reporte.productos[0].prioridad).toBe('NORMAL');
  });

  it('clasifica los limites de cobertura como cubiertos', () => {
    expect(calcularPrioridadReporte(6, 7, 30, 1).prioridad).toBe('CRITICA');
    expect(calcularPrioridadReporte(7, 7, 30, 1).prioridad).toBe('ALTA');
    expect(calcularPrioridadReporte(30, 7, 30, 1).prioridad).toBe('NORMAL');
    expect(calcularPrioridadReporte(0, 0, 0, 0).prioridad).toBe('CRITICA');
    expect(calcularPrioridadReporte(1, 0, 0, 0).prioridad).toBe('NORMAL');
  });

  it('retorna una coleccion vacia conservando el periodo', () => {
    const reporte = transformarReporteSolicitudPedido([], contextCode, 1);

    expect(reporte.productos).toEqual([]);
    expect(reporte.periodo.meses).toBe(3);
  });

  it('selecciona Centro y Alta y rechaza sedes no configuradas', () => {
    expect(obtenerConfiguracionReporte(contextCode, 1).query().length).toBeGreaterThan(0);
    expect(obtenerConfiguracionReporte(contextCode, 2).query().length).toBeGreaterThan(0);
    expect(() => obtenerConfiguracionReporte(contextCode, 3)).toThrow(
      'El reporte no esta configurado para el contexto ALTACENTRO y sede 3'
    );
  });
});

import {
  compararRecepcion,
  fisicoVacio,
  validarDecision,
  FisicoRecepcion,
  ErrorValidacionRecepcion,
} from './recepcion.models';
import { RenglonFactura } from './factura.models';
const factura: RenglonFactura = {
  tipo: 'MEDICAMENTO',
  descripcion: 'Producto',
  cantidad: 50,
  codigoDeclarado: '000123-01',
  registroSanitario: '2020M-123',
};
const fisico = (cantidad = 60): FisicoRecepcion => ({
  ...fisicoVacio('MEDICAMENTO'),
  descripcion: 'Producto',
  cantidad,
  codigoDeclarado: '000123-01',
  registroSanitario: '2020M-123',
  riesgo: 'II',
  marca: 'Marca',
  concentracion: '10',
  unidadConcentracion: 'mg',
  temperatura: 20,
  estadoEmpaque: 'BUENO',
  registroSanitarioRevisado: true,
  etiquetaConforme: true,
  sellosConformes: true,
  fabricanteConforme: true,
  lotes: [{ cantidad, lote: 'L1', vencimiento: '2028-01-01' }],
});
describe('Comparación factura / físico', () => {
  it('la revisión sanitaria es manual, no se deduce de una coincidencia oficial y conserva el legado', () => {
    const f = fisico();
    expect(fisicoVacio('MEDICAMENTO').registroSanitarioRevisado).toBe(false);
    f.registroSanitarioRevisado = false;
    expect(() => validarDecision(factura, f, 'ACEPTADO', '', 'EXACTA')).toThrow('controles');
    expect(() =>
      validarDecision(factura, f, 'RECHAZADO', 'Registro revisado pendiente', 'EXACTA')
    ).not.toThrow();
    f.registroSanitarioRevisado = true;
    expect(() => validarDecision(factura, f, 'ACEPTADO', '', 'EXACTA')).not.toThrow();
    delete f.registroSanitarioRevisado;
    expect(() => validarDecision(factura, f, 'ACEPTADO', '', 'EXACTA')).not.toThrow();
  });
  it.each([
    [60, 0, 10],
    [40, 10, 0],
    [50, 0, 0],
    [0, 50, 0],
  ])('facturado 50, recibido %s', (n, f, s) => {
    expect(compararRecepcion(factura, fisico(n))).toMatchObject({ faltante: f, sobrante: s });
  });
  it('preserva ceros, no corrige años y no inventa cantidades', () => {
    const f = fisico();
    f.codigoDeclarado = '123-01';
    f.registroSanitario = '2021M-123';
    expect(compararRecepcion({ ...factura, cantidad: null }, f)).toMatchObject({
      cum: 'DIFIERE',
      registro: 'DIFIERE',
      faltante: null,
      sobrante: null,
    });
  });
  it('requiere justificar el CUM físico diferente aun con coincidencia oficial', () => {
    const f = fisico();
    f.codigoDeclarado = '000122-01';
    expect(() => validarDecision(factura, f, 'ACEPTADO', '', 'EXACTA')).toThrow('Justifique');
    expect(() =>
      validarDecision(factura, f, 'ACEPTADO', 'Aceptación documentada', 'EXACTA')
    ).not.toThrow();
  });
  it('acepta novedades coincidentes sin sumar unidades', () => {
    const f = fisico();
    f.cantidadAveria = 40;
    f.cantidadNoSolicitada = 40;
    expect(() => validarDecision(factura, f, 'ACEPTADO', '', 'EXACTA')).not.toThrow();
    f.cantidadAveria = 61;
    expect(() => validarDecision(factura, f, 'PENDIENTE', '', 'PENDIENTE')).toThrow('superar');
  });
  it.each(['CUM', 'INVIMA'])('motivo %s obliga rechazo', m => {
    const f = fisico();
    f.motivosRechazo = [m as 'CUM'];
    expect(() => validarDecision(factura, f, 'ACEPTADO', '', 'EXACTA')).toThrow('motivos');
    expect(() => validarDecision(factura, f, 'RECHAZADO', '', 'EXACTA')).not.toThrow();
  });
  it('requiere suma exacta, nombres únicos y fechas reales', () => {
    const f = fisico();
    f.lotes[0].cantidad = 59;
    expect(() => validarDecision(factura, f, 'ACEPTADO', '', 'EXACTA')).toThrow('suma');
    f.lotes[0].cantidad = 60;
    f.lotes[0].vencimiento = '2027-02-30';
    expect(() => validarDecision(factura, f, 'ACEPTADO', '', 'EXACTA')).toThrow('fecha');
  });
  it('registra no recibido sin inventar datos físicos; antiguo sin cantidad requiere justificación', () => {
    const f = fisicoVacio('MEDICAMENTO');
    f.cantidad = 0;
    expect(() => validarDecision(factura, f, 'NO_RECIBIDO', '', 'PENDIENTE')).not.toThrow();
    expect(() =>
      validarDecision({ ...factura, cantidad: null }, f, 'NO_RECIBIDO', '', 'PENDIENTE')
    ).toThrow('ausente');
  });
  it.each(['INCOMPLETA', 'SIN_COINCIDENCIAS', 'REVISION'])(
    'consulta %s exige justificación sin presentar validación oficial',
    r => {
      expect(() => validarDecision(factura, fisico(), 'ACEPTADO', '', r)).toThrow('Justifique');
      expect(() =>
        validarDecision(factura, fisico(), 'ACEPTADO', 'Excepción documentada', r)
      ).not.toThrow();
    }
  );
  it('no acepta sin consultar; embalaje deteriorado o controles fallidos no cumplen', () => {
    const f = fisico();
    expect(() => validarDecision(factura, f, 'ACEPTADO', 'Justificación', 'PENDIENTE')).toThrow(
      'Consulte'
    );
    f.estadoEmpaque = 'DETERIORADO';
    expect(() => validarDecision(factura, f, 'ACEPTADO', '', 'EXACTA')).toThrow('controles');
  });
  it('vital requiere IUM o resolución y no aplica CUM/INVIMA ni fabricante', () => {
    const f = fisico();
    f.tipo = 'VITAL_NO_DISPONIBLE';
    f.registroSanitarioRevisado = false;
    f.fabricanteConforme = false;
    expect(() =>
      validarDecision(factura, f, 'ACEPTADO', 'Cambio de categoría', 'PENDIENTE')
    ).toThrow('IUM');
    f.ium = 'IUM-A01';
    expect(() =>
      validarDecision(factura, f, 'ACEPTADO', 'Cambio de categoría', 'PENDIENTE')
    ).not.toThrow();
  });
  it('dispositivo no requiere concentración pero reactivo sí', () => {
    const f = fisico();
    f.tipo = 'DISPOSITIVO';
    f.concentracion = '';
    f.unidadConcentracion = '';
    expect(() =>
      validarDecision({ ...factura, tipo: 'DISPOSITIVO' }, f, 'ACEPTADO', '', 'CONFIRMADA')
    ).not.toThrow();
    f.tipo = 'REACTIVO_DIAGNOSTICO';
    expect(() => validarDecision(factura, f, 'ACEPTADO', 'Cambio', 'CONFIRMADA')).toThrow(
      'concentración'
    );
  });
  const errores = (
    f: FisicoRecepcion,
    decision: 'PENDIENTE' | 'ACEPTADO' = 'ACEPTADO',
    oficial = 'EXACTA',
    justificacion = ''
  ) => {
    try {
      validarDecision(factura, f, decision, justificacion, oficial);
      throw new Error('Se esperaba un error de validación.');
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorValidacionRecepcion);
      return (error as ErrorValidacionRecepcion).campos;
    }
  };
  it('localiza cantidades y únicamente los campos comunes que están vacíos', () => {
    const f = fisico();
    f.cantidad = null;
    expect(errores(f)).toEqual({ 'fisico.cantidad': 'Digite la cantidad física recibida.' });
    f.cantidad = 60;
    f.riesgo = '';
    f.marca = '';
    expect(Object.keys(errores(f))).toEqual(['fisico.riesgo', 'fisico.marca']);
    f.marca = 'Marca';
    f.riesgo = 'II';
    f.cantidadAveria = 61;
    expect(Object.keys(errores(f, 'PENDIENTE'))).toEqual(['fisico.cantidadAveria']);
    f.cantidadAveria = 0;
    f.lotes[0].cantidad = -1;
    expect(Object.keys(errores(f, 'PENDIENTE'))).toEqual(['fisico.lotes.0.cantidad']);
  });
  it('identifica el lote y dato defectuoso, sin señalar campos completos', () => {
    const f = fisico();
    f.lotes[0].vencimiento = '2027-02-30';
    expect(Object.keys(errores(f))).toEqual(['fisico.lotes.0.vencimiento']);
    f.lotes[0].vencimiento = '2028-01-01';
    f.lotes[0].cantidad = 30;
    f.lotes.push({ cantidad: 30, lote: 'l1', vencimiento: '2028-02-01' });
    expect(Object.keys(errores(f))).toEqual(['fisico.lotes.1.lote']);
    f.lotes[1].lote = 'L2';
    f.lotes[1].cantidad = 29;
    expect(Object.keys(errores(f))).toEqual(['fisico.lotes']);
  });
  it('identifica justificación, control físico, consulta y alternativas documentales del vital', () => {
    const f = fisico();
    f.codigoDeclarado = '000122-01';
    expect(Object.keys(errores(f))).toEqual(['justificacion']);
    f.codigoDeclarado = factura.codigoDeclarado;
    f.registroSanitarioRevisado = false;
    expect(Object.keys(errores(f))).toEqual(['fisico.registroSanitarioRevisado']);
    f.registroSanitarioRevisado = true;
    expect(Object.keys(errores(f, 'ACEPTADO', 'PENDIENTE', 'Excepción'))).toEqual([
      'verificacionFactura',
    ]);
    f.tipo = 'VITAL_NO_DISPONIBLE';
    expect(Object.keys(errores(f, 'ACEPTADO', 'PENDIENTE', 'Cambio de tipo'))).toEqual([
      'fisico.ium',
      'fisico.numeroResolucion',
    ]);
  });
});

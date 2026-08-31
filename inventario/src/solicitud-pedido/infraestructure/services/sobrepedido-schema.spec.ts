import { getMetadataArgsStorage } from 'typeorm';

import { SolicitudPedidoSobrepedidoOrm } from '@inn/orm/inn/solicitud-pedido';

describe('esquema de trazabilidad de sobrepedido', () => {
  it('declara TIPOCIERRE como varchar para almacenar los tipos de cierre canónicos', () => {
    const columna = getMetadataArgsStorage().columns.find(
      metadata =>
        metadata.target === SolicitudPedidoSobrepedidoOrm && metadata.propertyName === 'tipoCierre'
    );

    expect(columna).toBeDefined();
    expect(columna?.options.type).toBe('varchar');
    expect(columna?.options.length).toBe(24);
  });
});

// Synthetic acceptance report; does not read invoices, tokens or databases.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { InformeInvimaPdfService } from '../src/invima/infrastructure/informe-pdf.service';

const observacion = (texto: string) => ({
  texto,
  version: 1,
  usuarioNombre: 'Revisor de prueba',
  fecha: new Date('2026-10-22T18:30:00Z'),
});
const informe: any = {
  numero: 'QA-OBSERVACIONES',
  proveedor: 'Proveedor de prueba · Factura revisada',
  nitProveedor: '900.123.456-7',
  fecha: '2026-10-22',
  generadoEn: new Date(),
  observacion: observacion(
    'Se revisó la información de los productos incluidos.\nSolicitar los soportes faltantes al proveedor antes de aceptar la recepción.'
  ),
  productos: [
    ['MEDICAMENTO', 'CONFIRMADA', 'Inactivo', 'Vigente'],
    ['ALIMENTOS', 'REVISION', null, null],
    ['MEDICAMENTO', 'INCOMPLETA', null, null],
    ['DISPOSITIVO', 'CONFIRMADA', null, 'Vencido'],
    ['MEDICAMENTO', 'PENDIENTE', null, null],
  ].map(([tipo, resultado, estadoCum, estadoRegistro], i) => ({
    orden: i + 1,
    datos: {
      tipo,
      descripcion: [
        'ACETAMINOFÉN 500 MG TABLETAS · Caja por 100 unidades',
        'ALIMENTO NUTRICIONAL PARA USO ESPECIAL',
        'SOLUCIÓN INYECTABLE 100 ML',
        'CATÉTER INTRAVENOSO DE SEGURIDAD',
        'PRODUCTO PENDIENTE DE VERIFICACIÓN',
      ][i],
      codigoDeclarado: '0000123-0' + i,
      registroSanitario: 'INVIMA 2020M-000123-R1',
    },
    resultado,
    observacion: observacion(
      i === 0
        ? 'El registro está vigente, pero el CUM publicado está inactivo.\nValidar la presentación comercial con el proveedor.'
        : i === 3
          ? 'Observación extensa para comprobar el salto entre páginas. '.repeat(60)
          : 'Revisar los datos declarados en la factura. <No interpretar como HTML>'
    ),
    candidato:
      resultado === 'CONFIRMADA'
        ? {
            nombre: 'Nombre publicado del producto',
            titular: 'Laboratorio de prueba S.A.S.',
            cum: tipo === 'MEDICAMENTO' ? '0000123-02' : null,
            estadoCum,
            estadoRegistro,
            registroSanitario: 'INVIMA 2020M-000123-R1',
            presentacion: 'Caja por 100 unidades',
            fechaVencimiento: '2030-01-01T00:00:00',
          }
        : null,
    verificacion:
      resultado === 'PENDIENTE'
        ? null
        : {
            usuarioNombre: 'Revisor de prueba',
            fecha: new Date(),
            fuentes: [
              {
                nombre: 'Fuente oficial INVIMA',
                dataset: 'i7cb-raxc',
                error: resultado === 'INCOMPLETA' ? 'Timeout' : undefined,
              },
            ],
            advertencias:
              resultado === 'INCOMPLETA'
                ? ['No se pudieron consultar todas las fuentes. La cobertura es incompleta.']
                : [],
          },
  })),
};
async function main() {
  const dir = resolve('dist/invima-qa');
  await mkdir(dir, { recursive: true });
  const buffer = await new InformeInvimaPdfService().generar(informe);
  await writeFile(resolve(dir, 'observaciones.pdf'), buffer);
  console.log('Informe de aceptación creado:', buffer.length, 'bytes');
}
main().catch(e => {
  console.error(e.message);
  process.exitCode = 1;
});

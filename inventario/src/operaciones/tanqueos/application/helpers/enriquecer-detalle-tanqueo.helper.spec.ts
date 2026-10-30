import { buildTanqueoDetalleRead } from './enriquecer-detalle-tanqueo.helper';
import { TanqueoCorreccion } from '@inn/operaciones/tanqueos/domain/entities';
import { CodigoInconsistencia, SeveridadInconsistencia } from '@inn/operaciones/tanqueos/domain/enums';
import { EstadoInconsistencia, EstadoTanqueo } from '@inn/operaciones/tanqueos/domain/enums/estados.enum';
import { TanqueoRead } from '@inn/operaciones/tanqueos/domain/reads';

describe('buildTanqueoDetalleRead (contrato PATCH corregir / GET detalle)', () => {
  it('incluye correcciones e inconsistencias con objeto correccion ligado', () => {
    const view = {
      id: 1,
      inconsistencias: [
        {
          id: 10,
          tanqueoId: 1,
          codigo: CodigoInconsistencia.KM_MENOR_ANT,
          campo: 'kilometraje',
          severidad: SeveridadInconsistencia.ADVERTENCIA,
          estado: EstadoInconsistencia.CERRADA,
          resultado: null,
          fechaDeteccion: new Date(),
          resueltoPorUsuarioId: 1,
          resueltoPorNombre: null,
          fechaResolucion: new Date(),
          contactoRealizado: false,
          notaContacto: null,
          notaResolucion: 'nota',
        },
      ],
      estado: EstadoTanqueo.APTO_PARA_REVISION,
    } as TanqueoRead;

    const correccion = TanqueoCorreccion.rebuild(
      99,
      1,
      'KILOMETRAJE',
      '4000',
      '5000',
      'Ajuste km',
      10,
      1,
      new Date('2026-01-15T00:00:00Z')
    );

    const detalle = buildTanqueoDetalleRead(view, [correccion], []);

    expect(detalle.correcciones).toHaveLength(1);
    expect(detalle.correcciones[0].inconsistenciaId).toBe(10);
    expect(detalle.inconsistencias[0].correccion).toEqual({
      id: 99,
      campo: 'KILOMETRAJE',
      motivo: 'Ajuste km',
      fecha: new Date('2026-01-15T00:00:00Z'),
      usuarioId: 1,
    });
  });
});

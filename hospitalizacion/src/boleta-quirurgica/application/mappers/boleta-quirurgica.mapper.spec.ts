import { mapBoletaQuirurgicaDetalle } from './boleta-quirurgica.mapper';

describe('mapBoletaQuirurgicaDetalle', () => {
  it('anexa cirugiasRealizadas a cada item de programacion', () => {
    const result = mapBoletaQuirurgicaDetalle({
      procedimientos: [],
      cupsAutorizados: [],
      programacion: [
        {
          INGRESO: 978341,
          INSTITUCION: 'C. MEDICOS CENTRO',
          FOLIO: '10',
        },
      ],
      cirugiasRealizadas: [
        {
          FOLIO: '10',
          FECHA_OPERACION: new Date('2026-01-23T05:00:00.000Z'),
          PROCEDIMIENTO: 'Colecistectomia',
        },
      ],
      gestorqx: [],
      maos: [],
      auditoria: [],
    } as any);

    expect(result.programacion).toEqual([
      expect.objectContaining({
        ingreso: 978341,
        institucion: 'C. MEDICOS CENTRO',
        folio: '10',
        cirugiasRealizadas: [
          expect.objectContaining({
            folio: '10',
            procedimiento: 'Colecistectomia',
          }),
        ],
      }),
    ]);
  });
});

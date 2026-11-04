import { DetalleOfertaI } from '../data-transfers';
import { PacienteAcostadoI } from '../queries';
import { dietasAutomaticas } from './dieta-automatica';

function oferta(name: string, code = name): DetalleOfertaI {
  return { name, code, price: 0, tipo: '', consistencia: '' };
}

function paciente(tipos: DetalleOfertaI[], consistencias: DetalleOfertaI[]): PacienteAcostadoI {
  return {
    camaId: 10,
    cama: { id: 10, codigo: '101' },
    paciente: { id: 20, nombreCompleto: 'Paciente de prueba', fechaNacimiento: new Date() },
    folio: { fecha: null, medico: { nombreCompleto: '', especialidad: { nombre: '' } } },
    dieta: {
      id: 999,
      tipos,
      consistencias,
      extraordinarias: [oferta('MERIENDA', 'M001')],
      observacion: 'Conservar observacion',
      ultimaObservacion: null,
      enAislamiento: true,
    },
  };
}

describe('dietasAutomaticas', () => {
  it('construye la precarga sin ids ni extraordinarias de la jornada anterior', () => {
    const result = dietasAutomaticas([
      paciente(
        [oferta('NORMAL', 'T001'), oferta('HIPOGLUCIDA', 'T002')],
        [oferta('BLANDA', 'C001')]
      ),
    ]);
    expect(result).toEqual({
      omitidas: 0,
      dietas: [
        {
          pacienteId: 20,
          camaId: 10,
          dietaConfig: 'T001|T002|C001',
          observacion: 'Conservar observacion',
          enAislamiento: true,
        },
      ],
    });
  });

  it.each(['NO APLICA', 'NADA VIA ORAL'])('conserva la negacion coherente %s', name => {
    expect(dietasAutomaticas([paciente([oferta(name, 'TNEG')], [oferta(name, 'CNEG')])])).toEqual(
      expect.objectContaining({
        omitidas: 0,
        dietas: [expect.objectContaining({ dietaConfig: 'TNEG|CNEG' })],
      })
    );
  });

  it.each([
    [[], []],
    [[oferta('NORMAL')], []],
    [[], [oferta('BLANDA')]],
    [[oferta('NO APLICA')], [oferta('BLANDA')]],
    [[oferta('NORMAL')], [oferta('NO APLICA')]],
    [[oferta('NADA VIA ORAL')], [oferta('NO APLICA')]],
    [[oferta('NORMAL'), oferta('NO APLICA')], [oferta('BLANDA')]],
    [[oferta('NORMAL'), oferta('NADA VIA ORAL')], [oferta('NADA VIA ORAL')]],
    [[oferta('NADA VIA ORAL')], [oferta('BLANDA'), oferta('NADA VIA ORAL')]],
    [[oferta('NORMAL', '')], [oferta('BLANDA')]],
  ])('omite configuraciones vacias o incoherentes %#', (tipos, consistencias) => {
    expect(dietasAutomaticas([paciente(tipos, consistencias)])).toEqual({
      dietas: [],
      omitidas: 1,
    });
  });

  it('conserva pacientes validos aunque otro no tenga configuracion', () => {
    const valida = paciente([oferta('NORMAL')], [oferta('BLANDA')]);
    valida.dieta.enAislamiento = null;
    const result = dietasAutomaticas([paciente([], []), valida]);
    expect(result.omitidas).toBe(1);
    expect(result.dietas).toHaveLength(1);
    expect(result.dietas[0].enAislamiento).toBe(false);
  });
});

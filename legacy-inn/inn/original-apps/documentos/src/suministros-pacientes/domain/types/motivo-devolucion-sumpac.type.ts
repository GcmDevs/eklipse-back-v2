import { CtmType } from '@common/domain/types';

export type MotivoDevolucionSumPacCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export class MotivoDevolucionSumPacType extends CtmType<MotivoDevolucionSumPacCode> {}

const medicamento_suspendido = new MotivoDevolucionSumPacType(1, 'MEDICAMENTO SUSPENDIDO');
const cambio_dosis = new MotivoDevolucionSumPacType(2, 'CAMBIO DE DOSIS');
const cambio_frecuencia = new MotivoDevolucionSumPacType(3, 'CAMBIO DE FRECUENCIA');
const cambio_via_admi = new MotivoDevolucionSumPacType(4, 'CAMBIO DE VIA DE ADMINISTRACIÓN');
const reaccion_adversa = new MotivoDevolucionSumPacType(5, 'REACCIÓN ADVERSA');
const fallo_terapeutico = new MotivoDevolucionSumPacType(6, 'FALLO TERAPEUTICO');
const cambio_servicio = new MotivoDevolucionSumPacType(7, 'CAMBIO DE SERVICIO');
const egreso_paciente = new MotivoDevolucionSumPacType(8, 'EGRESO DE PACIENTE');
const fallecimiento = new MotivoDevolucionSumPacType(9, 'FALLECIMIENTO');
const devolucion_interna = new MotivoDevolucionSumPacType(10, 'DEVOLUCION INTERNA');

export const motivoDevolucionSumPacTypeFactory = (
  code: MotivoDevolucionSumPacCode
): MotivoDevolucionSumPacType => {
  switch (code) {
    case 1:
      return medicamento_suspendido;
    case 2:
      return cambio_dosis;
    case 3:
      return cambio_frecuencia;
    case 4:
      return cambio_via_admi;
    case 5:
      return reaccion_adversa;
    case 6:
      return fallo_terapeutico;
    case 7:
      return cambio_servicio;
    case 8:
      return egreso_paciente;
    case 9:
      return fallecimiento;
    case 10:
      return devolucion_interna;
  }
};

export const MOTIVOS_DEVOLUCION_SUMPAC = {
  medicamento_suspendido,
  cambio_dosis,
  cambio_frecuencia,
  cambio_via_admi,
  reaccion_adversa,
  fallo_terapeutico,
  cambio_servicio,
  egreso_paciente,
  fallecimiento,
  devolucion_interna,
};

export const MOTIVOS_DEVOLUCION_SUMPAC_VALUES = [
  medicamento_suspendido,
  cambio_dosis,
  cambio_frecuencia,
  cambio_via_admi,
  reaccion_adversa,
  fallo_terapeutico,
  cambio_servicio,
  egreso_paciente,
  fallecimiento,
  //devolucion_interna,
];

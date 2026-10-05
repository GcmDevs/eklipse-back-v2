import { ConciliacionModel } from '@crn/rft/cartera/application/models';
import { ConciliacionResponse } from '../data-transfers';
import { ENVIRONMENTS } from 'src/app.environments';
import { FILE_LOCATIONS } from '@common/application/file-locations';

export const dataToConciliacionModel = (conciliacion: ConciliacionResponse): ConciliacionModel => {
  return {
    id: conciliacion.OID,
    createdAt: conciliacion.FECHA,
    daysSinceCreatedAt: conciliacion.Dias,
    gestion: {
      id: conciliacion.IDGEST,
    },
    usuario: {
      id: conciliacion.IDUSU,
      nombreCompleto: conciliacion.USUDESCRI,
      documentoIdentidad: {
        numero: conciliacion.USUNOMBRE,
      },
    },
    tercero: {
      id: conciliacion.IDTERC,
      nit: conciliacion.TERNUMDOC,
      nombreCompleto: conciliacion.TERNOMCOM,
    },
    actaConciliacion: {
      numero: conciliacion.NACTACONCI,
      fecha: conciliacion.FECHACONC,
    },
    calendar: {
      year: conciliacion.CalendarYear,
      quarterOfYear: conciliacion.CalendarQuarterOfYear,
      monthNumberOfYear: conciliacion.MonthNumberOfYear,
    },
    valorConciliado: conciliacion.VALCONCI,
    valorReconocidoPago: conciliacion.VALRECPAG,
    valorGlosado: conciliacion.VALGLOSAD,
    valorDevuelto: conciliacion.VALDEVUEL,
    valorNoRadicado: conciliacion.VALNORADI,
    valorEnAuditoria: conciliacion.AUDITORIA,
    valorEnRetencion: conciliacion.RETENCION,
    valorGlosaAceptadaIps: conciliacion.GLOSACEPTIPS,
    valorNoDescontadoEps: conciliacion.NOTNODESCEPS,
    valorPagoNoAplicado: conciliacion.PAGNOAPLI,
    valorCuotaModeradora: conciliacion.COPCUOMODE,
    valorCancelado: conciliacion.VALCANCEL,
    valorTotal: conciliacion.TOTAL,
    valorDiferencia: conciliacion.DIFEREN,
    rutaComprobante: conciliacion.RUTARCHI
      ? `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.crn.gcc.actas}/${conciliacion.RUTARCHI.replace(
          'uploads\\actas\\',
          ''
        )}`
      : null,
    estado: conciliacion.ESTADO,
  };
};

export interface ConciliacionModel {
  id: number;
  createdAt: string;
  daysSinceCreatedAt: number;
  gestion: {
    id: number;
  };
  usuario: {
    id: number;
    nombreCompleto: string;
    documentoIdentidad: {
      numero: string;
    };
  };
  tercero: {
    id: number;
    nit: string;
    nombreCompleto: string;
  };
  actaConciliacion: {
    numero: string;
    fecha: string;
  };
  calendar: {
    year: string;
    quarterOfYear: number;
    monthNumberOfYear: number;
  };
  valorConciliado: number;
  valorReconocidoPago: number;
  valorGlosado: number;
  valorDevuelto: number;
  valorNoRadicado: number;
  valorEnAuditoria: number;
  valorEnRetencion: number;
  valorGlosaAceptadaIps: number;
  valorNoDescontadoEps: number;
  valorPagoNoAplicado: number;
  valorCuotaModeradora: number;
  valorCancelado: number;
  valorTotal: number;
  valorDiferencia: number;
  rutaComprobante: string;
  estado: 'PENDIENTE' | 'CONCILIADO';
}

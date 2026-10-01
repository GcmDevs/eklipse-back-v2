export class GestionModel {
  id: number;
  usuario: {
    id: number;
    cedula: string;
    nombreCompleto: string;
  };
  createdAt: Date;
  tercero: {
    id: number;
    nombre: string;
    telefono: string;
    representante: {
      nombreCompleto: string;
    };
  };
  motivoLlamada: string;
  observacion: string;
  fechaConciliacion: Date | null;
  tipoConciliacion: 'CARTERA' | 'GLOSAS';
}

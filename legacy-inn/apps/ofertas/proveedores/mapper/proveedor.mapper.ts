import { EkinnoferProveedorOrm } from '@orm/inn/ofertas/proveedor.orm';
import { ProveedorResponse } from '../interface';

export class ProveedorMapper {
  static toProveedor(proveedores: EkinnoferProveedorOrm[]): ProveedorResponse[] {
    return proveedores.map(p => ({
      id: p.id,
      codigo: p.terNumDoc ?? null,
      nombre: p.nombreTercero ?? null,
      documentos: p.documentos.map(d => {
        return {
          url: `https://cloud.grupoclinicamedicos.com/ofertas/public/inn/ofer/docs/2026/${p.id}/${d.nombreArchivo}`,
        };
      }),
    }));
  }
}

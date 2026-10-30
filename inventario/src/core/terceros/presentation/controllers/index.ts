import { PaisController } from './pais.controller';
import { ProveedorController } from './proveedor.controller';
import { ResponsableController } from './responsable.controller';
import { TerceroController } from './tercero.controller';

export * from './pais.controller';
export * from './proveedor.controller';
export * from './responsable.controller';
export * from './tercero.controller';

export const COR_TERCEROS_CONTROLLERS = [
    PaisController,
    ProveedorController,
    ResponsableController,
    TerceroController
];
import { TABLE_NAMES } from "@common/application/constants";
import { BaseOrm } from "@common/infrastructure/orm";
import { ComponenteSchema } from "apps/motor-formatos/domain";
import { Column, Entity, OneToMany, Unique } from "typeorm";
import { SeccionVersionFormatoPlantillaOrm } from "./seccion-version-formato-plantilla.orm";

@Entity({ name: TABLE_NAMES.inn.eqp.fmt.secciones.secciones })
@Unique('UQ_EKFMTSECSECCIONESCTG_NOMBRE', ['nombre'])
export class SeccionPlantillaFmtOrm extends BaseOrm {
    @Column({ type: 'varchar', length: 110, name: 'NOMBRE' })
    nombre: string;

    @Column({ type: 'simple-json', name: 'COMPONENTES' })
    componentes: ComponenteSchema[];

    @OneToMany(
        () => SeccionVersionFormatoPlantillaOrm,
        (svf) => svf.seccion,
    )
    seccionesPlantilla: SeccionVersionFormatoPlantillaOrm[];
}
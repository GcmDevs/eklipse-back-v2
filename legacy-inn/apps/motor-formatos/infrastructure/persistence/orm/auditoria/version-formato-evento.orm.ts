import { TABLE_NAMES } from "@common/application/constants";
import { BaseCreatedOrm } from "@common/infrastructure/orm";
import { TipoEventoVersionFormato } from "apps/motor-formatos/domain";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { VersionFormatoFmtOrm } from "../version-formato.orm";

@Entity({ name: TABLE_NAMES.inn.eqp.fmt.eventos_version })
export class EventoAuditVersionFormatoOrm extends BaseCreatedOrm {
    @ManyToOne(() => VersionFormatoFmtOrm, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'VERSIONFORMATOOID' })
    versionFormato: VersionFormatoFmtOrm;

    @Column({ name: 'VERSIONFORMATOOID' })
    versionFormatoId: number;

    @Column({ name: 'TIPOEVENTO', enum: TipoEventoVersionFormato })
    tipoEvento: TipoEventoVersionFormato;

    @Column({ name: 'USUARIOOID' })
    usuarioId: number;
}

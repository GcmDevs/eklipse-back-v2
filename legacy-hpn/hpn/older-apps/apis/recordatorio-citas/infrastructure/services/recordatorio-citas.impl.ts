import { BaseSource } from "@common/infrastructure/services";
import { Injectable } from "@nestjs/common";
import { RecordatorioResponse } from "../../domain/models";
import { getRecordatorioCitasQuery } from "../queries/citas-medicas/get-recordatorio-citas";

@Injectable()
export class RecordatorioCitasImpl extends BaseSource {

    public async getRecordatorioCitas(): Promise<RecordatorioResponse> {

        const recordatorios = await this.conn.query(getRecordatorioCitasQuery());

        return {
            recordatorios
        };
    }

}
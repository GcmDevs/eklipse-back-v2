import * as fs from "fs";
import { ArchivoAlmacenado } from "../entities/archivo-almacenado.entity";

export interface ArchivoStreamRes {
    stream: fs.ReadStream;
    archivo: ArchivoAlmacenado;
}
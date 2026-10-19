import { DocumentoDto } from '../../presentation/dtos';
import { EspecificacionCompOrm } from '../orm';

export const dataToEquipoTecnologico = (
  body: DocumentoDto,
  documentoId: number
): EspecificacionCompOrm => {
  const newEquipo = new EspecificacionCompOrm();
  newEquipo.documentoId = documentoId;
  newEquipo.cpuMarca = body.computador.cpu.marca;
  newEquipo.cpuModelo = body.computador.cpu.modelo;
  newEquipo.cpuSerie = body.computador.cpu.serie;
  newEquipo.discoDuro = body.computador.discoDuro;
  newEquipo.conector = body.computador.conector;
  newEquipo.sistemaOperativoCode = body.computador.sistemaOperativoCode;
  newEquipo.unidadDvd = body.computador.unidadDvd;
  newEquipo.cpuProcesador = body.computador.cpuProcesador;
  newEquipo.velocidad = body.computador.cpuProceVelocidad;
  newEquipo.cpuRam = body.computador.cpuRam;
  newEquipo.monitorMarca = body.computador.monitor.marca;
  newEquipo.monitorModelo = body.computador.monitor.modelo;
  newEquipo.monitorSerie = body.computador.monitor.serie;
  newEquipo.tecladoTipoCode = body.computador.tecladoTipoCode;
  newEquipo.mouseTipoCode = body.computador.mouseTipoCode;
  newEquipo.red = body.computador.red;
  newEquipo.direccionIp = body.computador.direccionIp;
  return newEquipo;
};

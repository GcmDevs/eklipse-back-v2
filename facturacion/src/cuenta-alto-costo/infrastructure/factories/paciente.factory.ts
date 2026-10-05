import { BusquedaCacDto, PacienteCacResponse } from '../../presentation/dtos/cac.dto';

export function pacienteCacFactory(
  fila: Record<string, unknown>,
  busqueda: BusquedaCacDto
): PacienteCacResponse {
  const texto = (clave: string) => String(fila[clave] ?? '').trim();
  const fecha = (clave: string): string | null => {
    const valor = fila[clave];
    if (!valor) return null;
    return valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor).slice(0, 10);
  };
  return {
    id: Number(fila.OID),
    ...busqueda,
    tipoDocumentoDescripcion: texto('TIPO_DOC_PAC'),
    primerNombre: texto('PACPRINOM'),
    segundoNombre: texto('PACSEGNOM'),
    primerApellido: texto('PACPRIAPE'),
    segundoApellido: texto('PACSEGAPE'),
    fechaNacimiento: fecha('Fecha de nacimiento'),
    sexo: texto('sexo'),
    ocupacion: texto('OCUPACION'),
    regimen: texto('Régimen de afiliación AL SGSSS'),
    codigoEps: texto('Código de la EPS o de la entidad territorial'),
    eps: texto('ENTNOMBRE'),
    grupoPoblacional: texto('Grupo poblacional'),
    codigoMunicipio: texto('Municipio de residencia'),
    municipio: texto('DESCRIPCION MUNICIPIO'),
    telefono: texto('Número telefónico del paciente'),
    fechaAfiliacion: fecha('Fecha de afiliación a la EPS que registra'),
    ocupacionId: fila.GENOCUPACION == null ? null : Number(fila.GENOCUPACION),
    grupoPoblacionalId: fila.GENPOBESP == null ? null : Number(fila.GENPOBESP),
    municipioId: fila.DGNMUNICIPIO == null ? null : Number(fila.DGNMUNICIPIO),
    departamentoId: fila.DEPARTAMENTOID == null ? null : Number(fila.DEPARTAMENTOID),
    detalleContratoId: fila.GENDETCON == null ? null : Number(fila.GENDETCON),
    telefonoId: fila.TELEFONOID == null ? null : Number(fila.TELEFONOID),
    sexoCodigo: fila.GPASEXPAC == null ? null : Number(fila.GPASEXPAC),
    regimenCodigo: fila.GPATIPPAC == null ? null : Number(fila.GPATIPPAC),
  };
}

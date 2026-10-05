export function permisosHojaEspecialidad(
  hospitalizado: boolean,
  equipoTurno: boolean,
  especialista: boolean,
  activa: boolean
) {
  return {
    puedeConsultar: true,
    puedeEditar: hospitalizado && activa && (equipoTurno || especialista),
    puedeAdministrar: hospitalizado && equipoTurno,
  };
}

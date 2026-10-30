export function buildNotaCierreAutomaticoPorCorreccion(
  correccionId: number,
  campo: string,
  motivo: string
): string {
  return (
    `Cerrada automáticamente por corrección ${correccionId} sobre ${campo}: ` +
    `el dato corregido ya no cumple la regla. El usuario no cerró esta alerta de forma explícita; ` +
    `se cerró como consecuencia de la corrección (motivo: ${motivo}).`
  );
}

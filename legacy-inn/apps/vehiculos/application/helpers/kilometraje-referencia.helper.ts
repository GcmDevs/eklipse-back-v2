export function resolveKilometrajeReferenciaKm(
  kilometrajeActivo: number | null | undefined,
  ultimoKilometrajeTanqueo: number | null
): number | null {
  const valores = [kilometrajeActivo, ultimoKilometrajeTanqueo].filter(
    (v): v is number => v != null && !Number.isNaN(v)
  );
  return valores.length > 0 ? Math.max(...valores) : null;
}

import { SocrataClient, fuentesInvima } from '../src/invima/infrastructure/socrata.client';
import { construirFiltro } from '../src/invima/domain/comparacion';

async function main() {
  const client = new SocrataClient();
  let failed = false;
  for (const fuente of [...fuentesInvima(), ...fuentesInvima('DISPOSITIVO')]) {
    try {
      const updated = await client.validarFuente(fuente, true);
      const muestra = await client.pagina(fuente, 'true', 0);
      if (!muestra.candidatos.length) throw new Error('La fuente no tiene registros de muestra.');
      const c = muestra.candidatos[0];
      const dispositivo = fuente.id === 'dispositivos';
      const input = {
        tipo: dispositivo ? ('DISPOSITIVO' as const) : ('MEDICAMENTO' as const),
        nombre: c.nombre,
        cum: c.cum || '',
        registroSanitario: c.registroSanitario,
      };
      const exacta = dispositivo
        ? null
        : await client.pagina(fuente, construirFiltro(input, 'CUM'), 0);
      const registro = await client.pagina(fuente, construirFiltro(input, 'REGISTRO'), 0);
      const nombre = await client.pagina(fuente, construirFiltro(input, 'NOMBRE'), 0);
      if (![...(exacta ? [exacta] : []), registro, nombre].every(p => p.candidatos.length))
        throw new Error('Falló la consulta por CUM, registro o nombre.');
      console.log(
        JSON.stringify({
          fuente: fuente.id,
          dataset: fuente.dataset,
          actualizada: new Date(updated * 1000).toISOString(),
          cum: c.cum,
          estadoRegistro: c.estadoRegistro,
          estadoCum: c.estadoCum,
          consultas: dispositivo ? 'REGISTRO, NOMBRE: OK' : 'CUM, REGISTRO, NOMBRE: OK',
        })
      );
    } catch (error) {
      failed = true;
      console.error(
        JSON.stringify({
          fuente: fuente.id,
          error: error instanceof Error ? error.message : 'Error de consulta',
        })
      );
    }
  }
  if (failed) process.exitCode = 1;
}
void main();

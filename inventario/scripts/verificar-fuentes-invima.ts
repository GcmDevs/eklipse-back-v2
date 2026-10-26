import { SocrataClient, fuentesInvima } from '../src/invima/infrastructure/socrata.client';
import { construirFiltro } from '../src/invima/domain/comparacion';
import {
  GRUPOS_REGISTROS,
  TipoProductoInvima,
  esMedicamento,
} from '../src/invima/domain/invima.models';

async function main() {
  const client = new SocrataClient();
  let failed = false;
  const tipos = [
    ...(process.argv.includes('--registros') ? [] : ['MEDICAMENTO', 'DISPOSITIVO']),
    ...Object.keys(GRUPOS_REGISTROS),
  ] as TipoProductoInvima[];
  const tareas = tipos.flatMap(tipo => fuentesInvima(tipo).map(fuente => ({ tipo, fuente })));
  let next = 0;
  const verificar = async () => {
    while (next < tareas.length) {
      const { tipo, fuente } = tareas[next++];
      try {
        const updated = await client.validarFuente(fuente, true);
        const muestra = await client.pagina(fuente, 'true', 0);
        if (!muestra.candidatos.length) throw new Error('La fuente no tiene registros de muestra.');
        const c = muestra.candidatos[0];
        const input = {
          tipo,
          nombre: c.nombre.slice(0, 240),
          cum: c.cum || '',
          registroSanitario: c.registroSanitario,
        };
        const exacta = esMedicamento(tipo)
          ? await client.pagina(fuente, construirFiltro(input, 'CUM', fuente), 0)
          : null;
        const registro = await client.pagina(fuente, construirFiltro(input, 'REGISTRO', fuente), 0);
        const nombre = await client.pagina(fuente, construirFiltro(input, 'NOMBRE', fuente), 0);
        if (![...(exacta ? [exacta] : []), registro, nombre].every(p => p.candidatos.length))
          throw new Error('Falló la consulta por CUM, registro o nombre.');
        console.log(
          JSON.stringify({
            fuente: fuente.id,
            tipo,
            grupo: fuente.grupo,
            dataset: fuente.dataset,
            actualizada: new Date(updated * 1000).toISOString(),
            cum: c.cum,
            estadoRegistro: c.estadoRegistro,
            estadoCum: c.estadoCum,
            consultas: esMedicamento(tipo) ? 'CUM, REGISTRO, NOMBRE: OK' : 'REGISTRO, NOMBRE: OK',
          })
        );
      } catch (error) {
        failed = true;
        console.error(
          JSON.stringify({
            fuente: fuente.id,
            tipo,
            grupo: fuente.grupo,
            error: error instanceof Error ? error.message : 'Error de consulta',
          })
        );
      }
    }
  };
  await Promise.all([verificar(), verificar()]);
  if (failed) process.exitCode = 1;
}
void main();

import { dirname, join } from 'path';
import { existsSync } from 'fs';

function findBackendRoot(start: string): string {
  let current = start;

  while (current !== dirname(current)) {
    const publicPath = join(current, 'public');

    // 👉 existe public
    if (existsSync(publicPath)) {
      // 👉 pero NO debe estar dentro de /dist
      if (!current.includes(`${dirname(current)}\\dist`) && !current.includes('\\dist\\')) {
        return current;
      }
    }

    current = dirname(current);
  }

  throw new Error('No se pudo encontrar el backend root fuera de dist');
}

export const BACKEND_ROOT = findBackendRoot(__dirname);

export const OFERTAS_DOCS_ROOT = join(BACKEND_ROOT, 'public', 'inn', 'ofer', 'docs');

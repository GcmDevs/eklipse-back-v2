const MULTIPLE_SPACES = /\s+/g;
const DIACRITICS = /[\u0300-\u036f]/g;
export const PARTE_CATG_SIMILARITY_THRESHOLD = 0.85;

export function normalizeParteCatgText(parte: string): string {
  return parte.trim().replace(MULTIPLE_SPACES, ' ').toUpperCase();
}

export function normalizeParteCatgKey(parte: string): string {
  return parte
    .trim()
    .replace(MULTIPLE_SPACES, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '');
}

export function parteCatgSimilarity(a: string, b: string): number {
  const keyA = normalizeParteCatgKey(a);
  const keyB = normalizeParteCatgKey(b);

  if (!keyA || !keyB) return 0;
  if (keyA === keyB) return 1;

  const distance = levenshteinDistance(keyA, keyB);
  return 1 - distance / Math.max(keyA.length, keyB.length);
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

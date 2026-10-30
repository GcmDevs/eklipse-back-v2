import { GcmContextType } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services';

const DEFAULT_TIMEOUT_MS = 90_000;
const POLL_MS = 250;

export const waitContextsReady = async (
  contexts: GcmContextType[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<void> => {
  const unique = [...new Map(contexts.map(c => [c.getCode(), c])).values()];
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (unique.every(c => switchConn(c).isInitialized)) return;
    await new Promise(resolve => setTimeout(resolve, POLL_MS));
  }
  const pending = unique.filter(c => !switchConn(c).isInitialized).map(c => c.getCode());
  throw new Error(`DataSources no listos: ${pending.join(', ')}`);
};

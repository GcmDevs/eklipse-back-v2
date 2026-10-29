export const TEMPORARY_PDF_ROUTE = 'v1/temporales/pdf';

export const TEMPORARY_PDF_CONFIG = Object.freeze({
  ttlMs: 2 * 60 * 1000,
  maxPendingDocuments: 100,
  maxRetainedBytes: 64 * 1024 * 1024,
  maxDocumentBytes: 8 * 1024 * 1024,
  maxConcurrentGenerations: 2,
  maxConcurrentDeliveries: 4,
});

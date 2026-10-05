export interface FormatoSchemaQuery {
  getSchema(versionFormatoId: number): Promise<any>;
}

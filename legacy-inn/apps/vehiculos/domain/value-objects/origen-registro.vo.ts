export class OrigenRegistro {
  private constructor(
    private readonly clienteUuid: string,
    private readonly creadoOffline: boolean,
    private readonly fechaCreacionLocal: Date,
    private readonly dispositivoId: string | null,
    private readonly fechaSincronizacion: Date | null
  ) {}

  static create(params: {
    clienteUuid: string;
    creadoOffline: boolean;
    fechaCreacionLocal: Date;
    dispositivoId: string | null;
  }): OrigenRegistro {
    return new OrigenRegistro(
      params.clienteUuid,
      params.creadoOffline,
      params.fechaCreacionLocal,
      params.dispositivoId,
      null
    );
  }

  markSincronizacion(fecha: Date): OrigenRegistro {
    return new OrigenRegistro(
      this.clienteUuid,
      this.creadoOffline,
      this.fechaCreacionLocal,
      this.dispositivoId,
      fecha
    );
  }

  get getClienteUuid(): string {
    return this.clienteUuid;
  }
  get getCreadoOffline(): boolean {
    return this.creadoOffline;
  }
  get getFechaCreacionLocal(): Date {
    return this.fechaCreacionLocal;
  }
  get getDispositivoId(): string | null {
    return this.dispositivoId;
  }
  get getFechaSincronizacion(): Date | null {
    return this.fechaSincronizacion;
  }
}

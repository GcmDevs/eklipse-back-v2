export class Id {
  private readonly valor: number;

  constructor(id?: number) {
    this.valor = id;
  }

  get getValor(): number {
    return this.valor;
  }

  isEmpty(): boolean {
    return this.valor === undefined;
  }

  equals(other: Id) {
    return this.valor === other.valor;
  }
}

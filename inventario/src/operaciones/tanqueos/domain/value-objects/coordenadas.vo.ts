export class CoordenadasGPS {
  private constructor(
    private readonly lat: number,
    private readonly lng: number,
    private readonly precision: number | null
  ) {}

  static create(lat: number, lng: number, precisionMetros: number | null = null): CoordenadasGPS {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Coordenadas GPS fuera de rango');
    }
    return new CoordenadasGPS(lat, lng, precisionMetros);
  }

  get getLatitud(): number {
    return this.lat;
  }
  get getLongitud(): number {
    return this.lng;
  }
  get getPrecisionMetros(): number | null {
    return this.precision;
  }
}

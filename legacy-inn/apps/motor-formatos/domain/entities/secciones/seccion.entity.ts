import { Id } from '@common/domain/value-objects';
import { ComponenteSchema } from '../../types';

export class SeccionPlantillaFmt {
  private constructor(
    private readonly id: Id,
    private nombre: string,
    private componentes: ComponenteSchema[]
  ) {}

  static create(data: { nombre: string; componentes: ComponenteSchema[] }): SeccionPlantillaFmt {
    SeccionPlantillaFmt.validate(data.nombre, data.componentes);
    return new SeccionPlantillaFmt(new Id(), data.nombre, data.componentes);
  }

  static rebuild(id: number, nombre: string, componentes: ComponenteSchema[]): SeccionPlantillaFmt {
    return new SeccionPlantillaFmt(new Id(id), nombre, componentes);
  }

  get getId(): Id {
    return this.id;
  }
  get getNombre(): string {
    return this.nombre;
  }
  get getComponentes(): ComponenteSchema[] {
    return [...this.componentes];
  }

  updateNombre(nombre: string): void {
    SeccionPlantillaFmt.validateNombre(nombre);
    this.nombre = nombre;
  }

  updateComponentes(componentes: ComponenteSchema[]): void {
    SeccionPlantillaFmt.validateComponentes(componentes);
    this.componentes = componentes;
  }

  private static validate(nombre: string, componentes: ComponenteSchema[]): void {
    SeccionPlantillaFmt.validateNombre(nombre);
    SeccionPlantillaFmt.validateComponentes(componentes);
  }

  private static validateNombre(nombre: string): void {
    if (!nombre?.trim()) throw new Error('El nombre es obligatorio');
    if (nombre.length > 110) throw new Error('El nombre debe tener máximo 110 caracteres');
  }

  private static validateComponentes(componentes: ComponenteSchema[]): void {
    if (!componentes?.length) throw new Error('Debe tener al menos un componente');

    const keys = componentes.map(c => c.key);
    if (new Set(keys).size !== keys.length)
      throw new Error('Las keys de los componentes deben ser únicas');
  }
}

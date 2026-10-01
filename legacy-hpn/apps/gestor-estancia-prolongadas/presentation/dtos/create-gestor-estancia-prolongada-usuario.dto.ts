import { IsEmail, IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class CreateGestorEstanciaProlongadaUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @IsNumber()
  @IsNotEmpty()
  usuarioId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  cargo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  numeroTelefono: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(180)
  correo: string;
}

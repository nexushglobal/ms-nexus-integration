import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class DocumentDto {
  @IsNotEmpty({ message: 'El numberDocument es requerido.' })
  @IsString({ message: 'El numberDocument debe ser una cadena de texto.' })
  numberDocument: string;

  @IsNotEmpty({ message: 'El documentType es requerido.' })
  @IsString({ message: 'El documentType debe ser una cadena de texto.' })
  @IsIn(['dni', 'ruc'], {
    message: 'El documentType debe ser "dni" o "ruc".',
  })
  documentType: string;
}

export class DocumentResponseDto {
  dni?: string;
  ruc?: string;

  // Campos de DNI
  mothers_lastname?: string;
  fathers_lastname?: string;
  fullname?: string;

  // Campos de RUC
  razon_social?: string;
  direccion?: string;
  estado?: string;
}

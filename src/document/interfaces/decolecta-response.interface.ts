export interface DecolectaDniResponse {
  first_name: string;
  first_last_name: string;
  second_last_name: string;
  full_name: string;
  document_number: string;
}

export interface DecolectaRucResponse {
  razon_social: string;
  numero_documento: string;
  estado: string;
  condicion: string;
  direccion: string;
  ubigeo: string;
  via_tipo: string;
  via_nombre: string;
  zona_codigo: string;
  zona_tipo: string;
  numero: string;
  interior: string;
  lote: string;
  dpto: string;
  manzana: string;
  kilometro: string;
  distrito: string;
  provincia: string;
  departamento: string;
  es_agente_retencion: boolean;
  es_buen_contribuyente: boolean;
  locales_anexos: any;
}

export interface DecolectaErrorResponse {
  error: string;
}

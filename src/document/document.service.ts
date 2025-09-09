import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { envs } from 'src/config/envs';
import {
  DecolectaDniResponse,
  DecolectaRucResponse,
  DecolectaErrorResponse,
} from './interfaces/decolecta-response.interface';
import { DocumentResponseDto } from './dto/document-response.dto';

@Injectable()
export class DocumentService {
  constructor() {}
  async validateDocument(
    documentType: string,
    numberDocument: string,
  ): Promise<DocumentResponseDto> {
    const res: { isDuplicate: boolean } = { isDuplicate: false };

    if (res.isDuplicate) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `El documento ${numberDocument} ya se encuentra registrado`,
      });
    }

    try {
      let url: string;
      if (documentType === 'dni') {
        url = `https://api.decolecta.com/v1/reniec/dni?numero=${numberDocument}`;
      } else if (documentType === 'ruc') {
        url = `https://api.decolecta.com/v1/sunat/ruc?numero=${numberDocument}`;
      } else {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Tipo de documento no válido. Use "dni" o "ruc"',
        });
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${envs.DECOLECTA_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: DecolectaErrorResponse = await response.json();
        throw new RpcException({
          status:
            response.status === 400 || response.status === 422
              ? HttpStatus.BAD_REQUEST
              : HttpStatus.NOT_FOUND,
          message: `No se encontró el documento ${numberDocument}: ${errorData.error}`,
        });
      }

      if (documentType === 'dni') {
        const dniData: DecolectaDniResponse = await response.json();
        return this.formatDniResponse(dniData);
      } else {
        const rucData: DecolectaRucResponse = await response.json();
        return this.formatRucResponse(rucData);
      }
    } catch (err) {
      if (err instanceof RpcException) {
        throw err;
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error al validar el documento',
      });
    }
  }

  private formatDniResponse(data: DecolectaDniResponse): DocumentResponseDto {
    return {
      dni: data.document_number,
      mothers_lastname: data.second_last_name,
      fathers_lastname: data.first_last_name,
      fullname: data.full_name,
    };
  }

  private formatRucResponse(data: DecolectaRucResponse): DocumentResponseDto {
    return {
      ruc: data.numero_documento,
      razon_social: this.toTitleCase(data.razon_social),
      direccion: this.toTitleCase(data.direccion),
      estado: this.toTitleCase(data.estado),
    };
  }

  /**
   * Convierte texto a formato título (primera letra de cada palabra en mayúscula)
   */
  private toTitleCase(text: string): string {
    if (!text) return text;
    
    return text
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }
}

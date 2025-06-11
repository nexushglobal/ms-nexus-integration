import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { envs } from 'src/config/envs';

@Injectable()
export class DocumentService {
  constructor() {}
  async validateDocument(documentType: string, numberDocument: string) {
    const url = 'https://api.peruapis.com/v1/' + documentType;
    const token = envs.PA_TOKEN_PERUAPIS;

    // const res: { isDuplicate: boolean } = await firstValueFrom(
    //   this.client.send(
    //     { cmd: 'clientes.cliente.verify_document' },
    //     {
    //       documentType,
    //       numberDocument,
    //     },
    //   ),
    // );
    const res: { isDuplicate: boolean } = { isDuplicate: false }; // Simulación de respuesta

    if (res.isDuplicate) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `El documento ${numberDocument} ya se encuentra registrado`,
      });
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ document: numberDocument }),
      });
      if (!response.ok) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `No se ecnontró el documento ${numberDocument}`,
        });
      }

      const data: { success: boolean } = await response.json();

      if (data.success === false) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `No se ecnontró el documento ${numberDocument}`,
        });
      }

      return data;
    } catch (err) {
      throw new RpcException({
        status: err.error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.error.message || 'Error al validar el documento',
      });
    }
  }
}

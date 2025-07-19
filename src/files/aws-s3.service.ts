import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { envs } from '../config/envs';
import {
  S3UploadResponse,
  S3DeleteResponse,
} from './interfaces/s3-response.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AwsS3Service {
  private readonly logger = new Logger(AwsS3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: envs.AWS_REGION,
      credentials: {
        accessKeyId: envs.AWS_ACCESS_KEY_ID,
        secretAccessKey: envs.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = envs.AWS_S3_BUCKET_NAME;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<S3UploadResponse> {
    try {
      this.validateFile(file);

      // Generar nombre único para el archivo
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const key = `${folder}/${fileName}`;

      // Configurar el comando de subida (SIN ACL)
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Subir el archivo
      await this.s3Client.send(uploadCommand);

      // Construir la URL pública
      const url = `https://${this.bucketName}.s3.${envs.AWS_REGION}.amazonaws.com/${key}`;

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        url,
        key,
        bucket: this.bucketName,
        location: url,
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`, error.stack);
      throw new BadRequestException(
        `Error al subir el archivo: ${error.message}`,
      );
    }
  }

  async deleteFile(key: string): Promise<S3DeleteResponse> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(deleteCommand);

      this.logger.log(`File deleted successfully: ${key}`);

      return {
        success: true,
        message: 'Archivo eliminado correctamente',
      };
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Error al eliminar el archivo: ${error.message}`,
      };
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });
      if (typeof signedUrl !== 'string') {
        throw new BadRequestException('Error al generar URL firmada');
      }
      return signedUrl;
    } catch (error) {
      this.logger.error(
        `Error generating signed URL: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Error al generar URL firmada');
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'images',
  ): Promise<S3UploadResponse> {
    try {
      // Validación mejorada para imágenes
      if (!this.isImageFile(file)) {
        throw new BadRequestException('El archivo debe ser una imagen válida');
      }

      return this.uploadFile(file, folder);
    } catch (error) {
      this.logger.error(`Error uploading image: ${error.message}`, error.stack);
      throw new BadRequestException(
        `Error al subir la imagen: ${error.message}`,
      );
    }
  }

  private isImageFile(file: Express.Multer.File): boolean {
    // Verificar mimetype
    const validMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    // Si el mimetype está correcto, validar
    if (validMimeTypes.includes(file.mimetype)) {
      return true;
    }

    // Si el mimetype es incorrecto, verificar por extensión de archivo
    const extension = file.originalname.toLowerCase().split('.').pop();
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (validExtensions.includes(extension || '')) {
      this.logger.warn(
        `File ${file.originalname} has incorrect mimetype ${file.mimetype} but valid extension ${extension}`,
      );
      return true;
    }

    // Verificar signature del archivo (magic numbers) como último recurso
    if (this.hasImageSignature(file.buffer)) {
      this.logger.warn(
        `File ${file.originalname} detected as image by signature despite mimetype ${file.mimetype}`,
      );
      return true;
    }

    return false;
  }

  private hasImageSignature(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 8) {
      return false;
    }

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return true;
    }

    // JPEG signature: FF D8 FF
    if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
      return true;
    }

    // GIF signature: 47 49 46 38 (GIF8)
    if (buffer.subarray(0, 4).equals(Buffer.from([0x47, 0x49, 0x46, 0x38]))) {
      return true;
    }

    // WebP signature: starts with "RIFF" and contains "WEBP"
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).equals(Buffer.from('RIFF', 'ascii')) &&
      buffer.subarray(8, 12).equals(Buffer.from('WEBP', 'ascii'))
    ) {
      return true;
    }

    return false;
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'El archivo es demasiado grande. Máximo 10MB',
      );
    }

    // Validar tipos de archivo permitidos
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'pdf',
      'doc',
      'docx',
      'txt',
      'csv',
      'xlsx',
      'xls',
    ];

    if (
      typeof file.mimetype !== 'string' ||
      !allowedMimeTypes.includes(String(file.mimetype))
    ) {
      // Para archivos generales, ser más estricto
      throw new BadRequestException('Tipo de archivo no permitido');
    }
  }

  // Método para obtener información del bucket
  getBucketInfo(): Promise<{ bucket: string; region: string }> {
    return Promise.resolve({
      bucket: this.bucketName,
      region: envs.AWS_REGION,
    });
  }

  // Método para verificar si un archivo existe
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}

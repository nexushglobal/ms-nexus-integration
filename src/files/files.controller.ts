import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AwsS3Service } from './aws-s3.service';

interface UploadFileDto {
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  folder?: string;
}

interface DeleteFileDto {
  key: string;
}

interface GetSignedUrlDto {
  key: string;
  expiresIn?: number;
}

interface FileExistsDto {
  key: string;
}

@Controller()
export class FilesController {
  constructor(private readonly awsS3Service: AwsS3Service) {}

  @MessagePattern({ cmd: 'integration.files.upload' })
  async uploadFile(@Payload() data: UploadFileDto) {
    const { file, folder = 'uploads' } = data;

    // Convertir el objeto file al formato Express.Multer.File
    const multerFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: file.originalname,
      encoding: '7bit',
      mimetype: file.mimetype,
      size: file.size,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
      buffer: Buffer.from(file.buffer),
    };

    return await this.awsS3Service.uploadFile(multerFile, folder);
  }

  @MessagePattern({ cmd: 'integration.files.uploadImage' })
  async uploadImage(@Payload() data: UploadFileDto) {
    const { file, folder = 'images' } = data;

    const multerFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: file.originalname,
      encoding: '7bit',
      mimetype: file.mimetype,
      size: file.size,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
      buffer: Buffer.from(file.buffer),
    };

    console.log('Validating image file:', multerFile.originalname);
    return await this.awsS3Service.uploadImage(multerFile, folder);
  }

  @MessagePattern({ cmd: 'integration.files.delete' })
  async deleteFile(@Payload() data: DeleteFileDto) {
    return await this.awsS3Service.deleteFile(data.key);
  }

  @MessagePattern({ cmd: 'integration.files.getSignedUrl' })
  async getSignedUrl(@Payload() data: GetSignedUrlDto) {
    const { key, expiresIn = 3600 } = data;
    const url = await this.awsS3Service.getSignedUrl(key, expiresIn);
    return {
      success: true,
      url,
      expiresIn,
    };
  }

  @MessagePattern({ cmd: 'integration.files.exists' })
  async fileExists(@Payload() data: FileExistsDto) {
    const exists = await this.awsS3Service.fileExists(data.key);
    return {
      success: true,
      exists,
      key: data.key,
    };
  }

  @MessagePattern({ cmd: 'integration.files.bucketInfo' })
  async getBucketInfo() {
    const info = await this.awsS3Service.getBucketInfo();
    return {
      success: true,
      ...info,
    };
  }

  @MessagePattern({ cmd: 'integration.files.health' })
  getFilesHealth() {
    return {
      status: 'OK',
      service: 'files-service',
      timestamp: new Date().toISOString(),
    };
  }
}

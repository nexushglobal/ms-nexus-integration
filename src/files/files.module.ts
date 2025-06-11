import { Module } from '@nestjs/common';
import { AwsS3Service } from './aws-s3.service';
import { FilesController } from './files.controller';

@Module({
  controllers: [FilesController],
  providers: [AwsS3Service],
  exports: [AwsS3Service],
})
export class FilesModule {}

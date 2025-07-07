import { Module } from '@nestjs/common';
import { DocumentModule } from './document/document.module';
import { EmailModule } from './email/email.module';
import { FilesModule } from './files/files.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [DocumentModule, EmailModule, FilesModule, CommonModule],
})
export class AppModule {}

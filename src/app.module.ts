import { Module } from '@nestjs/common';
import { DocumentModule } from './document/document.module';
import { EmailModule } from './email/email.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [DocumentModule, EmailModule, FilesModule],
})
export class AppModule {}

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { DocumentService } from './document.service';
import { DocumentDto } from './dto/validate-document.dto';

@Controller()
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @MessagePattern({ cmd: 'integration.document.validateDocument' })
  validarDocumento(@Payload() dto: DocumentDto) {
    return this.documentService.validateDocument(
      dto.documentType,
      dto.numberDocument,
    );
  }
}

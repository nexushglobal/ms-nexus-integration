import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmailService } from './email.service';
import { EmailOptions } from './interfaces/email-options.interface';

@Controller()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @MessagePattern({ cmd: 'integration.email.send' })
  async sendEmail(@Payload() emailOptions: EmailOptions) {
    return await this.emailService.sendEmail(emailOptions);
  }

  @MessagePattern({ cmd: 'integration.email.verify' })
  async verifyConfiguration() {
    const isValid = await this.emailService.verifyConfiguration();
    return {
      success: true,
      valid: isValid,
      message: isValid
        ? 'Configuración SMTP válida'
        : 'Error en la configuración SMTP',
    };
  }

  @MessagePattern({ cmd: 'integration.email.health' })
  getEmailHealth() {
    return {
      status: 'OK',
      service: 'email-service',
      timestamp: new Date().toISOString(),
    };
  }
}

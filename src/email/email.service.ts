import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { envs } from '../config/envs';
import {
  EmailOptions,
  EmailResponse,
} from './interfaces/email-options.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sesClient: SESClient;
  private readonly defaultFrom: string;

  constructor() {
    this.sesClient = new SESClient({
      region: envs.AWS_REGION,
      credentials: {
        accessKeyId: envs.AWS_ACCESS_KEY_ID,
        secretAccessKey: envs.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.defaultFrom = envs.EMAIL_FROM;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      const {
        to,
        subject,
        text,
        html,
        cc,
        bcc,
        replyTo,
        from = this.defaultFrom,
      } = options;

      if (!to || (Array.isArray(to) && to.length === 0)) {
        throw new Error('El campo "to" es requerido');
      }

      if (!subject) {
        throw new Error('El campo "subject" es requerido');
      }

      if (!text && !html) {
        throw new Error('Debe proporcionar al menos "text" o "html"');
      }

      const toAddresses = Array.isArray(to) ? to : [to];
      const ccAddresses = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;
      const bccAddresses = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;

      const params = {
        Source: from,
        Destination: {
          ToAddresses: toAddresses,
          CcAddresses: ccAddresses,
          BccAddresses: bccAddresses,
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Text: text
              ? {
                  Data: text,
                  Charset: 'UTF-8',
                }
              : undefined,
            Html: html
              ? {
                  Data: html,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
        ReplyToAddresses: replyTo
          ? Array.isArray(replyTo)
            ? replyTo
            : [replyTo]
          : undefined,
      };

      const command = new SendEmailCommand(params);
      const result = await this.sesClient.send(command);

      this.logger.log(
        `Email sent successfully to ${toAddresses.join(', ')} with MessageId: ${result.MessageId}`,
      );

      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyConfiguration(): Promise<boolean> {
    try {
      // Test SES configuration by attempting to get sending quota
      const { GetSendQuotaCommand } = await import('@aws-sdk/client-ses');
      const command = new GetSendQuotaCommand({});
      await this.sesClient.send(command);

      this.logger.log('AWS SES configuration is valid');
      return true;
    } catch (error) {
      this.logger.error('AWS SES configuration error:', error.message);
      return false;
    }
  }
}

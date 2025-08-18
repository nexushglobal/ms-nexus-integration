import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  NATS_SERVERS: string;
  DECOLECTA_API_TOKEN: string;

  AWS_SES_SMTP_USERNAME: string;
  AWS_SES_SMTP_PASSWORD: string;
  EMAIL_FROM: string;

  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_S3_BUCKET_NAME: string;
}

const envsSchema = joi
  .object({
    NATS_SERVERS: joi
      .string()
      .default('nats://localhost:4222')
      .description('NATS server URI'),
    PORT: joi.number().default(3000),
    NODE_ENV: joi
      .string()
      .valid('development', 'production', 'test')
      .default('development'),
    DECOLECTA_API_TOKEN: joi
      .string()
      .required()
      .description('Token for Decolecta API service'),
    AWS_SES_SMTP_USERNAME: joi
      .string()
      .required()
      .description('AWS SES SMTP username'),
    AWS_SES_SMTP_PASSWORD: joi
      .string()
      .required()
      .description('AWS SES SMTP password'),
    EMAIL_FROM: joi
      .string()
      .email()
      .required()
      .description('Email address used for sending emails'),
    AWS_REGION: joi.string().required().description('AWS region for services'),
    AWS_ACCESS_KEY_ID: joi.string().required().description('AWS access key ID'),
    AWS_SECRET_ACCESS_KEY: joi
      .string()
      .required()
      .description('AWS secret access key'),
    AWS_S3_BUCKET_NAME: joi
      .string()
      .required()
      .description('AWS S3 bucket name'),
  })

  .unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const envs: EnvVars = value;

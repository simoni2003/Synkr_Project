import { Injectable, Logger } from '@nestjs/common';

/**
 * Em desenvolvimento os códigos aparecem no terminal do backend.
 * Para produção, ligar aqui um fornecedor real (SMTP, Resend, SendGrid...).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger('Mail');

  async sendVerificationCode(email: string, name: string, code: string) {
    this.logger.log(`[DEV] Código de verificação de ${name} <${email}>: ${code}`);
  }

  async sendPasswordResetCode(email: string, name: string, code: string) {
    this.logger.log(`[DEV] Código de recuperação de ${name} <${email}>: ${code}`);
  }
}

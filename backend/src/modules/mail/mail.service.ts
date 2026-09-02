import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type MailMessage = {
    to: string;
    subject: string;
    text: string;
    html: string;
};

// Envío de correo por SMTP. Si no hay `SMTP_HOST` configurado (entorno de
// desarrollo, tests, o antes de tener credenciales) el correo NO se envía:
// se escribe en el log para poder seguir el flujo a mano.
@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly transporter: nodemailer.Transporter | null;
    private readonly from: string;

    constructor(private readonly config: ConfigService) {
        this.from =
            this.config.get<string>('SMTP_FROM') ??
            'Villa Ana María <no-reply@villaanamaria.com>';

        const host = this.config.get<string>('SMTP_HOST');
        if (!host) {
            this.transporter = null;
            this.logger.warn(
                'SMTP_HOST no está configurado: los correos se registrarán en el log en vez de enviarse.',
            );
            return;
        }

        const user = this.config.get<string>('SMTP_USER');
        const pass = this.config.get<string>('SMTP_PASS');
        const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);

        this.transporter = nodemailer.createTransport({
            host,
            port,
            // El puerto 465 usa TLS implícito; 587 usa STARTTLS. Se puede
            // forzar con SMTP_SECURE=true.
            secure: this.config.get<string>('SMTP_SECURE') === 'true' || port === 465,
            auth: user && pass ? { user, pass } : undefined,
        });
    }

    async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
        const subject = 'Restablece tu contraseña · Villa Ana María';
        const text = [
            '¡Hola!',
            '',
            'Recibimos una solicitud para restablecer la contraseña del panel de',
            'administración de Villa Ana María. Abre este enlace para elegir una nueva:',
            '',
            resetUrl,
            '',
            'El enlace vale por 1 hora. Si no fuiste tú, puedes ignorar este correo:',
            'tu contraseña seguirá igual.',
            '',
            'Con cariño,',
            'Villa Ana María',
        ].join('\n');

        const html = `
            <div style="font-family:'Montserrat',Arial,sans-serif;max-width:480px;margin:0 auto;color:#1e2a30">
              <div style="height:6px;background:linear-gradient(90deg,#159db2 0 20%,#f7941d 20% 40%,#b32331 40% 60%,#8cc9b0 60% 80%,#ffc72c 80% 100%)"></div>
              <div style="padding:28px 24px">
                <h1 style="font-size:20px;color:#0c5c68;margin:0 0 12px">¡Hola de nuevo!</h1>
                <p style="font-size:14px;line-height:1.6;margin:0 0 16px">
                  Recibimos una solicitud para restablecer la contraseña del panel de
                  administración de <strong>Villa Ana María</strong>.
                </p>
                <p style="text-align:center;margin:24px 0">
                  <a href="${resetUrl}"
                     style="display:inline-block;background:#159db2;color:#fff;text-decoration:none;
                            font-weight:600;padding:12px 24px;border-radius:10px">
                    Elegir una nueva contraseña
                  </a>
                </p>
                <p style="font-size:12px;line-height:1.6;color:#5b6b71;margin:0 0 8px">
                  El enlace vale por 1 hora. Si el botón no funciona, copia y pega esta
                  dirección en tu navegador:
                </p>
                <p style="font-size:12px;word-break:break-all;color:#159db2;margin:0 0 16px">${resetUrl}</p>
                <p style="font-size:12px;line-height:1.6;color:#5b6b71;margin:0">
                  Si no fuiste tú, puedes ignorar este correo: tu contraseña seguirá igual.
                </p>
              </div>
              <div style="padding:16px 24px;border-top:1px solid #eee;font-size:11px;color:#94a3b8">
                Tradición · Calidez · Sabor · Cariño de hogar
              </div>
            </div>`;

        await this.send({ to, subject, text, html });
    }

    private async send(msg: MailMessage): Promise<void> {
        if (!this.transporter) {
            this.logger.log(
                `[correo simulado] Para: ${msg.to} · Asunto: ${msg.subject}\n${msg.text}`,
            );
            return;
        }

        try {
            const info = await this.transporter.sendMail({ from: this.from, ...msg });
            this.logger.log(
                `Correo enviado a ${msg.to} (messageId: ${info.messageId}).`,
            );
        } catch (error) {
            // No propagamos el fallo de envío: quien llama (p. ej. "olvidé mi
            // contraseña") debe responder igual para no filtrar información ni
            // romper la UX. Queda registrado para diagnóstico.
            this.logger.error(
                `No se pudo enviar el correo a ${msg.to}: ${(error as Error).message}`,
            );
        }
    }
}

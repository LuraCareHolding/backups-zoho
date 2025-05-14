import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  async sendBackupStatusEmail(region: string, success: boolean, message: string) {
    console.log(`[EmailService][sendBackupStatusEmail] Enviando correo para región: ${region}, éxito: ${success}`);
    const mailOptions = {
      from: `"Backup System" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFY_EMAIL,
      subject: success ? `✅ Backup exitoso para ${region}` : `❌ Error en backup de ${region}`,
      text: message,
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`[EmailService][sendBackupStatusEmail] Correo enviado a: ${process.env.NOTIFY_EMAIL}`);
  }
}
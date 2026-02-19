const { Resend } = require('resend');

class EmailService {
    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY);

        if (!process.env.RESEND_API_KEY) {
            console.error("❌ Missing RESEND_API_KEY in environment variables");
        } else {
            console.log("✅ Resend API initialized");
        }
    }

    async send2FACode(email, code, userName) {
        try {
            const response = await this.resend.emails.send({
                from: 'Arroyo Seco <onboarding@resend.dev>',
                to: email,
                subject: 'Código de verificación - Arroyo Seco',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2c3e50;">Verificación de dos factores</h2>
                        <p>Hola ${userName},</p>
                        <p>Tu código de verificación es:</p>
                        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                            <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">${code}</h1>
                        </div>
                        <p>Este código expirará en 10 minutos.</p>
                        <p>Si no solicitaste este código, por favor ignora este correo.</p>
                        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                        <p style="color: #6c757d; font-size: 12px;">Arroyo Seco - Sistema de autenticación</p>
                    </div>
                `,
            });

            console.log('✅ 2FA code emailed to:', email);
            console.log('📨 Resend response:', response);

            return true;

        } catch (error) {
            console.error('❌ Error sending email:', error);
            // Don't throw for now to allow development without valid key
            // throw new Error('Error al enviar el código de verificación');
            return false;
        }
    }
}

module.exports = new EmailService();

// auth-service/services/test-email.js
const { Resend } = require("resend");
const emailService = require('./emailService');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmails() {
  try {
    const res = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "karflores@gmail.com",
      subject: "test",
      html: "<strong>hola</strong>",
    });
    console.log('✅ Email enviado:', res);
  } catch (err) {
    console.error('❌ Error enviando email:', err);
  }
}

testEmails();
// =====================================================
//  E-posta gönderimi (HTTP API ile — Render ücretsiz planı SMTP'yi engeller)
//  Seçenek 1: BREVO_API_KEY + MAIL_FROM   (ücretsiz: günde 300 e-posta)
//  Seçenek 2: RESEND_API_KEY + MAIL_FROM
//  Hiçbiri yoksa: kod sunucu kayıtlarına (Logs) ve admin paneline yazılır.
// =====================================================
const FROM = process.env.MAIL_FROM || '';
const FROM_NAME = process.env.MAIL_FROM_NAME || 'Dijital Mangala';

function configured() { return !!((process.env.BREVO_API_KEY || process.env.RESEND_API_KEY) && FROM); }

async function send(to, subject, html) {
  if (process.env.BREVO_API_KEY && FROM) {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: { email: FROM, name: FROM_NAME }, to: [{ email: to }], subject, htmlContent: html })
    });
    if (!r.ok) throw new Error('Brevo hatası ' + r.status + ': ' + (await r.text()).slice(0, 200));
    return true;
  }
  if (process.env.RESEND_API_KEY && FROM) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ from: `${FROM_NAME} <${FROM}>`, to: [to], subject, html })
    });
    if (!r.ok) throw new Error('Resend hatası ' + r.status + ': ' + (await r.text()).slice(0, 200));
    return true;
  }
  return false;
}

function codeMail(code, kind, lang) {
  const en = lang === 'en';
  const title = kind === 'reset' ? (en ? 'Password reset code' : 'Şifre sıfırlama kodu') : (en ? 'Email verification code' : 'E-posta doğrulama kodu');
  return {
    subject: `${title}: ${code}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;background:#2a1a10;color:#f7ecdc;border-radius:16px">
      <h2 style="color:#f2c14e;margin-top:0">🪨 Dijital Mangala</h2><p>${title}:</p>
      <div style="font-size:36px;font-weight:900;letter-spacing:8px;background:#140b05;color:#f2c14e;text-align:center;padding:14px;border-radius:12px">${code}</div>
      <p style="color:#c9b39a;font-size:13px">${en ? 'This code is valid for 15 minutes. If you did not request it, ignore this email.' : 'Bu kod 15 dakika geçerlidir. Bu isteği sen yapmadıysan bu e-postayı yok say.'}</p></div>`
  };
}
module.exports = { send, configured, codeMail };

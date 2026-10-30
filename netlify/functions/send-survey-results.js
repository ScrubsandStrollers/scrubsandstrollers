const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Bad Request' };
  }

  const { results, version } = body;

  if (!results) {
    return { statusCode: 400, body: 'Missing results' };
  }

  try {
    await resend.emails.send({
      from: 'Scrubs & Strollers <hello@scrubsandstrollers.co.uk>',
      to: 'hello@scrubsandstrollers.com',
      subject: `QIP Survey Response — ${(version || 'unknown').toUpperCase()}-SESSION`,
      text: results,
    });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Failed to send survey email:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

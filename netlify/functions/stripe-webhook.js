const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const customerEmail = session.customer_details && session.customer_details.email;
    const customerName = session.customer_details && session.customer_details.name;
    const sessionId = session.id;

    if (customerEmail) {
      const handbookUrl = `https://scrubsandstrollers.co.uk/handbook?session=${sessionId}`;
      const firstName = customerName ? customerName.split(' ')[0] : 'there';

      try {
        await resend.emails.send({
          from: 'Scrubs & Strollers <hello@scrubsandstrollers.co.uk>',
          to: customerEmail,
          subject: "Your NHS Doctor's Maternity Pay Handbook is ready 🎉",
          html: `
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background:#FDF8F4;font-family:'Georgia',serif">
              <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
                <div style="background:linear-gradient(135deg,#8B2500,#C1440E);padding:40px 40px 32px;text-align:center">
                  <div style="font-family:'Georgia',serif;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px">Scrubs &amp; Strollers</div>
                  <h1 style="margin:0;color:white;font-size:24px;font-weight:700;line-height:1.3">Your handbook is ready, ${firstName}!</h1>
                </div>
                <div style="padding:40px">
                  <p style="font-size:16px;color:#2C1A0E;line-height:1.7;margin:0 0 20px">
                    Thank you for purchasing <strong>The NHS Doctor's Maternity Pay Handbook</strong>. Your payment has been confirmed.
                  </p>
                  <p style="font-size:15px;color:#5C4A3A;line-height:1.7;margin:0 0 32px">
                    Click the button below to access your interactive handbook. We recommend bookmarking the link — it's yours to keep.
                  </p>
                  <div style="text-align:center;margin-bottom:32px">
                    <a href="${handbookUrl}" style="display:inline-block;background:#C1440E;color:white;padding:16px 36px;text-decoration:none;border-radius:100px;font-size:16px;font-weight:600;letter-spacing:0.3px">
                      Access My Handbook →
                    </a>
                  </div>
                  <div style="background:#FDF8F4;border-radius:10px;padding:20px;margin-bottom:24px">
                    <p style="font-size:13px;color:#7A6050;margin:0 0 8px;font-weight:600">Your personal access link:</p>
                    <p style="font-size:12px;color:#C1440E;word-break:break-all;margin:0">
                      <a href="${handbookUrl}" style="color:#C1440E">${handbookUrl}</a>
                    </p>
                  </div>
                  <p style="font-size:13px;color:#9B8880;line-height:1.6;margin:0">
                    Questions? Reply to this email or contact us at <a href="mailto:hello@scrubsandstrollers.co.uk" style="color:#C1440E">hello@scrubsandstrollers.co.uk</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        console.log(`Access email sent to ${customerEmail}`);
      } catch (emailErr) {
        console.error('Failed to send email:', emailErr.message);
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const origin = event.headers.origin || 'https://scrubsandstrollers.co.uk';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: "The NHS Doctor's Maternity Pay Handbook",
            description: 'By Dr. Naomi Cave-Browne-Cave · Digital edition · Instant access',
          },
          unit_amount: 1499, // £14.99 in pence
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/handbook?session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      billing_address_collection: 'auto',
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

import { Request, Response } from 'express';

export const handleStripeWebhook = (request: Request, response: Response) => {
  const event = request.body;

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ PaymentIntent succeeded:', paymentIntent.id);
      break;

    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      console.log('💳 PaymentMethod attached:', paymentMethod.id);
      break;

    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }

  response.json({ received: true });
};

import { Request, Response } from 'express';
import stripe from '../config/stripe';

export async function transferToDriver({
  stripeAccountId,
  amount,
  rideId,
}: {
  stripeAccountId: string;
  amount: number; // in dollars
  rideId: string; // ✅ Corrected name (was: orderId)
}) {
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100), // cents
    currency: 'usd',
    destination: stripeAccountId,
    metadata: {
      rideId,
    },
  });

  return transfer;
}

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

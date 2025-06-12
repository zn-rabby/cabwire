import cors from 'cors';
import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './routes';
import { Morgan } from './shared/morgen';
import { handleStripeWebhook } from './helpers/handleStripeWebhook ';
import stripe from './config/stripe';

const app = express();

app.post(
  '/webhook',
  express.json({ type: 'application/json' }),
  handleStripeWebhook
);

//morgan
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

//body parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//file retrieve
app.use(express.static('uploads'));

//router
app.use('/api/v1', router);
app.get('/check-balance', async (req, res) => {
  try {
    const balance = await stripe.balance.retrieve();

    console.log('🟢 Available Balance:', balance.available);
    console.log('🟡 Pending Balance:', balance.pending);

    return res.status(200).json({
      success: true,
      available: balance.available,
      pending: balance.pending,
    });
  } catch (error: any) {
    console.error('🔴 Error retrieving balance:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve balance.',
      error: error.message,
    });
  }
});

//live response
app.get('/', (req: Request, res: Response) => {
  const date = new Date(Date.now());
  res.send(
    `<h1 style="text-align:center; color:#173616; font-family:Verdana;">Beep-beep! The server is alive and kicking.</h1>
    <p style="text-align:center; color:#173616; font-family:Verdana;">${date}</p>
    <p style="text-align:center; color:#173616; font-family:Verdana;">zn-rabby</p>
    `
  );
});

//global error handle
app.use(globalErrorHandler);

//handle not found route;
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Not found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API DOESN'T EXIST",
      },
    ],
  });
});

export default app;

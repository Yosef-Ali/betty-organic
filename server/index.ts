import express from 'express';
import { checkProductAvailability, getProductPrice, getOrderStatus } from './supabaseFunctions';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/productAvailability', async (req, res) => {
  const productName = req.body.queryResult.parameters.product;
  if (!productName) {
    res.json({ fulfillmentText: 'Please specify a product name.' });
    return;
  }

  const isAvailable = await checkProductAvailability(productName);
  res.json({
    fulfillmentText: isAvailable ? `${productName} is available.` : `${productName} is out of stock.`,
  });
});

app.post('/productPricing', async (req, res) => {
  const productName = req.body.queryResult.parameters.product;
  if (!productName) {
    res.json({ fulfillmentText: 'Please specify a product name.' });
    return;
  }

  const price = await getProductPrice(productName);
  res.json({
    fulfillmentText: price !== null
      ? `The price of ${productName} is $${price}.`
      : `Sorry, we couldn't find the price for ${productName}.`,
  });
});

app.post('/orderTracking', async (req, res) => {
  const orderId = req.body.queryResult.parameters.orderId;
  if (!orderId) {
    res.json({ fulfillmentText: 'Please provide an order ID.' });
    return;
  }

  const orderStatus = await getOrderStatus(orderId);
  res.json({
    fulfillmentText: orderStatus !== null
      ? `Your order status is: ${orderStatus}.`
      : `Sorry, we couldn't find the status for order ID ${orderId}.`,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

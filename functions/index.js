const functions = require('firebase-functions');
const { checkProductAvailability, getProductPrice, getOrderStatus } = require('./supabaseFunctions');

exports.productAvailability = functions.https.onRequest(async (req, res) => {
  const productName = req.body.queryResult.parameters.product;
  const isAvailable = await checkProductAvailability(productName);
  res.json({
    fulfillmentText: isAvailable ? `${productName} is available.` : `${productName} is out of stock.`,
  });
});

exports.productPricing = functions.https.onRequest(async (req, res) => {
  const productName = req.body.queryResult.parameters.product;
  const price = await getProductPrice(productName);
  res.json({
    fulfillmentText: price !== null ? `The price of ${productName} is $${price}.` : `Sorry, we couldn't find the price for ${productName}.`,
  });
});

exports.orderTracking = functions.https.onRequest(async (req, res) => {
  const orderId = req.body.queryResult.parameters.orderId;
  const orderStatus = await getOrderStatus(orderId);
  res.json({
    fulfillmentText: orderStatus !== null ? `Your order status is: ${orderStatus}.` : `Sorry, we couldn't find the status for order ID ${orderId}.`,
  });
});

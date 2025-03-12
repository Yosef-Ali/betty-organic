import { checkProductAvailability, getProductPrice, getOrderStatus } from './supabaseFunctions';

interface Response {
  json: (body: any) => void;
}

interface DialogflowRequest {
  queryResult: {
    parameters: {
      product?: string;
      orderId?: string;
    }
  }
}

interface DialogflowResponse {
  fulfillmentText: string;
}

exports.productAvailability = async (req: Request, res: Response) => {
  const dialogflowRequest = await req.json() as DialogflowRequest;
  const productName = dialogflowRequest.queryResult.parameters.product;
  if (!productName) {
    res.json({ fulfillmentText: 'Please specify a product name.' });
    return;
  }

  const isAvailable = await checkProductAvailability(productName);
  res.json({
    fulfillmentText: isAvailable ? `${productName} is available.` : `${productName} is out of stock.`,
  });
}

exports.productPricing = async (req: Request, res: Response) => {
  const dialogflowRequest = await req.json() as DialogflowRequest;
  const productName = dialogflowRequest.queryResult.parameters.product;
  if (!productName) {
    res.json({ fulfillmentText: 'Please specify a product name.' });
    return;
  }

  const price = await getProductPrice(productName);
  res.json({
    fulfillmentText: price !== null
      ? `The price of ${productName} is Br ${price}.`
      : `Sorry, we couldn't find the price for ${productName}.`,
  });
}

exports.orderTracking = async (req: Request, res: Response) => {
  const dialogflowRequest = await req.json() as DialogflowRequest;
  const orderId = dialogflowRequest.queryResult.parameters.orderId;
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
}

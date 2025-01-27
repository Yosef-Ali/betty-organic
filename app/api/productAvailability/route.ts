import { NextResponse } from 'next/server';
import { checkProductAvailability } from '../../../functions/index';

export async function POST(request: Request) {
  const { product } = await request.json();
  if (!product) {
    return NextResponse.json({
      fulfillmentText: 'Please specify a product name.',
    });
  }

  const isAvailable = await checkProductAvailability(product);
  return NextResponse.json({
    fulfillmentText: isAvailable
      ? `${product} is available.`
      : `${product} is out of stock.`,
  });
}

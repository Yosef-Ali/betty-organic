import OrderDetailsCard from '@/components/OrderDetailsCard';

export default function OrderPage({ params }: { params: { orderId: string } }) {
  return <OrderDetailsCard orderId={params.orderId} />;
}

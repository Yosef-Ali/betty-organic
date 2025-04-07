import OrderDetailsCard from "@/components/OrderDetailsCard";

export default async function OrderPage({
  params,
}: {
  params: { orderId: string };
}) {
  // In Next.js App Router, params should be awaited before use
  const { orderId } = await Promise.resolve(params);
  return <OrderDetailsCard orderId={orderId} />;
}

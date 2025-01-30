import { Suspense } from 'react';
import { CustomerData } from './CustomerData';
import Loading from './loading';

export default function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense fallback={<Loading />}>
      <CustomerData id={params.id} />
    </Suspense>
  );
}

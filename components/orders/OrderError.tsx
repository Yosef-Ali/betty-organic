import { Button } from '@/components/ui/button';

interface OrderErrorProps {
  error: {
    message: string;
    isAuth?: boolean;
  };
  onLogin: () => void;
}

export default function OrderError({ error, onLogin }: OrderErrorProps) {
  return (
    <div className="p-6">
      <div className="text-center text-destructive">{error.message}</div>
      {error.message.includes('permission denied') && (
        <div className="mt-2 text-center text-sm text-muted-foreground">
          Please contact support if you believe this is an error
        </div>
      )}
      {error.isAuth && (
        <div className="mt-4 text-center">
          <Button variant="link" onClick={onLogin} className="text-primary">
            Login to continue
          </Button>
        </div>
      )}
    </div>
  );
}

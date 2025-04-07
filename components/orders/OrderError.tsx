import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, RefreshCw, LogIn } from "lucide-react";

interface OrderErrorProps {
  error: {
    message: string;
    isAuth?: boolean;
  };
  onLogin: () => void;
  onRetry?: () => void;
  retryCount?: number;
}

export default function OrderError({
  error,
  onLogin,
  onRetry,
  retryCount = 0,
}: OrderErrorProps) {
  const isPermissionError = error.message.includes("permission denied");
  const isNotFoundError = error.message.includes("not found");

  return (
    <Card className="overflow-hidden">
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>

        <h3 className="text-lg font-medium mb-2">Error Loading Order</h3>
        <div className="text-center text-destructive mb-4">{error.message}</div>

        {isPermissionError && (
          <div className="mt-2 text-center text-sm text-muted-foreground mb-4">
            You don't have permission to view this order. Please contact support
            if you believe this is an error.
          </div>
        )}

        {isNotFoundError && (
          <div className="mt-2 text-center text-sm text-muted-foreground mb-4">
            The order you're looking for could not be found. It may have been
            deleted or the ID is incorrect.
          </div>
        )}

        <div className="flex gap-4 mt-2">
          {error.isAuth && (
            <Button onClick={onLogin} className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Login to continue
            </Button>
          )}

          <Button
            variant="outline"
            onClick={onRetry || (() => window.location.reload())}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {onRetry
              ? `Retry ${retryCount > 0 ? `(Attempt ${retryCount + 1})` : ""}`
              : "Try again"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

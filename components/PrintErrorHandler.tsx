import React, { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const PrintErrorHandler: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const handlePrintError = (error: Error) => {
    setError(error.message);
    // Log error or send to error tracking service
    console.error("Print error:", error);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Print Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return null;
};

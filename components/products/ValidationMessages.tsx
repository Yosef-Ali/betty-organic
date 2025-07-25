'use client';

import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface ValidationMessagesProps {
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export function ValidationMessages({ errors, warnings, isValid }: ValidationMessagesProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return isValid ? (
      <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          All validations passed! Your product is ready to be saved.
        </AlertDescription>
      </Alert>
    ) : null;
  }

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Please fix the following errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
          <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                Suggestions for improvement
                <Badge variant="outline" className="text-xs">Optional</Badge>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300">{warning}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

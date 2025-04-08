"use client";

import { Loader } from "lucide-react";

export const LoadingSpinner = () => (
    <div className="py-8 flex flex-col items-center justify-center gap-3">
        <Loader className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
            Checking authentication status...
        </p>
    </div>
);

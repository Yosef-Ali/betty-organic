'use client';

import { Component, ReactNode } from 'react';

interface NotificationErrorBoundaryProps {
  children: ReactNode;
}

interface NotificationErrorBoundaryState {
  hasError: boolean;
}

export class NotificationErrorBoundary extends Component<
  NotificationErrorBoundaryProps,
  NotificationErrorBoundaryState
> {
  constructor(props: NotificationErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(): NotificationErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Notification error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-xs text-muted-foreground p-1">
          <span className="text-yellow-600">●</span>
        </div>
      );
    }

    return this.props.children;
  }
}

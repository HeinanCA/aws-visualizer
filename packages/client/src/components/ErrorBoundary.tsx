import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

interface State {
  readonly hasError: boolean;
  readonly error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  readonly state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-full p-8">
          <Card className="max-w-md w-full bg-card/80 backdrop-blur-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 p-3 rounded-full bg-destructive/10 w-fit">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-lg">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground text-sm mb-4">
                {this.state.error?.message ?? 'An unexpected error occurred'}
              </p>
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

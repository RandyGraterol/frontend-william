import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-destructive/10 rounded-full blur-xl scale-150" />
            <div className="relative p-6 rounded-full bg-destructive/10">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-2">
            Algo salió mal
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            Ha ocurrido un error inesperado. Por favor, intente nuevamente o regrese al inicio.
          </p>

          {this.state.error && (
            <details className="mb-6 p-4 bg-muted rounded-lg max-w-md w-full">
              <summary className="text-sm font-medium cursor-pointer text-muted-foreground">
                Ver detalles del error
              </summary>
              <pre className="mt-2 text-xs text-destructive overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleGoHome}>
              <Home className="h-4 w-4 mr-2" />
              Ir al inicio
            </Button>
            <Button onClick={this.handleRetry} className="gradient-primary text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';


interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log error details for debugging
    if (process.env.NODE_ENV === 'development') {
      console.group('🐛 ErrorBoundary Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-tile bg-card p-6">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-sprout-warning text-sprout-dark flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold tracking-[-0.02em] text-foreground">Something went wrong</h2>
                <p className="text-sm text-muted-foreground mt-0.5">An error occurred while showing this part of the app.</p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 text-xs text-muted-foreground bg-field p-3 rounded-[16px] font-mono">
                <strong>Error:</strong> {this.state.error.message}
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Stack Trace</summary>
                    <pre className="mt-2 text-xs overflow-auto">{this.state.error.stack}</pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 h-12 rounded-[18px] bg-field text-foreground font-bold text-[15px]"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 h-12 rounded-[18px] bg-sprout-dark text-sprout-cream font-bold text-[15px] shadow-[inset_0_0_0_2px_#dfc490]"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-muted-foreground text-center mt-3">Check the console for more details</p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
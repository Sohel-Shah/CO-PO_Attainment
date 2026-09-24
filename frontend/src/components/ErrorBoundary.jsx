import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error("Global Error Caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', width: '100vw', background: 'var(--bg-app)', color: 'var(--text-main)', padding: '20px'
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" style={{ marginBottom: 20 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Something went wrong.</h1>
          <p style={{ color: 'var(--text-sub)', marginBottom: '30px', textAlign: 'center', maxWidth: '400px' }}>
            We encountered an unexpected error. Please reload the application to continue.
          </p>
          <button 
            onClick={this.handleReload}
            style={{
              padding: '12px 24px', background: 'var(--brand)', color: 'white', 
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
            }}
          >
            Reload Application
          </button>
          
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginTop: '30px', whiteSpace: 'pre-wrap', color: 'var(--text-muted)', fontSize: '12px', maxWidth: '80%', overflowX: 'auto', background: 'var(--bg-card)', padding: '15px', borderRadius: '8px' }}>
              <summary>Error Details</summary>
              <br/>
              {this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

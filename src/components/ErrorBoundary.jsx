import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="screen-center" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '60px auto' }}>
          <div className="card" style={{ padding: '32px' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>⚠️</span>
            <h2 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Что-то пошло не так</h2>
            <p className="muted" style={{ marginBottom: '24px', fontSize: '14px' }}>
              Произошла непредвиденная ошибка при отображении страницы.
            </p>
            {this.state.error?.message && (
              <pre style={{
                background: 'var(--bg-secondary, #f3f4f6)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '24px',
                color: 'var(--danger, #ef4444)'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button type="button" className="primary" onClick={this.handleReload}>
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

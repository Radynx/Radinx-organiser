import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/Button'

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Radinx Organiser error boundary', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="auth-screen">
          <section className="auth-panel">
            <div className="auth-heading">
              <h1>Qualcosa non ha funzionato</h1>
              <p>La sessione è protetta: ricarica la pagina e riprova.</p>
            </div>
            <Button icon={<RefreshCw size={18} />} onClick={() => window.location.reload()}>
              Ricarica
            </Button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

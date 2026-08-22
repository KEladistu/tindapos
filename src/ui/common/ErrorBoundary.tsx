import { Component, ReactNode } from 'react';

interface State { error: Error | null; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[TindaPOS crash]', error, info);
  }

  resetDb = async () => {
    if (!confirm('Delete local data and reload?')) return;
    indexedDB.deleteDatabase('tindapos');
    location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="h-full p-6 overflow-auto bg-slate-50">
        <div className="max-w-xl mx-auto bg-white border border-red-200 rounded-lg p-5 shadow-sm">
          <h1 className="text-lg font-bold text-red-700 mb-2">Something went wrong</h1>
          <pre className="text-xs bg-slate-100 p-3 rounded overflow-auto whitespace-pre-wrap text-slate-800 mb-4">
{String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-slate-200" onClick={() => location.reload()}>Reload</button>
            <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={this.resetDb}>Reset local data</button>
          </div>
        </div>
      </div>
    );
  }
}

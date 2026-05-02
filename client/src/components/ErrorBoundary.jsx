import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Keep this log for debugging production crashes.
    console.error('UI crash captured by ErrorBoundary:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-bold mb-3">
              Something went wrong
            </h1>
            <p className="text-gray-300 mb-6">
              The page crashed unexpectedly. You can retry or go back to the home page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="bg-[#CA133E] hover:bg-[#A01030] text-white font-semibold px-5 py-2 rounded-xl transition-colors"
              >
                Retry
              </button>
              <Link
                to="/"
                className="border border-gray-600 hover:border-gray-400 text-gray-200 font-semibold px-5 py-2 rounded-xl transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

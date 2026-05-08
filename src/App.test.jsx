import { render } from '@testing-library/react';
import App from './App';
import { ToastProvider } from './components/shared/Toast';

test('renders without crashing', () => {
  render(
    <ToastProvider>
      <App />
    </ToastProvider>
  );
});

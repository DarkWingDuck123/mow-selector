import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Provider as ReduxProvider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import store from './store';
import English from './i18n/en.json';
import App from './App';

function renderApp() {
  return render(
    <IntlProvider locale="en" messages={English}>
      <ReduxProvider store={store}>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </ReduxProvider>
    </IntlProvider>
  );
}

test('renders without crashing', () => {
  renderApp();
  expect(screen.getByText(/Man O'War Fleet Builder/i)).toBeInTheDocument();
});

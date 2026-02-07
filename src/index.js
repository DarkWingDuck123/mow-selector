import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider as ReduxProvider } from "react-redux";
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { IntlProvider } from "react-intl";
import English from "./i18n/en.json";
import Pirate from "./i18n/pi.json";
import { HelmetProvider } from "react-helmet-async";
import store from "./store";

const metaDescription = {
  en: "Fleet Builder for Man O'War.",
  pi: "Fleet Builder fer Man O'War.",
};

// Language detection
const supportedLanguages = ["en", "pi", "de", "fr", "es", "it", "pl"];
const localStorageLanguage = localStorage.getItem("lang");
const locale = (
  localStorageLanguage ||
  navigator.language ||
  navigator.userLanguage
).slice(0, 2);
const language = supportedLanguages.indexOf(locale) === -1 ? "en" : locale;

localStorage.setItem("lang", language);
document.documentElement.setAttribute("lang", language);
document
  .querySelector("meta[name=description]")
  .setAttribute("content", metaDescription[language]);

let messages;
if (language === 'pi') {
  messages = Pirate;
} else {
  messages = English;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <IntlProvider locale={locale} messages={messages}>
    <ReduxProvider store={store}>
      <React.StrictMode>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </React.StrictMode>
    </ReduxProvider>
  </IntlProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

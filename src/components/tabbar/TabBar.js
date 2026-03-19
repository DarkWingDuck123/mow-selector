import { useState } from "react";

import "./TabBar.css";

/**
 * A generic tab bar component.
 *
 * @param {object[]} props.tabs - Array of { id, label, content }
 * @param {string} [props.defaultTab] - id of the tab to show initially (defaults to first)
 */
export const TabBar = ({ tabs, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className="tab-bar">
      <nav className="tab-bar__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-bar__tab${activeTab === tab.id ? " tab-bar__tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab-bar__content${tab.id !== activeTab ? " tab-bar__content--hidden" : ""}`}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};

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
  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

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
      <div className="tab-bar__content">
        {activeContent}
      </div>
    </div>
  );
};

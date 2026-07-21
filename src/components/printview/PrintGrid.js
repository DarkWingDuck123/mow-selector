import { forwardRef } from "react";

import "./PrintGrid.css";

export const PrintGrid = forwardRef(({ cardItems, gridMode }, ref) => (
  <div ref={ref} className={`print-grid${gridMode === "2x2" ? " print-grid--2x2" : ""}`}>
    {cardItems.map(({ key, html }) => (
      <div key={key} className="print-card">
        {html && (
          <div
            className="print-card-inner"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    ))}
  </div>
));

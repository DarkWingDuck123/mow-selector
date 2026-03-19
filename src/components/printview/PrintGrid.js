import { forwardRef } from "react";

import "./PrintGrid.css";

export const PrintGrid = forwardRef(({ cardItems }, ref) => (
  <div ref={ref} className="print-grid">
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

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { Button } from "../button";
import { heavyCard } from "../../utils/card/heavy";
import { lightCard } from "../../utils/card/light";
import { mediumCard } from "../../utils/card/medium";
import { tremendousCard } from "../../utils/card/tremendous";

import "./PrintView.css";

const DEFAULT_META = {
  bgColor: "#d4c5a0",
  fgColor: "#ffffff",
  waterColor: "#7fb3c8",
  accentColor: "#c8a020",
  parchmentColor: "#f5e6b8",
};

function renderCard(meta, obj) {
  switch (obj.weight) {
    case "heavy":
      return heavyCard(meta, obj, {});
    case "light":
      return lightCard(meta, obj, {});
    case "medium":
      return mediumCard(meta, obj, {});
    case "tremendous":
      return tremendousCard(meta, obj, {});
    default:
      return null;
  }
}

export const PrintView = ({ listId, bwOverride, onBwOverride }) => {
  const lists = useSelector((state) => state.lists);
  const list = lists?.find((l) => l.id === listId);

  const rulesetId = list?.rulesetId;
  const factionId = list?.factionId;

  const [meta, setMeta] = useState(null);
  const [cardObjs, setCardObjs] = useState({});

  useEffect(() => {
    if (!rulesetId || !factionId) {
      setMeta(null);
      return;
    }
    fetch(`${process.env.PUBLIC_URL}/games/${rulesetId}/${factionId}/${factionId}.json`)
      .then((r) => r.json())
      .then((factionData) => {
        const styleUrl = bwOverride || !factionData.style
          ? `${process.env.PUBLIC_URL}/games/bw.json`
          : `${process.env.PUBLIC_URL}/games/${rulesetId}/${factionId}/${factionData.style}.json`;
        return fetch(styleUrl).then((r) => r.json()).catch(() => ({}));
      })
      .then((styleData) => setMeta({ ...DEFAULT_META, ...styleData }))
      .catch(() => setMeta({ ...DEFAULT_META }));
  }, [rulesetId, factionId, bwOverride]);

  const uniqueCardIds = [...new Set(list?.cards?.map((c) => c.id) ?? [])].sort().join(",");

  useEffect(() => {
    if (!rulesetId || !factionId || !uniqueCardIds) {
      setCardObjs({});
      return;
    }
    const ids = uniqueCardIds.split(",");
    Promise.all(
      ids.map((id) =>
        fetch(`${process.env.PUBLIC_URL}/games/${rulesetId}/${factionId}/${id}.json`)
          .then((r) => {
            if (!r.ok) return { id, obj: null };
            return r.json().then((obj) => ({ id, obj }));
          })
          .catch(() => ({ id, obj: null }))
      )
    ).then((results) => {
      const map = {};
      results.forEach(({ id, obj }) => {
        map[id] = obj;
      });
      setCardObjs(map);
    });
  }, [rulesetId, factionId, uniqueCardIds]);

  const handlePrint = () => {
    const cards = list?.cards ?? [];
    const cardHtmls = cards.flatMap((card) => {
      const obj = cardObjs[card.id];
      if (!obj || !meta) return [];
      const html = renderCard(meta, obj);
      if (!html) return [];
      const count = card.number || 1;
      return Array.from({ length: count }, () => html);
    });

    const printWindow = window.open("", "", "width=900,height=1100");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Fleet Cards</title>
  <style>
    @page { size: letter portrait; margin: 0.5cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; }
    .print-grid {
      display: grid;
      grid-template-columns: repeat(3, 240px);
      gap: 3px;
    }
    .print-card {
      width: 240px;
      height: 336px;
      overflow: hidden;
      position: relative;
    }
    .print-card:nth-child(9n) {
      break-after: page;
    }
    .print-card-inner {
      position: absolute;
      top: 0;
      left: 0;
      width: 500px;
      height: 700px;
      transform-origin: top left;
      transform: scale(0.48);
    }
  </style>
</head>
<body>
  <div class="print-grid">
    ${cardHtmls
      .map((html) => `<div class="print-card"><div class="print-card-inner">${html}</div></div>`)
      .join("")}
  </div>
  <script>
    window.addEventListener('load', function() {
      window.print();
      window.addEventListener('afterprint', function() { window.close(); });
    });
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  const hasCards = !!listId && !!list?.cards?.length;
  const allLoaded = hasCards && !!meta && list.cards.every((card) => cardObjs[card.id] !== undefined);

  return (
    <div className="print-view">
      <Button onClick={handlePrint} disabled={!allLoaded}>
        Print
      </Button>
      <label className="print-view__bw-label">
        <input
          type="checkbox"
          checked={!!bwOverride}
          onChange={(e) => onBwOverride(e.target.checked)}
        />
        B&amp;W
      </label>
    </div>
  );
};

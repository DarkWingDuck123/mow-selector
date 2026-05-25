import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import DOMPurify from "dompurify";

import { Button } from "../button";
import { PrintGrid } from "./PrintGrid";
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
  const customFactions = useSelector((state) => state.customFactions);
  const customCards = useSelector((state) => state.customCards);
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
    const customFaction = customFactions.find(
      (f) => f.id === factionId && f.rulesetId === rulesetId
    );
    if (bwOverride) {
      fetch(`${process.env.PUBLIC_URL}/games/bw.json`)
        .then((r) => r.json())
        .then((styleData) => setMeta({ ...DEFAULT_META, ...styleData }))
        .catch(() => setMeta({ ...DEFAULT_META }));
    } else if (customFaction) {
      const styleData = customFaction.style && typeof customFaction.style === 'object' ? customFaction.style : {};
      setMeta({ ...DEFAULT_META, ...styleData });
    } else {
      fetch(`${process.env.PUBLIC_URL}/games/${rulesetId}/${factionId}/${factionId}.json`)
        .then((r) => r.json())
        .then((factionData) => {
          const styleData = factionData.style && typeof factionData.style === 'object' ? factionData.style : {};
          setMeta({ ...DEFAULT_META, ...styleData });
        })
        .catch(() => setMeta({ ...DEFAULT_META }));
    }
  }, [rulesetId, factionId, bwOverride, customFactions]);

  const uniqueCardIds = [...new Set(list?.cards?.map((c) => c.id).filter((id) => id !== "blank") ?? [])].sort().join(",");

  useEffect(() => {
    if (!rulesetId || !factionId || !uniqueCardIds) {
      setCardObjs({});
      return;
    }
    const ids = uniqueCardIds.split(",");
    Promise.all(
      ids.map((id) => {
        const customCard = customCards.find(
          (c) => c.factionId === factionId && c.id === id && c.rulesetId === rulesetId
        );
        if (customCard) return Promise.resolve({ id, obj: customCard });
        return fetch(`${process.env.PUBLIC_URL}/games/${rulesetId}/${factionId}/${id}.json`)
          .then((r) => {
            if (!r.ok) return { id, obj: null };
            return r.json().then((obj) => ({ id, obj }));
          })
          .catch(() => ({ id, obj: null }));
      })
    ).then((results) => {
      const map = {};
      results.forEach(({ id, obj }) => {
        map[id] = obj;
      });
      setCardObjs(map);
    });
  }, [rulesetId, factionId, uniqueCardIds, customCards]);

  const cardItems = (list?.cards ?? []).flatMap((card, i) => {
    const count = card.number || 1;
    if (card.id === "blank") {
      return Array.from({ length: count }, (_, j) => ({
        key: `blank-${i}-${j}`,
        html: null,
      }));
    }
    const obj = cardObjs[card.id];
    if (!obj || !meta) return [];
    const html = DOMPurify.sanitize(renderCard(meta, obj));
    if (!html) return [];
    return Array.from({ length: count }, (_, j) => ({
      key: `${card.uid || card.id}-${i}-${j}`,
      html,
    }));
  });

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `@page { size: letter portrait; margin: 0.5in; }`,
  });

  const handlePreview = () => {
    const previewWindow = window.open("", "_blank", "width=760,height=1050");
    if (!previewWindow) return;
    previewWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Print Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #888; padding: 20px; }
    .page {
      background: white;
      width: 720px;
      min-height: 669px;
      margin: 0 auto;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(3, 238px);
      gap: 3px;
      justify-content: center;
      align-content: start;
    }
    .print-card {
      width: 238px;
      height: 333px;
      overflow: hidden;
      position: relative;
    }
    .print-card-inner {
      position: absolute;
      top: 0; left: 0;
      width: 500px;
      height: 700px;
      transform-origin: top left;
      transform: scale(0.476);
    }
  </style>
</head>
<body>
  <div class="page">
    ${cardItems.map(({ html }) =>
      html
        ? `<div class="print-card"><div class="print-card-inner">${DOMPurify.sanitize(html)}</div></div>`
        : `<div class="print-card"></div>`
    ).join("")}
  </div>
</body>
</html>`);
    previewWindow.document.close();
  };

  const hasCards = !!listId && !!list?.cards?.length;
  const allLoaded = hasCards && !!meta && list.cards.every((card) => card.id === "blank" || cardObjs[card.id] !== undefined);

  return (
    <>
      <PrintGrid ref={printRef} cardItems={cardItems} />
      <div className="print-view">
        <Button onClick={handlePrint} disabled={!allLoaded}>
          Print
        </Button>
        <Button onClick={handlePreview} disabled={!allLoaded}>
          Preview
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
    </>
  );
};

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
import { negligibleCard } from "../../utils/card/negligible";

import "./PrintView.css";

function buildCrewCardObj(addonDef, list) {
  const crewGroups = (list.crew || []).reduce((groups, entry) => {
    const key = entry.freebieKey || entry.id;
    const existing = groups.find((g) => g.key === key);
    if (existing) { existing.count++; }
    else { groups.push({ key, entry, count: 1 }); }
    return groups;
  }, []).sort((a, b) => a.count - b.count || a.entry.name.localeCompare(b.entry.name));

  const crewHtml = crewGroups.length === 0
    ? "<i>No crew assigned</i>"
    : crewGroups.map((group) => {
        const prefix = group.count > 1 ? `${group.count} ` : "";
        const pts = group.entry.cost === "-" ? "- pts" : `${Number(group.entry.cost) * group.count} pts`;
        const desc = group.entry.description
          ? `<div style="margin-left:12px;font-size:0.85em;"><i>${group.entry.description}</i></div>`
          : "";
        return `<div style="display:flex;justify-content:space-between;align-items:baseline;"><b>${prefix}${group.entry.name}</b><span style="font-size:0.85em;white-space:nowrap;">${pts}</span></div>${desc}`;
      }).join("");

  const totalCost = (list.crew || []).reduce((sum, c) => sum + (Number(c.cost) || 0), 0);

  return {
    weight: "negligible",
    name: { value: addonDef.name_en || addonDef.name || "Crew Card", scale: 1.0 },
    type: { value: (addonDef.type_name_en || addonDef.type_name || "Crew").toUpperCase(), scale: 0.75 },
    honors: { value: "", scale: 1.0 },
    cost: { value: `${totalCost} pts`, scale: 1.0 },
    notes: [
      {
        height: 100,
        title: { value: "Description", scale: 1.0 },
        note: {
          value: `<div style="position:absolute;top:0;left:0;right:0;bottom:0;overflow:auto;text-align:left;padding:4px 8px;">${crewHtml}</div>`,
          scale: 1.0,
        },
      },
    ],
  };
}

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
    case "negligible":
      return negligibleCard(meta, obj, {});
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

  const [factionData, setFactionData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [cardObjs, setCardObjs] = useState({});

  useEffect(() => {
    if (!rulesetId || !factionId) { setFactionData(null); return; }
    fetch(`${process.env.PUBLIC_URL}/games/${rulesetId}/${factionId}/${factionId}.json`)
      .then((r) => r.json())
      .then(setFactionData)
      .catch(() => setFactionData(null));
  }, [rulesetId, factionId]);

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

  const crewCardIds = new Set(
    (factionData?.addons ?? []).filter((a) => a.type === "crew_card").map((a) => a.id)
  );

  const uniqueCardIds = [
    ...new Set(
      (list?.cards ?? [])
        .map((c) => c.id)
        .filter((id) => id !== "blank" && !crewCardIds.has(id))
    ),
  ].sort().join(",");

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

    const addonDef = factionData?.addons?.find((a) => a.id === card.id);
    if (addonDef?.type === "crew_card") {
      const obj = buildCrewCardObj(addonDef, list);
      const html = meta ? DOMPurify.sanitize(negligibleCard(meta, obj, {})) : null;
      if (!html) return [];
      return Array.from({ length: count }, (_, j) => ({
        key: `${card.uid || card.id}-${i}-${j}`,
        html,
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
  const allLoaded = hasCards && !!meta && list.cards.every(
    (card) => card.id === "blank" || crewCardIds.has(card.id) || cardObjs[card.id] !== undefined
  );

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

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
        return `<div style="display:flex;justify-content:space-between;align-items:baseline;padding-right:16px;"><b>${prefix}${group.entry.name}</b><span style="font-size:0.85em;white-space:nowrap;">${pts}</span></div>${desc}`;
      }).join("");

  const totalCost = (list.crew || []).reduce((sum, c) => sum + (Number(c.cost) || 0), 0);

  return {
    weight: "negligible",
    name: { value: (addonDef.name_en || addonDef.name || "Crew Card").toUpperCase(), scale: 1.0 },
    type: { value: (addonDef.type_name_en || addonDef.type_name || "Crew").toUpperCase(), scale: 0.75 },
    honors: { value: "", scale: 1.0 },
    cost: { value: `${totalCost} pts`, scale: 1.0 },
    notes: [
      {
        height: 100,
        title: { value: "DESCRIPTION", scale: 1.0 },
        note: {
          value: crewHtml,
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

function renderCard(meta, obj, inst) {
  switch (obj.weight) {
    case "heavy":      return heavyCard(meta, obj, inst);
    case "light":      return lightCard(meta, obj, inst);
    case "medium":     return mediumCard(meta, obj, inst);
    case "tremendous": return tremendousCard(meta, obj, inst);
    case "negligible": return negligibleCard(meta, obj, inst);
    default:           return null;
  }
}

export const PrintView = ({ listId, bwOverride, onBwOverride }) => {
  const lists = useSelector((state) => state.lists);
  const customFactions = useSelector((state) => state.customFactions);
  const customCards = useSelector((state) => state.customCards);
  const list = lists?.find((l) => l.id === listId);

  const rulesetId = list?.rulesetId;
  const factionId = list?.factionId;

  // Primary faction data — needed to detect crew_card addons
  const [factionData, setFactionData] = useState(null);

  useEffect(() => {
    if (!rulesetId || !factionId) { setFactionData(null); return; }
    fetch(`${process.env.PUBLIC_URL}/games/${rulesetId}/${factionId}/${factionId}.json`)
      .then((r) => r.json())
      .then(setFactionData)
      .catch(() => setFactionData(null));
  }, [rulesetId, factionId]);

  // metaByFaction: factionId -> meta object
  const [metaByFaction, setMetaByFaction] = useState({});
  // cardObjs: "factionId/cardId" -> card obj
  const [cardObjs, setCardObjs] = useState({});

  const crewCardIds = new Set(
    (factionData?.addons ?? []).filter((a) => a.type === "crew_card").map((a) => a.id)
  );

  // Build unique "factionId/cardId" pairs, excluding blanks and crew cards.
  // Always include the primary factionId so crew card meta is available.
  const uniquePairsStr = [
    ...new Set([
      // Sentinel so the primary faction is always in the meta fetch
      `${factionId}/__primary__`,
      ...(list?.cards ?? [])
        .filter((c) => c.id !== "blank" && !crewCardIds.has(c.id))
        .map((c) => `${c.factionId || factionId}/${c.id}`)
        .filter((key) => !key.startsWith("/")),
    ]),
  ].sort().join(",");

  useEffect(() => {
    if (!rulesetId || !factionId) {
      setMetaByFaction({});
      return;
    }

    const pairs = uniquePairsStr.split(",").map((key) => {
      const slashIdx = key.indexOf("/");
      return { factionId: key.slice(0, slashIdx), id: key.slice(slashIdx + 1) };
    });

    const uniqueFactionIds = [...new Set(pairs.map((p) => p.factionId))];

    const bwStylePromise = bwOverride
      ? fetch(`${process.env.PUBLIC_URL}/games/bw.json`).then((r) => r.json()).catch(() => ({}))
      : Promise.resolve(null);

    Promise.all(
      uniqueFactionIds.map(async (fId) => {
        const customFaction = customFactions.find((f) => f.id === fId && f.rulesetId === rulesetId);
        let styleData;
        if (bwOverride) {
          styleData = await bwStylePromise;
        } else if (customFaction) {
          styleData = customFaction.style && typeof customFaction.style === "object" ? customFaction.style : {};
        } else {
          const fJson = await fetch(`${process.env.PUBLIC_URL}/games/${rulesetId}/${fId}/${fId}.json`)
            .then((r) => r.json())
            .catch(() => ({}));
          styleData = fJson.style && typeof fJson.style === "object" ? fJson.style : {};
        }
        return { factionId: fId, meta: { ...DEFAULT_META, ...styleData } };
      })
    ).then((results) => {
      const map = {};
      results.forEach(({ factionId: fId, meta }) => { map[fId] = meta; });
      setMetaByFaction(map);
    });
  }, [rulesetId, factionId, uniquePairsStr, bwOverride, customFactions]);

  useEffect(() => {
    if (!rulesetId || !factionId) {
      setCardObjs({});
      return;
    }

    const pairs = uniquePairsStr
      .split(",")
      .map((key) => {
        const slashIdx = key.indexOf("/");
        return { factionId: key.slice(0, slashIdx), id: key.slice(slashIdx + 1) };
      })
      .filter((p) => p.id !== "__primary__");

    if (!pairs.length) { setCardObjs({}); return; }

    Promise.all(
      pairs.map(({ factionId: fId, id }) => {
        const key = `${fId}/${id}`;
        const customCard = customCards.find(
          (c) => c.factionId === fId && c.id === id && c.rulesetId === rulesetId
        );
        if (customCard) return Promise.resolve({ key, obj: customCard });
        return fetch(`${process.env.PUBLIC_URL}/games/${rulesetId}/${fId}/${id}.json`)
          .then((r) => {
            if (!r.ok) return { key, obj: null };
            return r.json().then((obj) => ({ key, obj }));
          })
          .catch(() => ({ key, obj: null }));
      })
    ).then((results) => {
      const map = {};
      results.forEach(({ key, obj }) => { map[key] = obj; });
      setCardObjs(map);
    });
  }, [rulesetId, factionId, uniquePairsStr, customCards]);

  const cardItems = (list?.cards ?? []).flatMap((card, i) => {
    const count = card.number || 1;
    if (card.id === "blank") {
      return Array.from({ length: count }, (_, j) => ({ key: `blank-${i}-${j}`, html: null }));
    }

    const cardFactionId = card.factionId || factionId;
    const meta = metaByFaction[cardFactionId];

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

    const obj = cardObjs[`${cardFactionId}/${card.id}`];
    if (!obj || !meta) return [];
    const effectiveObj = card.randomOverride ? { ...obj, ...card.randomOverride } : obj;
    return Array.from({ length: count }, (_, j) => {
      const shipName = (card.shipNames || [])[j];
      const inst = shipName ? { name: { value: shipName, scale: 1.0 } } : {};
      const html = DOMPurify.sanitize(renderCard(meta, effectiveObj, inst));
      if (!html) return null;
      return { key: `${card.uid || card.id}-${i}-${j}`, html };
    }).filter(Boolean);
  });

  const CARDS_PER_PAGE = 9;
  const totalPages = Math.max(1, Math.ceil(cardItems.length / CARDS_PER_PAGE));
  const [page, setPage] = useState(1);
  const [allPages, setAllPages] = useState(false);
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const pageItems = allPages ? cardItems : cardItems.slice((clampedPage - 1) * CARDS_PER_PAGE, clampedPage * CARDS_PER_PAGE);

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
  <title>Print Preview — ${allPages ? `All ${totalPages} pages` : `Page ${clampedPage} of ${totalPages}`}</title>
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
    ${pageItems.map(({ html }) =>
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
  const allLoaded = hasCards && list.cards.every((card) => {
    if (card.id === "blank") return true;
    const cardFactionId = card.factionId || factionId;
    if (!metaByFaction[cardFactionId]) return false;
    if (crewCardIds.has(card.id)) return true;
    return cardObjs[`${cardFactionId}/${card.id}`] !== undefined;
  });

  return (
    <>
      <PrintGrid ref={printRef} cardItems={pageItems} />
      <div className="print-view">
        <Button onClick={handlePrint} disabled={!allLoaded}>
          Print
        </Button>
        <Button onClick={handlePreview} disabled={!allLoaded}>
          Preview
        </Button>
        <div className="print-view__page-control">
          <span>Page</span>
          <input
            type="number"
            className="print-view__page-input"
            min={1}
            max={totalPages}
            value={page}
            disabled={allPages}
            onChange={(e) => setPage(Number(e.target.value))}
          />
          <span>of {totalPages}</span>
        </div>
        <label className="print-view__bw-label">
          <input
            type="checkbox"
            checked={allPages}
            onChange={(e) => setAllPages(e.target.checked)}
          />
          All pages
        </label>
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

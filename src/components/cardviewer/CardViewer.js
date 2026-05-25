import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import DOMPurify from "dompurify";

import { heavyCard } from "../../utils/card/heavy";
import { lightCard } from "../../utils/card/light";
import { mediumCard } from "../../utils/card/medium";
import { tremendousCard } from "../../utils/card/tremendous";
import { negligibleCard } from "../../utils/card/negligible";

import "./CardViewer.css";

const DEFAULT_META = {
  bgColor: "#d4c5a0",
  fgColor: "#ffffff",
  waterColor: "#7fb3c8",
  accentColor: "#c8a020",
  parchmentColor: "#f5e6b8",
};

function renderCard(meta, obj, inst) {
  switch (obj.weight) {
    case "heavy":
      return heavyCard(meta, obj, inst);
    case "light":
      return lightCard(meta, obj, inst);
    case "medium":
      return mediumCard(meta, obj, inst);
    case "tremendous":
      return tremendousCard(meta, obj, inst);
    case "negligible":
      return negligibleCard(meta, obj, inst);
    default:
      return null;
  }
}

function buildCrewCardObj(addonDef, list) {
  // Group crew by freebieKey or id, sorted by count then name (same as ListEditor)
  const crewGroups = (list.crew || []).reduce((groups, entry) => {
    const key = entry.freebieKey || entry.id;
    const existing = groups.find((g) => g.key === key);
    if (existing) {
      existing.count++;
    } else {
      groups.push({ key, entry, count: 1 });
    }
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

export const CardViewer = ({ listId, bwOverride }) => {
  const lists = useSelector((state) => state.lists);
  const customFactions = useSelector((state) => state.customFactions);
  const customCards = useSelector((state) => state.customCards);
  const list = lists?.find((l) => l.id === listId);

  const rulesetId = list?.rulesetId;
  const factionId = list?.factionId;

  // Primary faction data — needed for crew_card detection
  const [factionData, setFactionData] = useState(null);

  useEffect(() => {
    if (!rulesetId || !factionId) {
      setFactionData(null);
      return;
    }
    fetch(`${process.env.PUBLIC_URL}/games/${rulesetId}/${factionId}/${factionId}.json`)
      .then((r) => r.json())
      .then(setFactionData)
      .catch(() => setFactionData(null));
  }, [rulesetId, factionId]);

  // metaByFaction: factionId -> meta object
  const [metaByFaction, setMetaByFaction] = useState({});
  // cardObjs: "factionId/cardId" -> card obj
  const [cardObjs, setCardObjs] = useState({});

  // Build unique "factionId/cardId" pairs for all non-blank cards.
  // Fall back to list.factionId for cards that predate per-card factionId tracking.
  const uniquePairsStr = [
    ...new Set(
      (list?.cards || [])
        .filter((c) => c.id !== "blank")
        .map((c) => `${c.factionId || factionId}/${c.id}`)
        .filter((key) => !key.startsWith("/"))
    ),
  ].sort().join(",");

  useEffect(() => {
    if (!rulesetId || !uniquePairsStr) {
      setCardObjs({});
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
          styleData = customFaction.style && typeof customFaction.style === 'object' ? customFaction.style : {};
        } else {
          const fJson = await fetch(`${process.env.PUBLIC_URL}/games/${rulesetId}/${fId}/${fId}.json`)
            .then((r) => r.json())
            .catch(() => ({}));
          styleData = fJson.style && typeof fJson.style === 'object' ? fJson.style : {};
        }
        return { factionId: fId, meta: { ...DEFAULT_META, ...styleData } };
      })
    ).then((results) => {
      const map = {};
      results.forEach(({ factionId: fId, meta }) => { map[fId] = meta; });
      setMetaByFaction(map);
    });

    // Fetch card JSONs; serve custom cards from state without fetching
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
  }, [rulesetId, uniquePairsStr, bwOverride, customFactions, customCards]);

  const gridRef = useRef(null);
  const [cardScale, setCardScale] = useState(0.5);

  useEffect(() => {
    if (!gridRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const colWidth = (entry.contentRect.width - 6) / 3; // 2 gaps of 3px
        setCardScale(colWidth / 500);
      }
    });
    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="card-viewer" ref={gridRef}>
      {!listId && <p className="card-viewer__message">No list selected.</p>}
      {listId && !list?.cards?.length && <p className="card-viewer__message">No cards in this fleet.</p>}
      {listId && list?.cards?.flatMap((card, i) => {
        const count = card.number || 1;

        if (card.id === "blank") {
          return Array.from({ length: count }, (_, j) => (
            <div key={`blank-${i}-${j}`} className="card-viewer__card" />
          ));
        }

        const cardFactionId = card.factionId || factionId;
        const meta = metaByFaction[cardFactionId];

        // Dynamic crew card — build obj from list.crew
        const addonDef = factionData?.addons?.find((a) => a.id === card.id);
        if (addonDef?.type === "crew_card") {
          const obj = buildCrewCardObj(addonDef, list);
          const html = meta ? DOMPurify.sanitize(negligibleCard(meta, obj, {})) : null;
          return Array.from({ length: count }, (_, j) => (
            <div key={`${card.uid || `${card.id}-${i}`}-${j}`} className="card-viewer__card">
              {html ? (
                <div
                  className="card-viewer__card-inner"
                  style={{ transform: `scale(${cardScale})` }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <div className="card-viewer__placeholder">{card.name || card.id}</div>
              )}
            </div>
          ));
        }

        const obj = cardObjs[`${cardFactionId}/${card.id}`];
        return Array.from({ length: count }, (_, j) => {
          const shipName = (card.shipNames || [])[j];
          const inst = shipName ? { name: { value: shipName, scale: 1.0 } } : {};
          const html = obj && meta ? DOMPurify.sanitize(renderCard(meta, obj, inst)) : null;
          return (
            <div key={`${card.uid || `${card.id}-${i}`}-${j}`} className="card-viewer__card">
              {html ? (
                <div
                  className="card-viewer__card-inner"
                  style={{ transform: `scale(${cardScale})` }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <div className="card-viewer__placeholder">
                  {obj === undefined ? "Loading..." : (card.name || card.id)}
                </div>
              )}
            </div>
          );
        });
      })}
    </div>
  );
};

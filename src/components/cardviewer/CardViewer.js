import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

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
  const list = lists?.find((l) => l.id === listId);

  const rulesetId = list?.rulesetId;
  const factionId = list?.factionId;

  const [meta, setMeta] = useState(null);
  const [factionData, setFactionData] = useState(null);
  const [cardObjs, setCardObjs] = useState({});

  useEffect(() => {
    if (!rulesetId || !factionId) {
      setMeta(null);
      setFactionData(null);
      return;
    }
    fetch(`${process.env.PUBLIC_URL}/games/${rulesetId}/${factionId}/${factionId}.json`)
      .then((r) => r.json())
      .then((fd) => {
        setFactionData(fd);
        const styleUrl = bwOverride || !fd.style
          ? `${process.env.PUBLIC_URL}/games/bw.json`
          : `${process.env.PUBLIC_URL}/games/${rulesetId}/${factionId}/${fd.style}.json`;
        return fetch(styleUrl).then((r) => r.json()).catch(() => ({}));
      })
      .then((styleData) => setMeta({ ...DEFAULT_META, ...styleData }))
      .catch(() => setMeta({ ...DEFAULT_META }));
  }, [rulesetId, factionId, bwOverride]);

  // Exclude crew_card type from JSON fetches — they're built dynamically
  const crewCardIds = new Set(
    (factionData?.addons || []).filter((a) => a.type === "crew_card").map((a) => a.id)
  );

  const uniqueCardIds = [
    ...new Set(
      list?.cards
        ?.map((c) => c.id)
        .filter((id) => id !== "blank" && !crewCardIds.has(id)) ?? []
    ),
  ].sort().join(",");

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

        // Dynamic crew card — build obj from list.crew
        const addonDef = factionData?.addons?.find((a) => a.id === card.id);
        if (addonDef?.type === "crew_card") {
          const obj = buildCrewCardObj(addonDef, list);
          const html = meta ? negligibleCard(meta, obj, {}) : null;
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

        const obj = cardObjs[card.id];
        const html = obj && meta ? renderCard(meta, obj, {}) : null;
        return Array.from({ length: count }, (_, j) => (
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
        ));
      })}
    </div>
  );
};

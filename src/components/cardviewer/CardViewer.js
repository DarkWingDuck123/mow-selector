import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { heavyCard } from "../../utils/card/heavy";
import { lightCard } from "../../utils/card/light";
import { mediumCard } from "../../utils/card/medium";
import { tremendousCard } from "../../utils/card/tremendous";

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
    default:
      return null;
  }
}

export const CardViewer = ({ listId, bwOverride }) => {
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

  const uniqueCardIds = [...new Set(list?.cards?.map((c) => c.id).filter((id) => id !== "blank") ?? [])].sort().join(",");

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

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import DOMPurify from "dompurify";
import { ListEntry } from "../../components/listentry";
import { updateList, moveCard, removeCrew, removeCrewGroup, moveCrew, syncFreebies, batchRandomize } from "../../state/lists";
import { randomName } from "../../utils/naming";
import { OrderableList } from "../../components/orderablelist";
import gameSystems from "../../assets/factions.json";
import { getRandomId } from "../../utils/id";
import { getAllUnits, getAllCrew } from "../../utils/faction";
import { buildFleetListCardObj } from "../../utils/fleetList";

import "./ListEditor.css";

// Parses a freebie `free` string plus optional object-level `points` field.
// Returns one of:
//   { count, unitName, triggerType: "pts", points, repeating }
//   { count, unitName, triggerType: "unit", triggerName }
// or null if unparseable.
// Formats:
//   "1 Admiral"                       one-time pts trigger (threshold from freebie.points or 0)
//   "2 Slave per 100 pts"             repeating pts trigger every 100 pts
//   "2 Griffon Rider per Man O'War"   unit trigger: 1 tier per matching unit in the fleet
function parseFreebie(free, freebiePoints) {
  const perMatch = free.trim().match(/^(\d+)\s+(.+?)\s+per\s+(.+)$/i);
  if (perMatch) {
    const triggerText = perMatch[3].trim();
    const ptsMatch = triggerText.match(/^(\d+)\s+pts?$/i);
    if (ptsMatch) {
      return {
        count: parseInt(perMatch[1], 10),
        unitName: perMatch[2].trim().toLowerCase(),
        triggerType: "pts",
        points: parseInt(ptsMatch[1], 10),
        repeating: true,
      };
    }
    const unitCountMatch = triggerText.match(/^\d+\s+(.+)$/i);
    return {
      count: parseInt(perMatch[1], 10),
      unitName: perMatch[2].trim().toLowerCase(),
      triggerType: "unit",
      triggerName: (unitCountMatch ? unitCountMatch[1] : triggerText).toLowerCase(),
    };
  }
  const simpleMatch = free.trim().match(/^(\d+)\s+(.+)$/i);
  if (simpleMatch) {
    return {
      count: parseInt(simpleMatch[1], 10),
      unitName: simpleMatch[2].trim().toLowerCase(),
      triggerType: "pts",
      points: Number(freebiePoints) || 0,
      repeating: false,
    };
  }
  return null;
}

// Count how many cards/crew in the list match a trigger by name_en, name, type_name, or type.
function countTriggerUnits(triggerName, list, factionData) {
  const trigger = triggerName.toLowerCase();
  const matchesName = (u) =>
    u.name_en?.toLowerCase() === trigger ||
    u.name?.toLowerCase() === trigger ||
    u.type_name?.toLowerCase() === trigger ||
    u.type?.toLowerCase() === trigger;

  const allUnits = getAllUnits(factionData);
  const allCrew = getAllCrew(factionData);
  const matchingUnits = allUnits.filter(matchesName);
  const matchingCrew = allCrew.filter(matchesName);
  const matchingUnitIds = new Set(matchingUnits.map((u) => u.id));
  const matchingCrewIds = new Set(matchingCrew.map((u) => u.id));

  // When multiple faction units share an id (e.g. "Khorne Deathgalley" and
  // "Nurgle Deathgalley" both using id "deathgalley"), fall back to matching
  // by the name stored on the list entry to avoid false positives.
  const ambiguousUnitIds = new Set(
    matchingUnits
      .filter((u) => allUnits.filter((o) => o.id === u.id).length > 1)
      .map((u) => u.id)
  );
  const ambiguousCrewIds = new Set(
    matchingCrew
      .filter((u) => allCrew.filter((o) => o.id === u.id).length > 1)
      .map((u) => u.id)
  );

  return (
    (list.cards || []).filter((c) => {
      if (!matchingUnitIds.has(c.id)) return false;
      if (ambiguousUnitIds.has(c.id)) return c.name?.toLowerCase() === trigger;
      return true;
    }).length +
    (list.crew || []).filter((c) => {
      if (!matchingCrewIds.has(c.id)) return false;
      if (ambiguousCrewIds.has(c.id)) return c.name?.toLowerCase() === trigger;
      return true;
    }).length
  );
}

function findUnit(factionData, unitName) {
  const search = (arr, entryType) => {
    const unit = arr?.find((u) =>
      u.id?.toLowerCase() === unitName ||
      u.name_en?.toLowerCase() === unitName ||
      u.name?.toLowerCase() === unitName
    );
    return unit ? { unit, entryType } : null;
  };
  return (
    search(getAllCrew(factionData), "crew") ||
    search(getAllUnits(factionData), "cards") ||
    null
  );
}

// This shows an editor for a list.
export const ListEditor = ({
  className,
  listId
}) => {
  const list = useSelector((state) =>
    state.lists?.find(({ id }) => listId === id));
  const customFactions = useSelector((state) => state.customFactions);
  const factionData = useSelector((state) => {
    if (!list?.factionId) return null;
    return (state.customFactions || []).find(
      (f) => f.rulesetId === list.rulesetId && f.id === list.factionId
    ) || (state.factions || []).find((f) => f.id === list.factionId) || null;
  });
  const dispatch = useDispatch();

  const rulesetSystems = list
    ? gameSystems.find((sys) => sys.id === list.rulesetId)
    : null;
  const builtInNations = (rulesetSystems?.nations || []).filter((n) => !n.browseOnly);
  const customNations = customFactions
    .filter((f) => f.rulesetId === list?.rulesetId)
    .map((f) => ({ id: f.id, name_en: f.name_en || f.name || f.id, isCustom: true }));
  const nations = [...builtInNations, ...customNations];

  const pointsSpent = (
    (list?.cards?.reduce((sum, card) => sum + (Number(card.cost) || 0), 0) ?? 0) +
    (list?.crew?.reduce((sum, c) => sum + (Number(c.cost) || 0), 0) ?? 0)
  );

  const cardIds = list?.cards?.map((c) => c.id).join(",") ?? "";
  const crewIds = list?.crew?.map((c) => c.id).join(",") ?? "";

  const handleChange = (field, value) => {
    dispatch(updateList({ listId, [field]: value }));
  };

  const handleFactionChange = (e) => {
    const nation = nations.find((n) => n.id === e.target.value);
    dispatch(updateList({
      listId,
      factionId: nation?.id || "",
      factionName: nation?.name_en || "",
    }));
  };

  const handleRandomizeAll = async () => {
    const shipNameUpdates = [];
    const cardOverrides = [];

    (list.cards || []).forEach((card, cardIndex) => {
      if (card.weight === "negligible") return;
      const count = card.number || 1;
      const hasNamingRules = !!factionData?.naming_rules?.find((r) => r.id === card.id);
      if (!hasNamingRules) return;
      for (let nameIndex = 0; nameIndex < count; nameIndex++) {
        const name = randomName(card.id, factionData);
        if (name !== null) shipNameUpdates.push({ cardIndex, nameIndex, name });
      }
    });

    const negligible = (list.cards || [])
      .map((card, cardIndex) => ({ card, cardIndex }))
      .filter(({ card }) => card.weight === "negligible" && card.id && list.rulesetId);

    await Promise.all(negligible.map(async ({ card, cardIndex }) => {
      try {
        const r = await fetch(`${process.env.PUBLIC_URL}/games/${list.rulesetId}/${card.id}.json`);
        if (!r.ok) return;
        const data = await r.json();
        if (!data?.randomizable || !data?.random?.length) return;
        const pool = data.random.slice(1);
        if (!pool.length) return;
        const idx = 1 + Math.floor(Math.random() * pool.length);
        cardOverrides.push({ cardIndex, override: data.random[idx], overrideIndex: idx });
      } catch {}
    }));

    if (shipNameUpdates.length || cardOverrides.length) {
      dispatch(batchRandomize({ listId, shipNameUpdates, cardOverrides }));
    }
  };

  const handlePrintList = () => {
    const cardObj = buildFleetListCardObj(null, list, factionData);
    const content = DOMPurify.sanitize(cardObj.notes[0].note.value);
    const printWindow = window.open("", "_blank", "width=480,height=700");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${list.name || "Fleet List"}</title>
  <style>
    body { font-family: serif; padding: 24px; max-width: 360px; margin: 0 auto; font-size: 14px; color: #000; }
    hr { border: none; border-top: 1px solid #000; margin: 4px 0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${content}
  <script>window.print();<\/script>
</body>
</html>`);
    printWindow.document.close();
  };

  useEffect(() => {
    if (!factionData?.freebies?.length || !list || !list.factionId || factionData.id !== list.factionId) return;

    const freebieState = list.freebieState || {};
    const grants = [];
    const revocations = [];
    const clearDismissed = [];

    factionData.freebies.forEach((freebie, freebieIndex) => {
      const parsed = parseFreebie(freebie.free, freebie.points);
      if (!parsed) return;

      const { count, unitName, triggerType, points, repeating, triggerName } = parsed;
      const found = findUnit(factionData, unitName);
      if (!found) return;

      const unlockedTiers = triggerType === "unit"
        ? countTriggerUnits(triggerName, list, factionData)
        : repeating && points > 0
          ? Math.floor(pointsSpent / points)
          : (pointsSpent >= points ? 1 : 0);

      // Determine how many tiers we need to evaluate (unlocked + any previously tracked)
      const trackedTiers = Object.keys(freebieState)
        .filter((k) => k.startsWith(`${freebieIndex}:`))
        .map((k) => parseInt(k.split(":")[1], 10));
      const maxTier = Math.max(unlockedTiers, trackedTiers.length > 0 ? Math.max(...trackedTiers) + 1 : 0);

      for (let tier = 0; tier < maxTier; tier++) {
        const key = `${freebieIndex}:${tier}`;
        const state = freebieState[key];

        if (tier < unlockedTiers) {
          if (!state) {
            const crewEntries = [];
            const cardEntries = [];
            for (let i = 0; i < count; i++) {
              const entry = {
                uid: getRandomId(),
                id: found.unit.id,
                factionId: list.factionId || "",
                weight: found.unit.weight || "negligible",
                name: found.unit.name_en || found.unit.name,
                description: found.unit.description_en || "",
                cost: "-",
                freebieKey: key,
                ...(found.entryType === "cards"
                  ? { number: found.unit["squadron-size"] || 1, shipNames: [] }
                  : {}),
              };
              if (found.entryType === "crew") crewEntries.push(entry);
              else cardEntries.push(entry);
            }
            grants.push({ freebieKey: key, crewEntries, cardEntries });
          }
          // "given" or "dismissed" → do nothing
        } else {
          if (state === "given") {
            revocations.push({ freebieKey: key });
          } else if (state === "dismissed") {
            clearDismissed.push(key);
          }
        }
      }
    });

    if (grants.length || revocations.length || clearDismissed.length) {
      dispatch(syncFreebies({ listId, grants, revocations, clearDismissed }));
    }
  }, [pointsSpent, cardIds, crewIds, factionData, listId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {!list && <p>Select a list to edit.</p>}
      {list && (
        <div className="list-editor">
          <div className="list-editor__field">
            <label className="list-editor__label" htmlFor="le-faction">Faction</label>
            <select
              id="le-faction"
              className="list-editor__select"
              value={list.factionId}
              onChange={handleFactionChange}
            >
              <option value="">— select faction —</option>
              {builtInNations.map((nation) => (
                <option key={nation.id} value={nation.id}>{nation.name_en}</option>
              ))}
              {customNations.length > 0 && (
                <optgroup label="Custom Factions">
                  {customNations.map((nation) => (
                    <option key={nation.id} value={nation.id}>{nation.name_en}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="list-editor__field">
            <label className="list-editor__label" htmlFor="le-name">Name</label>
            <input
              id="le-name"
              className="list-editor__input"
              type="text"
              value={list.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="list-editor__field">
            <label className="list-editor__label" htmlFor="le-description">Description</label>
            <textarea
              id="le-description"
              className="list-editor__textarea"
              value={list.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="list-editor__field">
            <label className="list-editor__label">Points</label>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="list-editor__points">{pointsSpent}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="list-entry__randomize" onClick={handlePrintList}>
                  Print List
                </button>
                {list.cards?.length > 0 && (
                  <button className="list-entry__randomize" onClick={handleRandomizeAll}>
                    Randomize All
                  </button>
                )}
              </div>
            </div>
          </div>

          <section className="list-editor__cards">
            <h3>Cards</h3>
            <OrderableList
              id={`cards-${listId}`}
              onMoved={({ sourceIndex, destinationIndex }) =>
                dispatch(moveCard({ listId, sourceIndex, destinationIndex }))
              }
            >
              {list.cards?.map((card, i) => (
                <li key={card.uid || `${card.id}-${i}`}>
                  <ListEntry listId={listId} index={i} factionData={factionData} />
                </li>
              ))}
            </OrderableList>
          </section>

          {list.crew?.length > 0 && (() => {
            const crewGroups = list.crew.reduce((groups, entry) => {
              const key = entry.id;
              const existing = groups.find((g) => g.key === key);
              if (existing) {
                existing.count++;
                existing.totalCost = existing.totalCost === null || entry.cost === "-"
                  ? null
                  : existing.totalCost + (Number(entry.cost) || 0);
                if (entry.freebieKey && !existing.freebieKeys.includes(entry.freebieKey)) {
                  existing.freebieKeys.push(entry.freebieKey);
                }
              } else {
                groups.push({
                  key,
                  entry,
                  count: 1,
                  totalCost: entry.cost === "-" ? null : (Number(entry.cost) || 0),
                  freebieKeys: entry.freebieKey ? [entry.freebieKey] : [],
                });
              }
              return groups;
            }, []).sort((a, b) => a.count - b.count || a.entry.name.localeCompare(b.entry.name));

            return (
              <section className="list-editor__cards">
                <h3>Crew</h3>
                <ul>
                  {crewGroups.map((group) => (
                    <li key={group.key}>
                      <div className="list-entry">
                        <span className="list-entry__name">
                          {group.count > 1 ? `${group.count} ` : ""}{group.entry.name}
                        </span>
                        <span className="list-entry__cost">
                          {group.totalCost === null ? "-" : group.totalCost} pts
                        </span>
                        <button
                          className="list-entry__remove"
                          onClick={() => dispatch(removeCrewGroup({
                            listId,
                            id: group.entry.id,
                            freebieKeys: group.freebieKeys,
                          }))}
                          aria-label="Remove crew">
                          −
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })()}
        </div>
      )}
    </>
  );
};

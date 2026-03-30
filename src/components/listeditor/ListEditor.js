import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ListEntry } from "../../components/listentry";
import { updateList, moveCard, removeCrew, removeCrewGroup, moveCrew, syncFreebies } from "../../state/lists";
import { OrderableList } from "../../components/orderablelist";
import gameSystems from "../../assets/factions.json";
import { getRandomId } from "../../utils/id";

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
    return {
      count: parseInt(perMatch[1], 10),
      unitName: perMatch[2].trim().toLowerCase(),
      triggerType: "unit",
      triggerName: triggerText.toLowerCase(),
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

// Count how many cards in the list match a unit by name_en, name, type_name, or type.
function countTriggerUnits(triggerName, list, factionData) {
  const trigger = triggerName.toLowerCase();
  const matchingIds = new Set(
    (factionData.units || [])
      .filter((u) =>
        u.name_en?.toLowerCase() === trigger ||
        u.name?.toLowerCase() === trigger ||
        u.type_name?.toLowerCase() === trigger ||
        u.type?.toLowerCase() === trigger
      )
      .map((u) => u.id)
  );
  return (list.cards || []).filter((c) => matchingIds.has(c.id)).length;
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
    search(factionData.crew, "crew") ||
    search(factionData.units, "cards") ||
    search(factionData.addons, "cards") ||
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
  const dispatch = useDispatch();

  const rulesetSystems = list
    ? gameSystems.find((sys) => sys.id === list.rulesetId)
    : null;
  const nations = rulesetSystems?.nations || [];

  const pointsSpent = (
    (list?.cards?.reduce((sum, card) => sum + (Number(card.cost) || 0), 0) ?? 0) +
    (list?.crew?.reduce((sum, c) => sum + (Number(c.cost) || 0), 0) ?? 0)
  );

  const cardIds = list?.cards?.map((c) => c.id).join(",") ?? "";

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

  const [factionData, setFactionData] = useState(null);

  useEffect(() => {
    if (!list?.rulesetId || !list?.factionId) {
      setFactionData(null);
      return;
    }
    fetch(`${process.env.PUBLIC_URL}/games/${list.rulesetId}/${list.factionId}/${list.factionId}.json`)
      .then((r) => r.json())
      .then(setFactionData)
      .catch(() => setFactionData(null));
  }, [list?.rulesetId, list?.factionId]);

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
  }, [pointsSpent, cardIds, factionData, listId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {!list && <p>Select a list to edit.</p>}
      {list && (
        <div className="list-editor">
          <h2 className="list-editor__ruleset-name">{list.rulesetName}</h2>

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
            <label className="list-editor__label" htmlFor="le-faction">Faction</label>
            <select
              id="le-faction"
              className="list-editor__select"
              value={list.factionId}
              onChange={handleFactionChange}
            >
              <option value="">— select faction —</option>
              {nations.map((nation) => (
                <option key={nation.id} value={nation.id}>
                  {nation.name_en}
                </option>
              ))}
            </select>
          </div>

          <div className="list-editor__field">
            <label className="list-editor__label">Points</label>
            <span className="list-editor__points">{pointsSpent}</span>
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
                  <ListEntry listId={listId} index={i} />
                </li>
              ))}
            </OrderableList>
          </section>

          {list.crew?.length > 0 && (() => {
            const crewGroups = list.crew.reduce((groups, entry) => {
              const key = entry.freebieKey || entry.id;
              const existing = groups.find((g) => g.key === key);
              if (existing) {
                existing.count++;
                existing.totalCost = existing.totalCost === null || entry.cost === "-"
                  ? null
                  : existing.totalCost + (Number(entry.cost) || 0);
              } else {
                groups.push({
                  key,
                  entry,
                  count: 1,
                  totalCost: entry.cost === "-" ? null : (Number(entry.cost) || 0),
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
                            freebieKey: group.entry.freebieKey,
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

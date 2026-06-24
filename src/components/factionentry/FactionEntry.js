import { useSelector, useDispatch } from "react-redux";
import { Button } from "../../components/button";
import { Expandable } from "../../components/expandable";
import { addCard, addCrew } from "../../state/lists";
import { ENTRY_TYPE, getEntries } from "../../utils/faction";

import "./FactionEntry.css";

// This is the Entry for a Faction. It assumes another component is loading the
// factions slice into the redux.
export const FactionEntry = ({
  className,
  listId,
  factionId,
  primaryFaction
}) => {
  const dispatch = useDispatch();
  const factions = useSelector((state) => state.factions);
  const faction = useSelector((state) =>
    state.factions?.find(({ id }) => factionId === id) ||
    state.customFactions?.find(({ id }) => factionId === id)
  );

  const handleAddUnit = (unit) => (event) => {
    event.preventDefault();
    if (!listId) return;
    dispatch(addCard({ listId, unit, factionId }));
  };

  const handleAddCrew = (unit) => (event) => {
    event.preventDefault();
    if (!listId) return;
    dispatch(addCrew({ listId, unit }));
  };

  const renderMeta = (entry) => {
    const type = entry.type_name_en || entry.type_name || "";
    const source = entry.source_en || entry.source || "";
    if (!type && !source) return null;
    return (
      <div className="faction-entry__meta">
        {type}
        {type && source ? " · " : ""}
        {source && `Source: ${source}`}
      </div>
    );
  };

  const renderUnit = (unit, onAdd) => (
    <div key={unit.id}>
      {unit.cost === "-"
        ? <span>{unit.name_en}</span>
        : <Button type="text" size="small" label={unit.id} color="dark" onClick={onAdd(unit)}>{unit.name_en}</Button>
      }
      <span style={{float:"right"}}>{unit.cost} pts</span>
      <br/>
      {renderMeta(unit)}
    </div>
  );

  const buildFaction = (faction) => (
    <>
      {getEntries(faction).map((entry, index) => {
        if (!entry.units?.length) return null;
        const onAdd = entry.type === ENTRY_TYPE.CREW ? handleAddCrew : handleAddUnit;
        return (
          <Expandable
            key={`${entry.title_en}-${index}`}
            headline={<span className="faction-entry__category-title">{entry.title_en}</span>}
            open={entry.expanded}
          >
            {entry.units.map((unit) => renderUnit(unit, onAdd))}
          </Expandable>
        );
      })}
    </>
  );

  return (
    <>
      {!factions && !faction && (<p>loading...</p>)}
      {faction && primaryFaction && (
        <>
          <h2>{faction?.name_en}</h2>
          {buildFaction(faction)}
        </>
      )}
      {faction && !primaryFaction && (
        <Expandable headline={faction.name_en} noMargin className="datasets__unit-type datasets__unit">
          {buildFaction(faction)}
        </Expandable>
      )}
      {faction && <hr className="faction-entry__divider" />}
    </>
  );
};

import { useSelector, useDispatch } from "react-redux";
import { Button } from "../../components/button";
import { Expandable } from "../../components/expandable";
import { addCard } from "../../state/lists";

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
    state.factions?.find(({ id }) => factionId === id));

  const handleAddUnit = (unit) => (event) => {
    event.preventDefault();
    if (!listId) return;
    dispatch(addCard({ listId, unit }));
  };

  const buildFaction = (faction) => (
    <>
      <h4>Units</h4>
      {faction?.units?.map((unit) => (
        <div key={unit.id}>
          <Button
            type="text"
            size="small"
            label={unit.id}
            color="dark"
            onClick={handleAddUnit(unit)}>
            {unit.name_en}
          </Button>
          <span style={{float:"right"}}>{unit.cost} pts</span>
          <br/>
        </div>
      ))}
      <h5>Add Ons</h5>
      {faction?.addons?.map((addon) => (
        <div key={addon.id}>
          <Button
            type="text"
            size="small"
            label={addon.id}
            color="dark"
            onClick={handleAddUnit(addon)}>
            {addon.name_en}
          </Button>
          <span style={{float:"right"}}>{addon.cost} pts</span>
          <br/>
        </div>
      ))}
    </>
  );

  return (
    <>
      {!factions && (<p>loading...</p>)}
      {factions && primaryFaction && (
        <>
          <h2>{faction?.name_en}</h2>
          {buildFaction(faction)}
        </>
      )}
      {factions && !primaryFaction && (
        <Expandable headline={faction.name_en} noMargin className="datasets__unit-type datasets__unit">
          {buildFaction(faction)}
        </Expandable>
      )}
    </>
  );
};

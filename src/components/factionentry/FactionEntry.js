import { useSelector } from "react-redux";
import { Button } from "../../components/button";
import { Expandable } from "../../components/expandable";

import "./FactionEntry.css";

// This is the Entry for a Faction. It assumes another component is loading the
// factions slice into the redux.
export const FactionEntry = ({
  className,
  listId,
  factionId,
  primaryFaction
}) => {
  const factions = useSelector((state) => state.factions);
  const faction = useSelector((state) =>
    state.factions?.find(({ id }) => factionId === id));

  const handleUnsetFaction = (event) => {
    event.preventDefault();
    console.log("Unset Faction clicked!");
  };
  const handleAddUnit = (unitId) => (event) => {
    event.preventDefault();
    console.log("Add Unit clicked for unit:", unitId);
  };
  const handleSetFaction = (factionId) => (event) => {
    event.preventDefault();
    console.log("Set Faction clicked for faction:", factionId);
  };

  const buildFaction = (faction) => { return (
    <>
        <h4>Units</h4>
        {faction?.units?.map((uni) => (
          <>
          <Button
            type="text"
            size="small"
            label={uni.id}
            color="dark"
            onClick={handleAddUnit(uni.id)}>
            {uni.name_en}
          </Button>
          <span style={{float:"right"}}>
            {uni.cost} pts
          </span>
          <br/>
          </>
        ))}
        <h5>Add Ons</h5>
        {faction?.addons?.map((ao) => (
          <>
          <Button
            type="text"
            size="small"
            label={ao.id}
            color="dark"
            onClick={handleAddUnit(ao.id)}>
            {ao.name_en}
          </Button>
          <span style={{float:"right"}}>
            {ao.cost} pts
          </span>
          <br/>
        </>
       ))}
    </>
  )}

  return (
    <>
      {!factions && (<p>loading...</p>)}
      {factions && primaryFaction && (
        <>
        <h2>{faction?.name_en}</h2>
        <Button
          type="text"
          size="small"
          onClick={handleUnsetFaction}
          color="dark"><i>unset</i></Button>
        {buildFaction(faction)}
        <Expandable headline="Data" noMargin>
          {<pre>{JSON.stringify(faction, null, 2)}</pre>}
        </Expandable>
        </>
      )}
      {factions && !primaryFaction && (
        <>
          <Expandable headline={faction.name_en}
                      noMargin
                      className="datasets__unit-type datasets__unit">
          <Button
            type="text"
            size="small"
            onClick={handleSetFaction(faction.id)}
            color="dark"><i>set</i></Button>
            {buildFaction(faction)}
            <Expandable headline="Data" noMargin>
              {<pre>{JSON.stringify(faction, null, 2)}</pre>}
            </Expandable>
          </Expandable>
        </>
      )}
    </>
  );
};

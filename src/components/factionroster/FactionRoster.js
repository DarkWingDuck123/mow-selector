import { useSelector } from "react-redux";
import { FactionEntry } from "../factionentry";
import gameSystems from "../../assets/factions.json";

import "./FactionRoster.css";

// This is the Roster for a Faction. It assumes another component is loading the
// factions slice into the redux. It also is passed in the primary faction (from
// which allies are then determined) and list id. If no primary faction is given,
// it will create a global faction list where everything is flat, otherwise:
// Primary Faction is always expanded (not within an expandable).
//   - Units
//   - Expandable Addons
// Expandable Allies
// For each ally
//   - Units
//   - Expandable Addons
// Expandable Other
// For everyone not an ally an expandable for that Faction
//   - Units
//   - Expandable Addons
//
// For now, expandable add will repeat if they belong to both Factions 
// (i.e. Man O'War Cards, Turn Summary Card, etc.)
//
// Selecting an addon or a unit will cause that item to move to the end of
// the current List. That list will be editable in other React Components.
export const FactionRoster = ({
  className,
  listId
}) => {
  const factions = useSelector((state) => state.factions);
  const customFactions = useSelector((state) => state.customFactions);
  const list = useSelector((state) =>
    state.lists?.find(({ id }) => listId === id));

  const rulesetNationIds = gameSystems
    .find((sys) => sys.id === list?.rulesetId)
    ?.nations.map((n) => n.id) || [];
  const builtInFactions = factions?.filter(({ id }) => rulesetNationIds.includes(id)) || [];
  const customRulesetFactions = customFactions.filter((f) => f.rulesetId === list?.rulesetId);
  const rulesetFactions = [...builtInFactions, ...customRulesetFactions];

  const primaryFaction = rulesetFactions.find(({ id }) => list?.factionId === id);
  const allyFactions = rulesetFactions.filter(({ id }) => primaryFaction?.allies?.includes(id));
  const otherFactions = rulesetFactions.filter(({ id }) => !primaryFaction?.allies?.includes(id) && primaryFaction?.id !== id);
   
  return (
    <>
      {!factions && customRulesetFactions.length === 0 && (<p>loading...</p>)}
      {primaryFaction && (
        <>
          <FactionEntry factionId={primaryFaction?.id} listId={listId} primaryFaction />
          <h3> Allies </h3>
          {allyFactions?.map((fac) => (
            <FactionEntry key={fac.id} factionId={fac.id} listId={listId} />
          ))}
          <h3> Other </h3>
          {otherFactions?.map((fac) => (
            <FactionEntry key={fac.id} factionId={fac.id} listId={listId} />
          ))}
      </>
      )}
      {!primaryFaction && rulesetFactions.length > 0 && (
        <>
          <h2> All Factions </h2>
          {rulesetFactions.map((fac) => (
            <FactionEntry key={fac.id} factionId={fac.id} listId={listId} />
          ))}
        </>
      )}
      {/*
      <h3> Ids </h3>
      <ul>
        <li>{listId}</li>
      </ul>
      <Expandable headline="Primary Data" noMargin>
        {<pre>{JSON.stringify(primaryFaction, null, 2)}</pre>}
      </Expandable>
      <Expandable headline="Ally Data" noMargin>
        {<pre>{JSON.stringify(allyFactions, null, 2)}</pre>}
      </Expandable>
      <Expandable headline="Other Data" noMargin>
        {<pre>{JSON.stringify(otherFactions, null, 2)}</pre>}
      </Expandable>
      <Expandable headline="Lists Data" noMargin>
        {<pre>{JSON.stringify(lists, null, 2)}</pre>}
      </Expandable>
      <Expandable headline="List Data" noMargin>
        {<pre>{JSON.stringify(list, null, 2)}</pre>}
      </Expandable>
      */}
    </>
  );
};

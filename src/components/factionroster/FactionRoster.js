import { useSelector } from "react-redux";
import { FactionEntry } from "../factionentry";

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
  const list = useSelector((state) =>
    state.lists?.find(({ id }) => listId === id));
  const primaryFaction = useSelector((state) =>
    state.factions?.find(({ id }) => list?.factionId === id));
  const allyFactions = useSelector((state) =>
    state.factions?.filter(({ id }) => primaryFaction?.allies?.includes(id)));
  const otherFactions = useSelector((state) =>
    state.factions?.filter(({ id }) => !primaryFaction?.allies?.includes(id) && primaryFaction?.id !== id));
   
  return (
    <>
      {!factions && (<p>loading...</p>)}
      {factions && primaryFaction && (
        <>
          <FactionEntry factionId={primaryFaction?.id} primaryFaction></FactionEntry>
          <h3> Allies </h3>
          {
            allyFactions?.map((fac) => (
              <FactionEntry factionId={fac.id}></FactionEntry>
            ))
          }
          <h3> Other </h3>
          {
            otherFactions?.map((fac) => (
              <FactionEntry factionId={fac.id}></FactionEntry>
          ))}
      </>
      )}
      {factions && !primaryFaction && (
        <>
          <h2> All Factions </h2>
          {
            otherFactions?.map((fac) => (
              <FactionEntry factionId={fac.id}></FactionEntry>
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

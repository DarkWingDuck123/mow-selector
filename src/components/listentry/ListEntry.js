import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLists } from "../../state/lists";
import { Button } from "../../components/button";
import { Expandable } from "../../components/expandable";

import "./ListEntry.css";

// This is the Entry for a Card.
// It assumes another component is loading the lists slice into the redux.
export const ListEntry = ({
  className,
  listId,
  index
}) => {
  const dispatch = useDispatch();
  const list = useSelector((state) =>
    state.lists?.find(({ id }) => listId === id));

  const handleUnsetFaction = (event) => {
    event.preventDefault();
    console.log("Unset Faction clicked!");
  };

  const buildCard = (card) => { return (
    <>
      <p>{card.name}<span style={{float:"right"}}>{card.cost} pts</span></p>
    </>
  )}

  return (
    <>
      {!list && (<p>loading...</p>)}
      {list && (
        <>
        {buildCard(list.cards[index])}
        <Button
          type="text"
          size="small"
          onClick={handleUnsetFaction}
          color="dark"><i>unset</i></Button>
        <Expandable headline="Data" noMargin>
          {<pre>{JSON.stringify(list.cards[index], null, 2)}</pre>}
        </Expandable>
        </>
      )}
    </>
  );
};

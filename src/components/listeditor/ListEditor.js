import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLists } from "../../state/lists";
import { Button } from "../../components/button";
import { Expandable } from "../../components/expandable";
import { deleteList, moveUnit } from "../../state/lists";
import { Tooltip } from 'react-tooltip';
import { ListEntry } from "../../components/listentry";

import "./ListEditor.css";


// This shows an editor for a list.
export const ListEditor = ({
  className,
  listId
}) => {
  const dispatch = useDispatch();
  const list = useSelector((state) =>
    state.lists?.find(({ id }) => listId === id));
   
  return (
    <>
      {!list && (<p>loading...</p>)}
      {list && (
        <>
          <section>
            <Button>Print</Button>
          </section>
          <section>
            <h2>List</h2>
            {list.cards?.map(function(card, i) {
              return <ListEntry listId={listId} index={i} />;
            })}  
            {<pre>{JSON.stringify(list, null, 2)}</pre>}
          </section>
        </>
      )}
    </>
  );
};

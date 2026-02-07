import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLists } from "../../state/lists";
import { Button } from "../../components/button";
import { Expandable } from "../../components/expandable";
import { deleteList, moveUnit } from "../../state/lists";
import { Tooltip } from 'react-tooltip';

import "./ShowLists.css";

// This shows a list of "game lists". Clicking on a list will open the Builder for
// that list.
export const ShowLists = ({
  className
}) => {
  const dispatch = useDispatch();
  const lists = useSelector((state) => state.lists);
   
  const handleDeleteList = (listId) => (event) => {
    event.preventDefault();
    console.log("Remove list clicked for list:", listId);
    deleteList(listId);
  };

  return (
    <>
      {!lists && (<p>loading...</p>)}
      {lists && (
        <>
          <Button>New List</Button>
          <h2>Your Lists:</h2>
            {lists?.map((list, index) => (
              <>
                <div>
                  <b data-tooltip-id="fac-tooltip" data-tooltip-content={list.rulesetName}>{list.factionName}</b>
                  <span style={{float:"right"}}>{list.pointsSpent} points</span><br/>
                <small><i data-tooltip-id="desc-tooltip" data-tooltip-content={list.description}>{list.name}</i></small><br/>
                <Tooltip id="fac-tooltip" />
                <Tooltip id="desc-tooltip" />
                </div>
                <Button
                  type="text"
                  size="small"
                  color="dark">
                  Edit
                </Button>
                <span style={{float:"right"}}>
                  <Button
                    type="text"
                    size="small"
                    color="dark">
                    Delete
                  </Button>
                </span>
              </>
            ))}
          <Expandable headline="Data" noMargin>
            {<pre>{JSON.stringify(lists, null, 2)}</pre>}
          </Expandable>
        </>
      )}
    </>
  );
};

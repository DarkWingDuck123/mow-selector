import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "../../components/button";
import { Expandable } from "../../components/expandable";
import { Tooltip } from 'react-tooltip';
import { newList, moveList, deleteList, duplicateList } from "../../state/lists";
import { getRandomId } from "../../utils/id";
import { OrderableList } from "../../components/orderablelist";
import gameSystems from "../../assets/factions.json";

import "./ShowLists.css";

const ListItem = React.forwardRef(({ listId, selectedListId, onSelectList, ...rest }, ref) => {
  const list = useSelector((state) => state.lists?.find((l) => l.id === listId));
  const points = (
    (list?.cards?.reduce((sum, card) => sum + (Number(card.cost) || 0), 0) ?? 0) +
    (list?.crew?.reduce((sum, c) => sum + (Number(c.cost) || 0), 0) ?? 0)
  );
  return (
    <li
      ref={ref}
      {...rest}
      className={`show-lists__item${selectedListId === listId ? " show-lists__item--selected" : ""}${rest.className ? ` ${rest.className}` : ""}`}
      onClick={() => onSelectList(listId === selectedListId ? null : listId)}
    >
      <b data-tooltip-id="fac-tooltip" data-tooltip-content={list?.rulesetName}>{list?.factionName}</b>
      <span style={{float:"right"}}>{points} points</span><br/>
      <small><i data-tooltip-id="desc-tooltip" data-tooltip-content={list?.description}>{list?.name}</i></small><br/>
      <Tooltip id="fac-tooltip" />
      <Tooltip id="desc-tooltip" />
    </li>
  );
});

// This shows a list of "game lists". Clicking on a list will open the Builder for
// that list.
export const ShowLists = ({
  className,
  selectedListId,
  onSelectList = () => {},
}) => {
  const allLists = useSelector((state) => state.lists);
  const selectedRulesetId = useSelector((state) => state.selectedRuleset);
  const selectedRuleset = gameSystems.find((sys) => sys.id === selectedRulesetId);
  const lists = allLists?.filter((list) => list.rulesetId === selectedRulesetId);
  const dispatch = useDispatch();

  const handleRemove = () => {
    dispatch(deleteList(selectedListId));
    onSelectList(null);
  };

  const handleDuplicate = () => {
    const id = getRandomId();
    dispatch(duplicateList({ sourceId: selectedListId, id }));
    onSelectList(id);
  };

  const handleMoved = ({ sourceIndex, destinationIndex }) => {
    dispatch(moveList({
      sourceId: lists[sourceIndex].id,
      destinationId: lists[destinationIndex].id,
    }));
  };

  return (
    <>
      {!lists && (<p>loading...</p>)}
      {lists && (
        <>
          <div className="show-lists__toolbar">
            <Button onClick={() => {
              const id = getRandomId();
              dispatch(newList({ rulesetId: selectedRulesetId, rulesetName: selectedRuleset?.name_en || "", id }));
              onSelectList(id);
            }}>New</Button>
            <Button
              disabled={!selectedListId}
              onClick={handleRemove}
            >
              Delete
            </Button>
            <Button
              disabled={!selectedListId}
              onClick={handleDuplicate}
            >
              Duplicate
            </Button>
          </div>
          <h2>Your Lists:</h2>
          <OrderableList id="fleet-lists" onMoved={handleMoved}>
            {lists.map((list) => (
              <ListItem
                key={list.id}
                listId={list.id}
                selectedListId={selectedListId}
                onSelectList={onSelectList}
              />
            ))}
          </OrderableList>
        </>
      )}
    </>
  );
};

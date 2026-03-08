import { useSelector, useDispatch } from "react-redux";
import { Button } from "../../components/button";
import { Expandable } from "../../components/expandable";
import { Tooltip } from 'react-tooltip';
import { newList, moveList, deleteList, duplicateList } from "../../state/lists";
import { OrderableList } from "../../components/orderablelist";
import gameSystems from "../../assets/factions.json";

import "./ShowLists.css";

// This shows a list of "game lists". Clicking on a list will open the Builder for
// that list.
export const ShowLists = ({
  className,
  selectedListId,
  onSelectList,
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
    dispatch(duplicateList(selectedListId));
  };

  const handlePrint = () => {
    window.print();
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
            <Button onClick={() => dispatch(newList({ rulesetId: selectedRulesetId, rulesetName: selectedRuleset?.name_en || "" }))}>New</Button>
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
            <Button onClick={handlePrint}>Print</Button>
          </div>
          <h2>Your Lists:</h2>
          <OrderableList id="fleet-lists" onMoved={handleMoved}>
            {lists.map((list) => (
              <li
                key={list.id}
                className={`show-lists__item${selectedListId === list.id ? " show-lists__item--selected" : ""}`}
                onClick={() => onSelectList(list.id === selectedListId ? null : list.id)}
              >
                <b data-tooltip-id="fac-tooltip" data-tooltip-content={list.rulesetName}>{list.factionName}</b>
                <span style={{float:"right"}}>{list.cards?.reduce((sum, card) => sum + Number(card.cost || 0), 0) ?? 0} points</span><br/>
                <small><i data-tooltip-id="desc-tooltip" data-tooltip-content={list.description}>{list.name}</i></small><br/>
                <Tooltip id="fac-tooltip" />
                <Tooltip id="desc-tooltip" />
              </li>
            ))}
          </OrderableList>
          <Expandable headline="Data" noMargin>
            {<pre>{JSON.stringify(lists, null, 2)}</pre>}
          </Expandable>
        </>
      )}
    </>
  );
};

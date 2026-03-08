import { useSelector, useDispatch } from "react-redux";
import { removeCard } from "../../state/lists";

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

  return (
    <>
      {!list && (<p>loading...</p>)}
      {list && (
        <div className="list-entry">
          <span className="list-entry__name">{list.cards[index].name}</span>
          <span className="list-entry__cost">{list.cards[index].cost} pts</span>
          <button
            className="list-entry__remove"
            onClick={() => dispatch(removeCard({ listId, index }))}
            aria-label="Remove card">
            −
          </button>
        </div>
      )}
    </>
  );
};

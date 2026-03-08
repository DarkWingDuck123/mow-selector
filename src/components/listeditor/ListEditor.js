import { useSelector, useDispatch } from "react-redux";
import { ListEntry } from "../../components/listentry";
import { updateList, moveCard } from "../../state/lists";
import { OrderableList } from "../../components/orderablelist";
import gameSystems from "../../assets/factions.json";

import "./ListEditor.css";

// This shows an editor for a list.
export const ListEditor = ({
  className,
  listId
}) => {
  const list = useSelector((state) =>
    state.lists?.find(({ id }) => listId === id));
  const dispatch = useDispatch();

  const rulesetSystems = list
    ? gameSystems.find((sys) => sys.id === list.rulesetId)
    : null;
  const nations = rulesetSystems?.nations || [];

  const pointsSpent = list?.cards?.reduce(
    (sum, card) => sum + Number(card.cost || 0), 0
  ) ?? 0;

  const handleChange = (field, value) => {
    dispatch(updateList({ listId, [field]: value }));
  };

  const handleFactionChange = (e) => {
    const nation = nations.find((n) => n.id === e.target.value);
    dispatch(updateList({
      listId,
      factionId: nation?.id || "",
      factionName: nation?.name_en || "",
    }));
  };

  return (
    <>
      {!list && <p>Select a list to edit.</p>}
      {list && (
        <div className="list-editor">
          <h2 className="list-editor__ruleset-name">{list.rulesetName}</h2>

          <div className="list-editor__field">
            <label className="list-editor__label" htmlFor="le-name">Name</label>
            <input
              id="le-name"
              className="list-editor__input"
              type="text"
              value={list.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="list-editor__field">
            <label className="list-editor__label" htmlFor="le-description">Description</label>
            <textarea
              id="le-description"
              className="list-editor__textarea"
              value={list.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="list-editor__field">
            <label className="list-editor__label" htmlFor="le-faction">Faction</label>
            <select
              id="le-faction"
              className="list-editor__select"
              value={list.factionId}
              onChange={handleFactionChange}
            >
              <option value="">— select faction —</option>
              {nations.map((nation) => (
                <option key={nation.id} value={nation.id}>
                  {nation.name_en}
                </option>
              ))}
            </select>
          </div>

          <div className="list-editor__field">
            <label className="list-editor__label">Points</label>
            <span className="list-editor__points">{pointsSpent}</span>
          </div>

          <section className="list-editor__cards">
            <h3>Cards</h3>
            <OrderableList
              id={`cards-${listId}`}
              onMoved={({ sourceIndex, destinationIndex }) =>
                dispatch(moveCard({ listId, sourceIndex, destinationIndex }))
              }
            >
              {list.cards?.map((card, i) => (
                <li key={card.uid || `${card.id}-${i}`}>
                  <ListEntry listId={listId} index={i} />
                </li>
              ))}
            </OrderableList>
          </section>
        </div>
      )}
    </>
  );
};

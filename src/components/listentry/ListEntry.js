import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Expandable } from "../../components/expandable";
import { removeCard, updateShipName, setCardRandomOverride } from "../../state/lists";

import "./ListEntry.css";

function randomName(cardId, factionData) {
  const rule = factionData?.naming_rules?.find((r) => r.id === cardId);
  if (!rule?.rule?.length) return null;

  const template = rule.rule[Math.floor(Math.random() * rule.rule.length)];
  const namesMap = (factionData.names || []).reduce((map, n) => {
    map[n.id] = n.value;
    return map;
  }, {});

  return template.split(" ").map((token) => {
    const values = namesMap[token];
    if (!values?.length) return token;
    return values[Math.floor(Math.random() * values.length)];
  }).join(" ");
}

// This is the Entry for a Card.
// It assumes another component is loading the lists slice into the redux.
export const ListEntry = ({
  className,
  listId,
  index,
  factionData,
}) => {
  const dispatch = useDispatch();
  const card = useSelector((state) =>
    state.lists?.find(({ id }) => listId === id)?.cards[index]);
  const rulesetId = useSelector((state) =>
    state.lists?.find(({ id }) => listId === id)?.rulesetId);
  const customCards = useSelector((state) => state.customCards);

  const [cardJsonData, setCardJsonData] = useState(null);

  useEffect(() => {
    if (!card || card.weight !== "negligible" || !rulesetId || !card.factionId || !card.id) {
      setCardJsonData(null);
      return;
    }
    const customCard = customCards.find(
      (c) => c.factionId === card.factionId && c.id === card.id && c.rulesetId === rulesetId
    );
    if (customCard) {
      setCardJsonData(customCard);
      return;
    }
    fetch(`${process.env.PUBLIC_URL}/games/${rulesetId}/${card.id}.json`)
      .then((r) => r.ok ? r.json() : null)
      .then(setCardJsonData)
      .catch(() => setCardJsonData(null));
  }, [card?.id, card?.factionId, card?.weight, rulesetId, customCards]);

  if (!card) return null;

  const count = card.number || 1;
  const hasNamingRules = !!factionData?.naming_rules?.find((r) => r.id === card.id);
  const isRandomizable = !!(cardJsonData?.randomizable && cardJsonData?.random?.length > 0);

  const handleSelectOption = (idx) => {
    dispatch(setCardRandomOverride({
      listId,
      cardIndex: index,
      override: cardJsonData.random[idx],
      overrideIndex: idx,
    }));
  };

  const handleRandomize = () => {
    const pool = cardJsonData.random.slice(1);
    if (!pool.length) return;
    const idx = 1 + Math.floor(Math.random() * pool.length);
    dispatch(setCardRandomOverride({
      listId,
      cardIndex: index,
      override: cardJsonData.random[idx],
      overrideIndex: idx,
    }));
  };

  const headline = (
    <div className="list-entry">
      <span className="list-entry__name">{card.name}</span>
      <span className="list-entry__cost">{card.cost} pts</span>
      <button
        className="list-entry__remove"
        onClick={(e) => {
          e.stopPropagation();
          dispatch(removeCard({ listId, index }));
        }}
        aria-label="Remove card">
        −
      </button>
    </div>
  );

  return (
    <Expandable headline={headline} notBold noMargin className="list-entry__expandable">
      {card.weight !== "negligible" && <div className="list-entry__names">
        {Array.from({ length: count }, (_, nameIndex) => (
          <div key={nameIndex} className="list-entry__name-field">
            <label>Name{count > 1 ? ` ${nameIndex + 1}` : ""}</label>
            <input
              type="text"
              value={(card.shipNames || [])[nameIndex] || ""}
              onChange={(e) =>
                dispatch(updateShipName({ listId, cardIndex: index, nameIndex, name: e.target.value }))
              }
            />
            {hasNamingRules && (
              <button
                className="list-entry__randomize"
                onClick={() => {
                  const name = randomName(card.id, factionData);
                  if (name !== null) {
                    dispatch(updateShipName({ listId, cardIndex: index, nameIndex, name }));
                  }
                }}
              >
                Randomize
              </button>
            )}
          </div>
        ))}
      </div>}
      {isRandomizable && (
        <div className="list-entry__names">
          <div className="list-entry__name-field">
            <select
              className="list-entry__random-select"
              value={card.randomOverrideIndex ?? ""}
              onChange={(e) => e.target.value !== "" && handleSelectOption(Number(e.target.value))}
            >
              <option value="">— choose —</option>
              {cardJsonData.random.map((entry, i) => (
                <option key={i} value={i}>
                  {entry.name?.value || (i === 0 ? "(empty)" : `Option ${i + 1}`)}
                </option>
              ))}
            </select>
            <button className="list-entry__randomize" onClick={handleRandomize}>
              Randomize
            </button>
          </div>
        </div>
      )}
    </Expandable>
  );
};

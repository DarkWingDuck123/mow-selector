import { useSelector } from "react-redux";

import "./FleetValidator.css";

const validate = (list, faction) => {
  if (!list || !faction) return [];

  const errors = [];
  const cardCounts = list.cards.reduce((acc, card) => {
    acc[card.id] = (acc[card.id] || 0) + 1;
    return acc;
  }, {});

  const allEntries = [...(faction.units || []), ...(faction.addons || [])];

  for (const entry of allEntries) {
    const count = cardCounts[entry.id] || 0;
    const min = entry.min !== undefined ? Number(entry.min) : undefined;
    const max = entry.max !== undefined ? Number(entry.max) : undefined;

    if (min !== undefined && count < min) {
      errors.push(`${entry.name_en}: requires at least ${min} (have ${count})`);
    }
    if (max !== undefined && count > max) {
      errors.push(`${entry.name_en}: allows at most ${max} (have ${count})`);
    }
  }

  return errors;
};

export const FleetValidator = ({ listId }) => {
  const list = useSelector((state) =>
    state.lists?.find(({ id }) => listId === id));
  const faction = useSelector((state) =>
    state.factions?.find(({ id }) => list?.factionId === id));

  if (!list) return null;

  const errors = validate(list, faction);

  return (
    <div className="fleet-validator">
      {errors.length === 0 ? (
        <p className="fleet-validator__valid">✓ No validation errors</p>
      ) : (
        <ul className="fleet-validator__errors">
          {errors.map((error, i) => (
            <li key={i} className="fleet-validator__error">{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

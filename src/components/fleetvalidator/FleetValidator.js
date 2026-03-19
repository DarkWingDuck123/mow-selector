import { useSelector } from "react-redux";

import "./FleetValidator.css";

const parseRule = (ruleStr) => {
  const [mainPart, modifierPart] = ruleStr.split(";").map((s) => s.trim());
  const modifier = modifierPart ? modifierPart.trim() : null;

  const isMax = mainPart.startsWith("Max ");
  const isMin = mainPart.startsWith("Min ");
  if (!isMax && !isMin) return null;

  const rest = mainPart.slice(4); // Remove "Max " or "Min "
  const perIndex = rest.indexOf(" per ");

  if (perIndex === -1) {
    const match = rest.match(/^(\d+)\s+(.+)$/);
    if (!match) return null;
    return {
      type: isMax ? "max" : "min",
      limit: parseInt(match[1]),
      subject: match[2].trim(),
      targets: null,
      modifier,
    };
  }

  const subjectPart = rest.slice(0, perIndex);
  const targetPart = rest.slice(perIndex + 5); // After " per "

  const subjectMatch = subjectPart.match(/^(\d+)\s+(.+)$/);
  if (!subjectMatch) return null;

  const targetTokens = targetPart.split(/,?\s+or\s+/i);
  const targets = targetTokens
    .map((token) => {
      const m = token.trim().match(/^(\d+)\s+(.+)$/);
      if (!m) return null;
      return { count: parseInt(m[1]), name: m[2].trim() };
    })
    .filter(Boolean);

  return {
    type: isMax ? "max" : "min",
    limit: parseInt(subjectMatch[1]),
    subject: subjectMatch[2].trim(),
    targets,
    modifier,
  };
};

const validateRules = (list, faction) => {
  const validationRules = faction.validation_rules;
  if (!validationRules || validationRules.length === 0) return [];

  const allEntries = [
    ...(faction.units || []),
    ...(faction.addons || []),
  ];
  const crewEntries = faction.crew || [];

  const cardCounts = (list.cards || []).reduce((acc, card) => {
    acc[card.id] = (acc[card.id] || 0) + 1;
    return acc;
  }, {});

  const crewCounts = (list.crew || []).reduce((acc, entry) => {
    acc[entry.id] = (acc[entry.id] || 0) + 1;
    return acc;
  }, {});

  const countForName = (name) => {
    // Count matching cards (units + addons), by name then type_name
    const byCardName = allEntries.filter((u) => u.name_en === name || u.name === name);
    const cardCount = byCardName.length > 0
      ? byCardName.reduce((sum, u) => sum + (cardCounts[u.id] || 0), 0)
      : (faction.units || []).filter((u) => u.type_name_en === name || u.type_name === name)
          .reduce((sum, u) => sum + (cardCounts[u.id] || 0), 0);

    // Count matching crew, by name then type_name
    const byCrewName = crewEntries.filter((u) => u.name_en === name || u.name === name);
    const crewCount = byCrewName.length > 0
      ? byCrewName.reduce((sum, u) => sum + (crewCounts[u.id] || 0), 0)
      : crewEntries.filter((u) => u.type_name_en === name || u.type_name === name)
          .reduce((sum, u) => sum + (crewCounts[u.id] || 0), 0);

    return cardCount + crewCount;
  };

  const errors = [];

  for (const { rule: ruleStr } of validationRules) {
    const parsed = parseRule(ruleStr);
    if (!parsed) continue;

    const subjectCount = countForName(parsed.subject);

    if (!parsed.targets) {
      if (parsed.type === "max" && subjectCount > parsed.limit) {
        errors.push(ruleStr);
      } else if (parsed.type === "min" && subjectCount < parsed.limit) {
        errors.push(ruleStr);
      }
    } else {
      const targetTotal = parsed.targets.reduce((sum, target) => {
        return sum + Math.floor(countForName(target.name) / target.count);
      }, 0);

      let allowed = targetTotal * parsed.limit;

      if (
        parsed.modifier &&
        parsed.modifier.toLowerCase().includes("first one free")
      ) {
        allowed += 1;
      }

      if (parsed.type === "max" && subjectCount > allowed) {
        errors.push(ruleStr);
      } else if (parsed.type === "min" && subjectCount < allowed) {
        errors.push(ruleStr);
      }
    }
  }

  return errors;
};

export const FleetValidator = ({ listId }) => {
  const list = useSelector((state) =>
    state.lists?.find(({ id }) => listId === id)
  );
  const faction = useSelector((state) =>
    state.factions?.find(({ id }) => list?.factionId === id)
  );

  if (!list) return null;

  const errors = faction ? validateRules(list, faction) : [];

  return (
    <div className="fleet-validator">
      {errors.length === 0 ? (
        <p className="fleet-validator__valid">✓ No validation errors</p>
      ) : (
        <ul className="fleet-validator__errors">
          {errors.map((error, i) => (
            <li key={i} className="fleet-validator__error">
              {error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

import { useSelector } from "react-redux";

import { getAllUnits, getAllCrew } from "../../utils/faction";

import "./FleetValidator.css";

const parseRule = (ruleStr) => {
  const [mainPart, modifierPart] = ruleStr.split(";").map((s) => s.trim());
  const modifier = modifierPart ? modifierPart.trim() : null;

  const isMax = mainPart.startsWith("Max ");
  const isMin = mainPart.startsWith("Min ");
  if (!isMax && !isMin) return null;

  const rest = mainPart.slice(4); // Remove "Max " or "Min "
  const perIndex = rest.indexOf(" per ");

  const parseSubjectTokens = (nameStr) => {
    const tokens = nameStr.split(/,\s+(?:or\s+)?/i);
    return tokens.map((token) => {
      const m = token.trim().match(/^\d+\s+(.+)$/);
      return { name: (m ? m[1] : token).trim() };
    });
  };

  if (perIndex === -1) {
    const match = rest.match(/^(\d+)\s+(.+)$/);
    if (!match) return null;
    return {
      type: isMax ? "max" : "min",
      limit: parseInt(match[1]),
      subjects: parseSubjectTokens(match[2]),
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
    subjects: parseSubjectTokens(subjectMatch[2]),
    targets,
    modifier,
  };
};

const parsePercentRule = (ruleStr) => {
  const match = ruleStr.match(/^Max (\d+)%\s+(.+)$/i);
  if (!match) return null;
  return { limit: parseInt(match[1]), subject: match[2].trim() };
};

const validateRules = (list, faction) => {
  const validationRules = faction.validation_rules;
  if (!validationRules || validationRules.length === 0) return [];

  const allies = new Set(faction.allies || []);
  const primaryFactionId = list.factionId;

  const totalPoints =
    (list.cards || []).reduce((sum, c) => sum + (Number(c.cost) || 0), 0) +
    (list.crew || []).reduce((sum, c) => sum + (Number(c.cost) || 0), 0);

  const pointsFromFactions = (predicate) =>
    (list.cards || [])
      .filter((c) => c.factionId && predicate(c.factionId))
      .reduce((sum, c) => sum + (Number(c.cost) || 0), 0);

  const allEntries = getAllUnits(faction);
  const crewEntries = getAllCrew(faction);

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
      : allEntries.filter((u) => u.type_name_en === name || u.type_name === name)
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
    // Percentage rules: "Max N% Allies" or "Max N% Non-Allies"
    const pct = parsePercentRule(ruleStr);
    if (pct) {
      const subject = pct.subject.toLowerCase();
      let subjectPoints = 0;
      if (subject === "allies") {
        subjectPoints = pointsFromFactions((fId) => allies.has(fId));
      } else if (subject === "non-allies") {
        subjectPoints = pointsFromFactions((fId) => fId !== primaryFactionId && !allies.has(fId));
      }
      if (totalPoints > 0 && (subjectPoints / totalPoints) * 100 > pct.limit) {
        errors.push(ruleStr);
      }
      continue;
    }

    const parsed = parseRule(ruleStr);
    if (!parsed) continue;

    const subjectCount = parsed.subjects.reduce((sum, s) => sum + countForName(s.name), 0);

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

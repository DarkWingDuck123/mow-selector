import { useDispatch, useSelector } from "react-redux";

import { setSelectedRuleset } from "../../state/selectedRuleset";
import gameSystems from "../../assets/factions.json";

import "./RulesetBar.css";

export const RulesetBar = () => {
  const dispatch = useDispatch();
  const selectedRuleset = useSelector((state) => state.selectedRuleset);

  return (
    <nav className="ruleset-bar">
      {gameSystems.map((sys) => (
        <button
          key={sys.id}
          className={`ruleset-bar__item${selectedRuleset === sys.id ? " ruleset-bar__item--active" : ""}`}
          onClick={() => dispatch(setSelectedRuleset(sys.id))}
        >
          {sys.name_en}
        </button>
      ))}
    </nav>
  );
};

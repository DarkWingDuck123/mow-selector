import { configureStore } from "@reduxjs/toolkit";

import listsReducer from "./state/lists";
import factionsReducer from "./state/factions";
import errorsReducer from "./state/errors";
import rulesIndexReducer from "./state/rules-index";
import unitsReducer from "./state/units";
import selectedRulesetReducer from "./state/selectedRuleset";

const store = configureStore({
  reducer: {
    lists: listsReducer,
    factions: factionsReducer,
    errors: errorsReducer,
    rulesIndex: rulesIndexReducer,
    units: unitsReducer,
    selectedRuleset: selectedRulesetReducer,
  },
});

let previousLists = store.getState().lists;
store.subscribe(() => {
  const currentLists = store.getState().lists;
  if (currentLists !== previousLists) {
    previousLists = currentLists;
    localStorage.setItem("mowb.lists", JSON.stringify(currentLists));
  }
});

export default store;

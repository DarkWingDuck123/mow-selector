import { configureStore } from "@reduxjs/toolkit";

import listsReducer from "./state/lists";
import factionsReducer from "./state/factions";
import errorsReducer from "./state/errors";
import rulesIndexReducer from "./state/rules-index";
import unitsReducer from "./state/units";
import selectedRulesetReducer from "./state/selectedRuleset";
import customFactionsReducer from "./state/customFactions";
import customCardsReducer from "./state/customCards";

const store = configureStore({
  reducer: {
    lists: listsReducer,
    factions: factionsReducer,
    errors: errorsReducer,
    rulesIndex: rulesIndexReducer,
    units: unitsReducer,
    selectedRuleset: selectedRulesetReducer,
    customFactions: customFactionsReducer,
    customCards: customCardsReducer,
  },
});

function persistSlice(key, selector) {
  let previous = selector(store.getState());
  store.subscribe(() => {
    const current = selector(store.getState());
    if (current !== previous) {
      previous = current;
      localStorage.setItem(key, JSON.stringify(current));
    }
  });
}

persistSlice("mowb.lists", (s) => s.lists);
persistSlice("mowb.customFactions", (s) => s.customFactions);
persistSlice("mowb.customCards", (s) => s.customCards);

export default store;

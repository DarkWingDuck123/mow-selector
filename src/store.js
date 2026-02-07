import { configureStore } from "@reduxjs/toolkit";

import listsReducer from "./state/lists";
import factionsReducer from "./state/factions";
import errorsReducer from "./state/errors";
import rulesIndexReducer from "./state/rules-index";
import unitsReducer from "./state/units";

export default configureStore({
  reducer: {
    lists: listsReducer,
    factions: factionsReducer,
    errors: errorsReducer,
    rulesIndex: rulesIndexReducer,
    units: unitsReducer,
  },
});

import { createSlice } from "@reduxjs/toolkit";

export const customFactionsSlice = createSlice({
  name: "customFactions",
  initialState: [],
  reducers: {
    saveCustomFaction: (state, { payload }) => {
      // payload must include rulesetId and id
      const idx = state.findIndex(
        (f) => f.rulesetId === payload.rulesetId && f.id === payload.id
      );
      if (idx >= 0) {
        state[idx] = payload;
      } else {
        state.push(payload);
      }
    },
    deleteCustomFaction: (state, { payload }) => {
      // payload = { rulesetId, id }
      return state.filter(
        (f) => !(f.rulesetId === payload.rulesetId && f.id === payload.id)
      );
    },
    setCustomFactions: (_, { payload }) => payload || [],
  },
});

export const { saveCustomFaction, deleteCustomFaction, setCustomFactions } =
  customFactionsSlice.actions;

export default customFactionsSlice.reducer;

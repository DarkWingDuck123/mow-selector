import { createSlice } from "@reduxjs/toolkit";

export const customCardsSlice = createSlice({
  name: "customCards",
  initialState: [],
  reducers: {
    saveCustomCard: (state, { payload }) => {
      // payload must include rulesetId, factionId, and id
      const idx = state.findIndex(
        (c) =>
          c.rulesetId === payload.rulesetId &&
          c.factionId === payload.factionId &&
          c.id === payload.id
      );
      if (idx >= 0) {
        state[idx] = payload;
      } else {
        state.push(payload);
      }
    },
    deleteCustomCard: (state, { payload }) => {
      // payload = { rulesetId, factionId, id }
      return state.filter(
        (c) =>
          !(
            c.rulesetId === payload.rulesetId &&
            c.factionId === payload.factionId &&
            c.id === payload.id
          )
      );
    },
    setCustomCards: (_, { payload }) => payload || [],
  },
});

export const { saveCustomCard, deleteCustomCard, setCustomCards } =
  customCardsSlice.actions;

export default customCardsSlice.reducer;

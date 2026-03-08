import { createSlice } from "@reduxjs/toolkit";
import gameSystems from "../assets/factions.json";

export const selectedRulesetSlice = createSlice({
  name: "selectedRuleset",
  initialState: gameSystems[0].id,
  reducers: {
    setSelectedRuleset: (state, { payload }) => payload,
  },
});

export const { setSelectedRuleset } = selectedRulesetSlice.actions;

export default selectedRulesetSlice.reducer;

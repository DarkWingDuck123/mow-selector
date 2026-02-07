import { createSlice } from "@reduxjs/toolkit";

export const factionsSlice = createSlice({
  name: "factions",
  initialState: null,
  reducers: {
    setFactions: (state, { payload }) => {
      console.log("Set Factions: ", { payload });
      return payload;
    },
  },
});

export const { setFactions } = factionsSlice.actions;

export default factionsSlice.reducer;

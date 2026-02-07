import { createSlice } from "@reduxjs/toolkit";

export const unitsSlice = createSlice({
  name: "units",
  initialState: null,
  reducers: {
    setUnits: (state, { payload }) => {
      console.log("Set Units: ", { payload });
      return payload;
    },
  },
});

export const { setUnits } = unitsSlice.actions;

export default unitsSlice.reducer;

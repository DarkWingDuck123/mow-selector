import { createSlice } from "@reduxjs/toolkit";

import { getRandomId } from "../utils/id";
import { swap } from "../utils/collection";
import example from "./example_list.json";

export const listsSlice = createSlice({
  name: "lists",
  initialState: [ example ],
  reducers: {
    newList: (state, { payload }) => {
      const { rulesetId = "", rulesetName = "" } = payload || {};
      return [
        ...state,
        {
          id: getRandomId(),
          rulesetId,
          rulesetName,
          name: "New Fleet",
          description: "",
          pointsSpent: "0",
          factionId: "",
          factionName: "",
          cards: [],
        },
      ];
    },
    setLists: (state, { payload }) => {
      console.log("Log it: " + JSON.stringify(payload, null, 2));
      return payload || [];
    },
    updateList: (state, { payload }) => {
      const { listId, name, points, description, factionId, factionName } = payload;
      const newValues = { name, points, description, factionId, factionName };

      Object.keys(newValues).forEach((key) =>
        newValues[key] === undefined ? delete newValues[key] : {}
      );

      return state.map((list) => {
        const { id } = list;

        if (listId === id) {
          return {
            ...list,
            ...newValues,
          };
        }

        return list;
      });
    },
    moveList: (state, { payload }) => {
      const { sourceId, destinationId } = payload;
      const sourceIndex = state.findIndex(({ id }) => id === sourceId);
      const destinationIndex = state.findIndex(({ id }) => id === destinationId);
      return swap([...state], sourceIndex, destinationIndex);
    },
    deleteList: (state, { payload }) => {
      return state.filter(({ id }) => id !== payload);
    },
    addCard: (state, { payload }) => {
      const { listId, unit } = payload;
      const card = {
        uid: getRandomId(),
        id: unit.id,
        name: unit.name_en,
        description: unit.description_en || "",
        number: unit["squadron-size"] || 1,
        cost: String(unit.cost || 0),
        shipNames: [],
      };
      return state.map((list) => {
        if (listId === list.id) {
          return { ...list, cards: [...list.cards, card] };
        }
        return list;
      });
    },
    moveCard: (state, { payload }) => {
      const { listId, sourceIndex, destinationIndex } = payload;
      return state.map((list) => {
        if (listId === list.id) {
          return { ...list, cards: swap([...list.cards], sourceIndex, destinationIndex) };
        }
        return list;
      });
    },
    removeCard: (state, { payload }) => {
      const { listId, index } = payload;
      return state.map((list) => {
        if (listId === list.id) {
          return { ...list, cards: list.cards.filter((_, i) => i !== index) };
        }
        return list;
      });
    },
    addUnit: (state, { payload }) => {
      const { listId, type, unit } = payload;
      const newUnit = {
        ...unit,
        strength: unit.minimum,
      };

      return state.map((list) => {
        const { id } = list;

        if (listId === id) {
          return {
            ...list,
            [type]: [...list[type], newUnit],
          };
        }

        return list;
      });
    },
    moveUnit: (state, { payload }) => {
      const { listId, type, sourceIndex, destinationIndex } = payload;

      return state.map((list) => {
        if (listId === list.id) {
          return {
            ...list,
            [type]: swap([...list[type]], sourceIndex, destinationIndex),
          };
        }

        return list;
      });
    },
    duplicateUnit: (state, { payload }) => {
      const { listId, type, unitId } = payload;
      const unit = state
        .find(({ id }) => id === listId)
        [type].find(({ id }) => id === unitId);

      return state.map((list) => {
        const { id } = list;

        if (listId === id) {
          return {
            ...list,
            [type]: [
              ...list[type],
              { ...unit, id: `${unit.id.split(".")[0]}.${getRandomId()}` },
            ],
          };
        }

        return list;
      });
    },
    editUnit: (state, { payload }) => {
      const {
        listId,
        type,
        strength,
        unitId,
        options,
        equipment,
        armor,
        command,
        mounts,
        magic,
        items,
        name,
        detachments,
        activeLore,
        customNote,
      } = payload;
      const newValues = {
        strength,
        options,
        equipment,
        armor,
        command,
        mounts,
        magic,
        items,
        detachments,
        activeLore,
        name,
        customNote,
      };
      const unit = state
        .find(({ id }) => id === listId)
        [type].find(({ id }) => id === unitId);

      Object.keys(newValues).forEach((key) =>
        newValues[key] === undefined ? delete newValues[key] : {}
      );

      const newUnit = {
        ...unit,
        ...newValues,
      };

      return state.map((list) => {
        const { id } = list;

        if (listId === id) {
          return {
            ...list,
            [type]: list[type].map((data) => {
              if (data.id === unit.id) {
                return newUnit;
              }
              return data;
            }),
          };
        }

        return list;
      });
    },
    duplicateList: (state, { payload }) => {
      const list = state.find(({ id }) => id === payload);
      if (!list) return state;
      return [...state, { ...list, id: getRandomId(), name: `${list.name} (copy)` }];
    },
    removeUnit: (state, { payload }) => {
      const { listId, type, unitId } = payload;

      return state.map((list) => {
        const { id } = list;

        if (listId === id) {
          return {
            ...list,
            [type]: list[type].filter((data) => {
              if (data.id === unitId) {
                return false;
              }
              return true;
            }),
          };
        }

        return list;
      });
    },
  },
});

export const {
  newList,
  moveList,
  addCard,
  moveCard,
  removeCard,
  setLists,
  addUnit,
  moveUnit,
  editUnit,
  removeUnit,
  duplicateUnit,
  updateList,
  deleteList,
  duplicateList,
} = listsSlice.actions;

export default listsSlice.reducer;

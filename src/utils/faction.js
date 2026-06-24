export const ENTRY_TYPE = {
  UNIT: "UNIT",
  CREW: "CREW",
};

export const getEntries = (faction) => faction?.entries || [];

export const getAllUnits = (faction) =>
  getEntries(faction)
    .filter((entry) => entry.type === ENTRY_TYPE.UNIT)
    .flatMap((entry) => entry.units || []);

export const getAllCrew = (faction) =>
  getEntries(faction)
    .filter((entry) => entry.type === ENTRY_TYPE.CREW)
    .flatMap((entry) => entry.units || []);

export const findFactionUnit = (faction, id) =>
  getEntries(faction)
    .flatMap((entry) => entry.units || [])
    .find((unit) => unit.id === id);

import { findFactionUnit } from "./faction";

export function shouldHideFromFleetList(card, factionData) {
  if (card.id === "fleetlistcard") return true;
  if (card.id === "blank") return true;

  const unit = findFactionUnit(factionData, card.id);
  if (unit) {
    if (unit.hide_on_fleet_list === true) return true;
    // Default: hide pure reference/summary cards
    if (unit.type === "card" && String(unit.cost) === "0") return true;
    // Hide crew card — crew is shown as its own section
    if (unit.type === "crew_card") return true;
  }

  return false;
}

export function buildFleetListCardObj(addonDef, list, factionData) {
  const visibleCards = (list.cards || []).filter(
    (card) => !shouldHideFromFleetList(card, factionData)
  );

  // Group cards by id+name+cost — different costs (e.g. free vs paid) stay separate
  const groups = [];
  visibleCards.forEach((card) => {
    const key = `${card.id}|${card.name || card.id}|${card.cost}`;
    const existing = groups.find((g) => g.key === key);
    const cardCost = card.cost === "-" ? 0 : Number(card.cost) || 0;
    if (existing) {
      existing.instances++;
      existing.totalCost += cardCost;
    } else {
      groups.push({
        key,
        name: card.name || card.id,
        instances: 1,
        totalCost: cardCost,
        costStr: card.cost,
      });
    }
  });

  // Group crew by id, preserving order of first appearance
  const crewGroups = [];
  (list.crew || []).forEach((c) => {
    const existing = crewGroups.find((g) => g.key === c.id);
    const cost = c.cost === "-" ? 0 : Number(c.cost) || 0;
    if (existing) {
      existing.count++;
      existing.totalCost += cost;
    } else {
      crewGroups.push({ key: c.id, name: c.name || c.id, count: 1, totalCost: cost, costStr: c.cost });
    }
  });

  const crewCost = crewGroups.reduce((sum, g) => sum + g.totalCost, 0);
  const totalCost = groups.reduce((sum, g) => sum + g.totalCost, 0) + crewCost;

  const rowStyle =
    "display:flex;justify-content:space-between;align-items:baseline;padding-right:8px;";
  const insetRowStyle =
    "display:flex;justify-content:space-between;align-items:baseline;padding-right:8px;padding-left:14px;";

  const groupsHtml = groups
    .map((g) => {
      const prefix = g.instances > 1 ? `${g.instances}x ` : "";
      const costDisplay =
        g.costStr === "-" || g.totalCost === 0 ? "free" : `${g.totalCost} pts`;
      return `<div style="${rowStyle}"><b>${prefix}${g.name}</b><span style="white-space:nowrap;">${costDisplay}</span></div>`;
    })
    .join("");

  let crewHtml = "";
  if (crewGroups.length > 0) {
    const crewHeaderHtml = `<div style="${rowStyle}"><b>Crew</b></div>`;
    const crewItemsHtml = crewGroups
      .map((g) => {
        const prefix = g.count > 1 ? `${g.count}x ` : "";
        const costDisplay = g.costStr === "-" || g.totalCost === 0 ? "free" : `${g.totalCost} pts`;
        return `<div style="${insetRowStyle}"><span>${prefix}${g.name}</span><span style="white-space:nowrap;">${costDisplay}</span></div>`;
      })
      .join("");
    crewHtml = crewHeaderHtml + crewItemsHtml;
  }

  const dividerHtml =
    groups.length > 0 || crewCost > 0
      ? `<hr style="border:none;border-top:1px solid currentColor;margin:4px 0;">`
      : "";

  const totalHtml = `<div style="${rowStyle}font-weight:bold;"><span>TOTAL</span><span style="white-space:nowrap;">${totalCost} pts</span></div>`;

  const descHtml = list.description
    ? `<div style="font-style:italic;font-size:0.85em;margin-bottom:4px;">${list.description}</div>`
    : "";

  const content = descHtml + groupsHtml + crewHtml + dividerHtml + totalHtml;

  return {
    weight: "negligible",
    name: { value: (list.name || "Fleet").toUpperCase(), scale: 1.0 },
    type: { value: "FLEET LIST", scale: 0.75 },
    honors: { value: "", scale: 1.0 },
    cost: { value: `${totalCost} pts`, scale: 1.0 },
    notes: [
      {
        height: 100,
        title: { value: "", scale: 1.0 },
        note: { value: content, scale: 0.85 },
      },
    ],
  };
}

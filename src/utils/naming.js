export function randomName(cardId, factionData) {
  const rule = factionData?.naming_rules?.find((r) => r.id === cardId);
  if (!rule?.rule?.length) return null;

  const template = rule.rule[Math.floor(Math.random() * rule.rule.length)];
  const namesMap = (factionData.names || []).reduce((map, n) => {
    map[n.id] = n.value;
    return map;
  }, {});

  return template.split(" ").map((token) => {
    const values = namesMap[token];
    if (!values?.length) return token;
    return values[Math.floor(Math.random() * values.length)];
  }).join(" ");
}

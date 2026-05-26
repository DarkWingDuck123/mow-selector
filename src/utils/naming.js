export function randomName(cardId, factionData) {
  const rule = factionData?.naming_rules?.find((r) => r.id === cardId);
  if (!rule?.rule?.length) return null;

  const template = rule.rule[Math.floor(Math.random() * rule.rule.length)];
  const namesMap = (factionData.names || []).reduce((map, n) => {
    map[n.id] = n.value;
    return map;
  }, {});

  return template.split(" ").map((token) => {
    const match = token.match(/^(.*[a-zA-Z0-9])([^a-zA-Z0-9]*)$/);
    if (!match) return token;
    const [, word, suffix] = match;
    const values = namesMap[word];
    if (!values?.length) return token;
    return values[Math.floor(Math.random() * values.length)] + suffix;
  }).join(" ");
}

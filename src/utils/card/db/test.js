import negligible from './all_negligible.json' with { type: 'json' };
import light from './all_light.json' with { type: 'json' };
import medium from './all_medium.json' with { type: 'json' };
import heavy from './all_heavy.json' with { type: 'json' };
import meta from './meta.json' with { type: 'json' };

import { negligibleCard } from '../negligible.js';
import { lightCard } from '../light.js';
import { mediumCard } from '../medium.js';
import { heavyCard } from '../heavy.js';

export function testNegligibleCard() {
  return negligibleCard(meta, negligible, {});
}

export function testLightCard() {
  return lightCard(meta, light, {});
}

export function testMediumCard() {
  return mediumCard(meta, medium, {});
}

export function testHeavyCard() {
  return heavyCard(meta, heavy, {});
}

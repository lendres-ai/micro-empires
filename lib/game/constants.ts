export const WORLD = { width: 20, height: 20 };
export const MAX_DAILY_ORDERS = 3;

export const YIELDS = {
  PLAIN: { food: 1, wood: 0, stone: 0, gold: 0 },
  FARM:  { food: 2, wood: 0, stone: 0, gold: 0 },
  FOREST:{ food: 0, wood: 2, stone: 0, gold: 0 },
  MINE:  { food: 0, wood: 0, stone: 2, gold: 0 },
  HARBOR:{ food: 1, wood: 0, stone: 0, gold: 1 },
  RUIN:  { food: 0, wood: 0, stone: 0, gold: 0 },
};

export const COSTS = {
  EXPAND: { food: 0, wood: 1, stone: 1, gold: 0 },
  BUILD:  { level2: { wood: 2, stone: 2 }, level3: { wood: 4, stone: 4 } },
  ARMY_PER_TURN_UPKEEP: 1, // food
  ATTACK_COMMIT_MIN: 1,
};

export const COMBAT = {
  // deterministic combat: attackerPower = commit + army; defenderPower = garrison + army + tileLevel
  // RNG adds ±10% based on seeded rng for fairness
  variancePct: 0.1,
  captureBonusGold: 1,
};

export const STARTING = { food: 5, wood: 5, stone: 5, gold: 5, army: 1 };

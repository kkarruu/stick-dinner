export function scaledByLevel(level, n1, n2, n3) {
  const safeLevel = Math.max(1, Number(level) || 1);
  const step = (n2 ?? n1) - n1;
  const value = n1 + step * (safeLevel - 1);
  if (n3 == null) return value;
  return value;
}

export const HERO_POOL = [
  {
    name: "Knight",
    emoji: "🛡️",
    tier: 1,
    baseAtk: 1,
    baseHp: 4,
    ability: "SELF_ARMOR",
    hasMana: true,
    baseMaxMana: 3,
    describe(level) {
      return {
        title: "Mana Full (3):",
        desc: `Give himself +${scaledByLevel(level, 1, 2, 3)} Armor`,
      };
    },
  },
  {
    name: "Vanguard",
    emoji: "🛡️",
    tier: 1,
    baseAtk: 2,
    baseHp: 3,
    ability: "VANGUARD_HP",
    hasEnergy: true,
    baseMaxEnergy: 2,
    describe() {
      return {
        title: "Energy Full (2):",
        desc: "Front friend hit → Gain +1 HP & reset energy",
      };
    },
  },
  {
    name: "Archer",
    emoji: "🏹",
    tier: 1,
    baseAtk: 2,
    baseHp: 2,
    ability: "ENERGY_ARCHER",
    hasEnergy: true,
    baseMaxEnergy: 3,
    describe(level) {
      return {
        title: "Energy Full (3):",
        desc: `Start of Battle → Fire arrow for ${scaledByLevel(level, 1, 2, 3)} dmg`,
      };
    },
  },
  {
    name: "Bard",
    emoji: "🎸",
    tier: 1,
    baseAtk: 3,
    baseHp: 2,
    ability: "BUY_ITEM",
    describe(level) {
      return {
        title: "Item Bought:",
        desc: `+${scaledByLevel(level, 1, 2, 3)} Atk to random hero`,
      };
    },
  },
  {
    name: "Beast Tamer",
    emoji: "🐗",
    tier: 1,
    baseAtk: 2,
    baseHp: 2,
    ability: "BEAST_START",
    hasEnergy: true,
    baseMaxEnergy: 2,
    describe() {
      return {
        title: "Energy Full (2):",
        desc: "Start of Battle → Summon boar",
      };
    },
  },
  {
    name: "Monk",
    emoji: "🧘",
    tier: 1,
    baseAtk: 2,
    baseHp: 3,
    ability: "ENERGY_MONK",
    hasEnergy: true,
    baseMaxEnergy: 4,
    describe() {
      return {
        title: "Energy Full (4):",
        desc: "Start of Battle → Buff two friends +1/+1",
      };
    },
  },
  {
    name: "Thief",
    emoji: "🗡️",
    tier: 1,
    baseAtk: 4,
    baseHp: 1,
    ability: "WIN_GOLD",
    describe(level) {
      return {
        title: "After Combat:",
        desc: `Gain +${scaledByLevel(level, 1, 2, 3)} Gold`,
      };
    },
  },
  {
    name: "The Cook",
    emoji: "🍲",
    tier: 1,
    baseAtk: 2,
    baseHp: 1,
    ability: "SUMMON_BUFF",
    describe(level) {
      return {
        title: "Summoned:",
        desc: `Give summoned unit +${scaledByLevel(level, 1, 2, 3)} Health`,
      };
    },
  },
  {
    name: "Paladin",
    emoji: "✨",
    tier: 1,
    baseAtk: 2,
    baseHp: 3,
    ability: "SHOP_HP",
    describe() {
      return { title: "Passive:", desc: "All shop heroes get +1 HP" };
    },
  },
  {
    name: "Necromancer",
    emoji: "💀",
    tier: 2,
    baseAtk: 3,
    baseHp: 3,
    ability: "REANIMATE",
    describe(level) {
      return {
        title: "Start of Battle:",
        desc: `Reanimate one dead hero with its attack and ${scaledByLevel(level, 2, 4, 6)} HP`,
      };
    },
  },
  {
    name: "Shadow Priest",
    emoji: "🌑",
    tier: 2,
    baseAtk: 2,
    baseHp: 2,
    ability: "MIND_CONTROL",
    hasMana: true,
    baseMaxMana: 5,
    describe(level) {
      return {
        title: "Mana Full (5):",
        desc: `Mind control front monster for ${scaledByLevel(level, 1, 2, 3)} turns`,
      };
    },
  },
  {
    name: "Warlock",
    emoji: "🔮",
    tier: 2,
    baseAtk: 4,
    baseHp: 3,
    ability: "SELL_DEAD",
    describe(level) {
      return {
        title: "Sell Dead Hero:",
        desc: `Gain +${scaledByLevel(level, 3, 6, 9)} stats`,
      };
    },
  },
];

export function getHeroTemplate(name) {
  return HERO_POOL.find((hero) => hero.name === name);
}

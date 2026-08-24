import { state } from "../state/gameState.js";

export function scaledByLevel(level, n1, n2, n3) {
  const safeLevel = Math.max(1, Number(level) || 1);
  const step = (n2 ?? n1) - n1;
  const value = n1 + step * (safeLevel - 1);
  if (n3 == null) return value;
  return value;
}

export function isLevelSystemBoost() {
  return !!state.levelSystemBoost;
}

function heroLevel(hero) {
  return typeof hero === "number" ? hero : hero?.level || 1;
}

export const HERO_POOL = [
  {
    name: "Knight",
    emoji: "🛡️",
    tier: 1,
    baseAtk: 1,
    baseHp: 4,
    ability: "SELF_ARMOR",
    hasRage: true,
    baseMaxRage: 3,
    describe(hero) {
      return {
        title: "Rage Full (3):",
        desc: `Give himself +${scaledByLevel(heroLevel(hero), 1, 2, 3)} Armor`,
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
        desc: "Right Hero Hit → Gain +1 HP",
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
    describe(hero) {
      if (isLevelSystemBoost()) {
        return {
          title: "Energy Full (3):",
          desc: `Start of Battle → Fire arrow for ${scaledByLevel(heroLevel(hero), 1, 2, 3)} dmg`,
        };
      }
      return {
        title: "Energy Full (3):",
        desc: "Start of Battle → Deal 25% of ATK to a random enemy",
      };
    },
  },
  {
    name: "Bard",
    emoji: "🎸",
    tier: 1,
    baseAtk: 3,
    baseHp: 2,
    ability: "USE_ITEM",
    describe(hero) {
      return {
        title: "Item Used:",
        desc: `+${scaledByLevel(heroLevel(hero), 1, 2, 3)} Atk to random hero`,
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
    baseMaxEnergy: 3,
    describe(hero) {
      if (isLevelSystemBoost()) {
        const boar = scaledByLevel(heroLevel(hero), 1, 2, 3);
        return {
          title: "Energy Full (3):",
          desc: `Start of Battle → Summon ${boar}/${boar} boar`,
        };
      }
      return {
        title: "Energy Full (3):",
        desc: "Start of Battle → Summon a boar with 25% of this hero's stats",
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
    describe(hero) {
      return {
        title: "After Combat:",
        desc: `Gain +${scaledByLevel(heroLevel(hero), 1, 2, 3)} Gold`,
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
    describe(hero) {
      if (isLevelSystemBoost()) {
        return {
          title: "Summoned:",
          desc: `Give summoned unit +${scaledByLevel(heroLevel(hero), 1, 2, 3)} Health`,
        };
      }
      return {
        title: "Summoned:",
        desc: "Summoned units spawn with extra health, 50% of this hero's health.",
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
    describe(hero) {
      return {
        title: "Start of Battle:",
        desc: `Reanimate one dead hero with its attack and ${scaledByLevel(heroLevel(hero), 2, 4, 6)} HP`,
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
    describe(hero) {
      return {
        title: "Mana Full (5):",
        desc: `Mind control front monster for ${scaledByLevel(heroLevel(hero), 1, 2, 3)} turns`,
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
    describe(hero) {
      return {
        title: "Sell Dead Hero:",
        desc: `Gain +${scaledByLevel(heroLevel(hero), 3, 6, 9)} stats`,
      };
    },
  },
  {
    name: "Fire Mage",
    emoji: "🔥",
    tier: 2,
    baseAtk: 4,
    baseHp: 2,
    ability: "FIRE_WAVE",
    hasMana: true,
    baseMaxMana: 5,
    describe() {
      return {
        title: "Mana Full (5):",
        desc: "Deal 25% of ATK as fire to all heroes and enemies to his right",
      };
    },
  },
  {
    name: "Blacksmith",
    emoji: "🔨",
    tier: 2,
    baseAtk: 3,
    baseHp: 3,
    ability: "ARMOR_DOUBLE",
    describe() {
      return {
        title: "Passive:",
        desc: "Any armour this hero gains is doubled.",
      };
    },
  },
];

export function getHeroTemplate(name) {
  return HERO_POOL.find((hero) => hero.name === name);
}

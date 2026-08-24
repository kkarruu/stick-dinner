import { HERO_POOL } from "../data/heroes.js";
import { ITEM_POOL } from "../data/items.js";
import { scaledByLevel } from "../data/heroes.js";
import { MAX_HERO_LEVEL, EXP_BASE, EXP_GROWTH } from "../data/constants.js";
import { state } from "../state/gameState.js";
import { logDebug } from "./debug.js";

export function getHeroMaxMana(hero) {
  if (!hero?.hasMana) return 0;
  if (hero.name === "Knight") return 3;
  if (hero.name === "Shadow Priest") return 5;
  return hero.baseMaxMana || 0;
}

export function getHeroMaxEnergy(hero) {
  if (!hero?.hasEnergy) return 0;
  if (hero.name === "Vanguard") return 2;
  if (hero.name === "Beast Tamer") return 2;
  if (hero.name === "Archer") return 3;
  if (hero.name === "Monk") return 4;
  return hero.baseMaxEnergy || 2;
}

export function getHeroStructuredDescription(hero) {
  const template = HERO_POOL.find((entry) => entry.name === hero.name);
  if (template?.describe) return template.describe(hero.level || 1);
  return { title: "", desc: "" };
}

function withAbilityText(hero) {
  const structured = getHeroStructuredDescription(hero);
  hero.abilityTitle = structured.title;
  hero.abilityDesc = structured.desc;
  return hero;
}

export function isHeroDead(hero, multiplier = state.statMultiplier) {
  if (!hero) return true;
  const maxHp = (hero.baseHp + (hero.levelUpHp || 0)) * multiplier + (hero.bonusHp || 0);
  return maxHp - (hero.permanentDamage || 0) <= 0;
}

export function calculateHeroStats(hero, multiplier = state.statMultiplier) {
  const dead = isHeroDead(hero, multiplier);
  const atk = Math.max(
    0,
    Math.round((hero.baseAtk + (hero.levelUpAtk || 0)) * multiplier + (hero.bonusAtk || 0)),
  );
  if (dead) return { atk, hp: 1, isDead: true };
  const maxHp = (hero.baseHp + (hero.levelUpHp || 0)) * multiplier + (hero.bonusHp || 0);
  return { atk, hp: maxHp - (hero.permanentDamage || 0), isDead: false };
}

export function createHeroFromTemplate(template, options = {}) {
  const hero = {
    name: template.name,
    emoji: template.emoji,
    tier: template.tier,
    baseAtk: template.baseAtk,
    baseHp: template.baseHp,
    ability: template.ability,
    hasMana: !!template.hasMana,
    hasEnergy: !!template.hasEnergy,
    baseMaxMana: template.baseMaxMana || 0,
    baseMaxEnergy: template.baseMaxEnergy || 0,
    perk: null,
    armor: 0,
    level: 1,
    exp: 0,
    levelUpAtk: 0,
    levelUpHp: 0,
    bonusAtk: 0,
    bonusHp: 0,
    permanentDamage: 0,
    currentMana: 0,
    currentEnergy: 0,
    ...options,
  };
  if (hero.hasMana) hero.currentMana = getHeroMaxMana(hero);
  if (hero.hasEnergy) hero.currentEnergy = getHeroMaxEnergy(hero);
  return withAbilityText(hero);
}

export function applyPaladinBuffToHero(hero, partyList = state.party, shopList = state.shopHeroes) {
  if (!hero || hero.name === "Paladin") return;
  let paladinCount = 0;
  for (const member of partyList) {
    if (member && member.name === "Paladin" && !isHeroDead(member)) paladinCount += 1;
  }
  for (const member of shopList) {
    if (member && member.name === "Paladin") paladinCount += 1;
  }
  if (paladinCount > 0) hero.bonusHp += paladinCount;
}

export function createRandomHero(floor = state.dungeonFloor) {
  let available = HERO_POOL.filter((hero) => hero.tier <= floor);
  if (available.length === 0) available = HERO_POOL;
  const template = available[Math.floor(Math.random() * available.length)];
  const hero = createHeroFromTemplate(template);
  applyPaladinBuffToHero(hero);
  return hero;
}

export function createSandboxHero(template) {
  return createHeroFromTemplate(template);
}

export function createDeadHeroInstance() {
  const deadHero = createHeroFromTemplate(HERO_POOL[0]);
  deadHero.permanentDamage = 999;
  return deadHero;
}

export function cloneHero(hero) {
  return structuredClone(hero);
}

export function expToNextLevel(level) {
  if (level >= MAX_HERO_LEVEL) return 0;
  return EXP_BASE * EXP_GROWTH ** (level - 1);
}

export function heroStatSum(hero) {
  if (!hero) return 0;
  const stats = calculateHeroStats(hero);
  return stats.atk + (stats.isDead ? 0 : stats.hp);
}

export function grantHeroExp(hero, amount) {
  if (!hero || !amount || amount <= 0 || hero.level >= MAX_HERO_LEVEL) return 0;
  hero.exp = (hero.exp || 0) + Math.floor(amount);
  let gained = 0;
  while (hero.level < MAX_HERO_LEVEL) {
    const need = expToNextLevel(hero.level);
    if ((hero.exp || 0) < need) break;
    hero.exp -= need;
    hero.level += 1;
    gained += 1;
  }
  if (hero.level >= MAX_HERO_LEVEL) hero.exp = 0;
  withAbilityText(hero);
  if (gained > 0) logDebug(`[EXP] ${hero.name} reached level ${hero.level}.`);
  return gained;
}

export function grantPartyBattleExp(partyList, amount) {
  if (!amount) return;
  for (const hero of partyList) {
    if (hero && !isHeroDead(hero)) grantHeroExp(hero, amount);
  }
}

export function handleMerge(baseHero, fedHero) {
  const amount = Math.max(1, heroStatSum(fedHero));
  grantHeroExp(baseHero, amount);
  logDebug(`[MERGE] ${fedHero.name} (${amount} stat-sum) fed into ${baseHero.name}.`);
  return true;
}

export function applyItemToHero(targetHero, item) {
  if (!targetHero || !item) return;
  if (item.type === "POTION") {
    targetHero.bonusAtk += 1;
    targetHero.bonusHp += 1;
  } else if (item.type === "RING") {
    targetHero.perk = {
      name: "Cursed Skeleton",
      emoji: "💀",
      desc: "Start of Battle → Summon 1/1 Skeleton (One-time use)",
      type: "RING",
    };
  } else if (item.type === "AMULET") {
    targetHero.perk = {
      name: "Cursed Amulet",
      emoji: "📿",
      desc: "Start of Battle → Summon 1/1 Skeleton",
      type: "AMULET",
    };
  } else if (item.type === "ARMOR") {
    targetHero.perk = {
      name: "Iron Chestplate",
      emoji: "🛡️",
      desc: "Reduce damage taken by 2",
    };
  } else if (item.type === "WEAPON") {
    targetHero.perk = {
      name: "Sharpened Whetstone",
      emoji: "🗡️",
      desc: "+5 Attack in combat",
    };
    targetHero.bonusAtk += 5;
  } else if (item.type === "FEAST") {
    targetHero.bonusAtk += 3;
    targetHero.bonusHp += 3;
  } else if (item.type === "STACK_ARMOR") {
    targetHero.armor = (targetHero.armor || 0) + item.armorVal;
  } else if (item.type === "MANA_GAIN") {
    targetHero.perk = {
      name: item.name,
      emoji: item.emoji,
      desc: item.desc,
      type: "MANA_GAIN",
      manaPerTurn: item.manaPerTurn || 2,
    };
  } else if (item.type === "EXP_POTION") {
    grantHeroExp(targetHero, item.expAmount || 0);
  }
}

export function triggerBardItemBought(partyList = state.party) {
  const living = partyList.filter((hero) => hero && !isHeroDead(hero) && hero.name === "Bard");
  for (const bard of living) {
    const amount = scaledByLevel(bard.level, 1, 2, 3);
    const targets = partyList.filter((hero) => hero && !isHeroDead(hero));
    if (targets.length === 0) continue;
    const target = targets[Math.floor(Math.random() * targets.length)];
    target.bonusAtk += amount;
    logDebug(`[BARD] Item bought! ${target.name} gained +${amount} Atk.`);
  }
}

export function triggerWarlockSellBuff(soldHero, partyList) {
  const warlock = partyList.find((hero) => hero && hero.name === "Warlock" && !isHeroDead(hero));
  if (!warlock || !soldHero) return;
  const statBoost = scaledByLevel(warlock.level, 3, 6, 9);
  warlock.bonusAtk += statBoost;
  warlock.bonusHp += statBoost;
  logDebug(`[WARLOCK] Sold dead hero! Gave Warlock +${statBoost}/+${statBoost} stats.`);
}

export function cycleSandboxLevel(hero) {
  if (!hero) return;
  hero.level = hero.level >= MAX_HERO_LEVEL ? 1 : hero.level + 1;
  hero.exp = 0;
  withAbilityText(hero);
}

export function getRandomItem(specificTier = null, floor = state.dungeonFloor) {
  const allowedTier = specificTier !== null ? specificTier : floor;
  let pool = ITEM_POOL.filter((item) => item.tier <= allowedTier);
  if (pool.length === 0) pool = ITEM_POOL.filter((item) => item.tier === 1);
  if (pool.length === 0) pool = ITEM_POOL;
  return { ...pool[Math.floor(Math.random() * pool.length)] };
}

export function livingPartyCount(partyList = state.party) {
  return partyList.filter((hero) => hero && !isHeroDead(hero)).length;
}

export function occupiedPartyCount(partyList = state.party) {
  return partyList.filter((hero) => hero !== null).length;
}

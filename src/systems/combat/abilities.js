import { DELAY } from "../../data/constants.js";
import { isLevelSystemBoost, scaledByLevel } from "../../data/heroes.js";
import { gainArmor, getHeroMaxEnergy, getHeroMaxMana, getHeroMaxRage, percentOfStat } from "../heroes.js";
import { logDebug } from "../debug.js";

function isEnergyReady(hero) {
  return hero.hasEnergy && (hero.currentEnergy || 0) >= getHeroMaxEnergy(hero);
}

export function spendEnergy(hero) {
  hero.currentEnergy = 0;
}

export function applyCookBuff(combatPlayer, summoned, isUnitDead) {
  const cook = combatPlayer.find((hero) => hero && hero.name === "The Cook" && !isUnitDead(hero));
  if (!cook) return;
  const extra = isLevelSystemBoost()
    ? scaledByLevel(cook.level, 1, 2, 3)
    : percentOfStat(cook.hp, 0.5);
  summoned.hp += extra;
  summoned.maxHp = (summoned.maxHp || summoned.hp - extra) + extra;
}

export function makeMinion(name, emoji, atk, hp) {
  return {
    name,
    emoji,
    tier: 1,
    level: 1,
    exp: 0,
    perk: null,
    armor: 0,
    abilityTitle: "",
    abilityDesc: "",
    atk,
    hp,
    maxHp: hp,
    isDeadInCombat: false,
    hasMana: false,
    hasEnergy: false,
    hasRage: false,
    isMinion: true,
    isReanimated: false,
    sourcePartyIndex: null,
  };
}

function rightmostCorpse(combatPlayer, isCorpse) {
  for (let i = combatPlayer.length - 1; i >= 0; i -= 1) {
    if (isCorpse(combatPlayer[i])) return combatPlayer[i];
  }
  return null;
}

function reanimateCorpse(corpse, hp) {
  corpse.isDeadInCombat = false;
  corpse.isReanimated = true;
  corpse.hp = hp;
  corpse.maxHp = hp;
  corpse.perk = null;
  corpse.ability = null;
  corpse.abilityTitle = "";
  corpse.abilityDesc = "";
  corpse.hasMana = false;
  corpse.hasEnergy = false;
  corpse.hasRage = false;
  corpse.currentMana = 0;
  corpse.currentEnergy = 0;
}

export const startOfBattlePhases = [
  {
    id: "monk",
    run(ctx) {
      const { combatPlayer, manaMode, isUnitDead, emit } = ctx;
      if (!manaMode) return;
      for (let i = 0; i < combatPlayer.length; i += 1) {
        const hero = combatPlayer[i];
        if (isUnitDead(hero) || hero.name !== "Monk" || !isEnergyReady(hero)) continue;
        spendEnergy(hero);
        const living = combatPlayer.filter((unit) => !isUnitDead(unit) && !unit.isMinion);
        living.sort(() => Math.random() - 0.5);
        living.slice(0, 2).forEach((target) => {
          target.atk += 1;
          target.hp += 1;
          if (!target.isMinion && !target.isReanimated) {
            target.bonusAtk = (target.bonusAtk || 0) + 1;
            target.bonusHp = (target.bonusHp || 0) + 1;
          }
        });
        logDebug("[MONK] Monk buffed 2 friends +1/+1!");
        emit({ pulseIdx: i, delay: DELAY.ability });
      }
    },
  },
  {
    id: "necromancer",
    run(ctx) {
      const { combatPlayer, isUnitDead, emit } = ctx;
      for (let i = 0; i < combatPlayer.length; i += 1) {
        const hero = combatPlayer[i];
        if (isUnitDead(hero) || hero.name !== "Necromancer") continue;
        const corpse = rightmostCorpse(combatPlayer, ctx.isCorpse);
        if (!corpse) continue;
        const targetHp = scaledByLevel(hero.level, 2, 4, 6);
        reanimateCorpse(corpse, targetHp);
        logDebug(
          `[NECROMANCER] Reanimated ${corpse.name} with ⚔️${corpse.atk} / ❤️${targetHp} (no abilities or perks).`,
        );
        emit({ pulseIdx: i, delay: DELAY.necro });
      }
    },
  },
  {
    id: "beastTamer",
    run(ctx) {
      const { combatPlayer, manaMode, isUnitDead, emit } = ctx;
      if (!manaMode) return;
      for (let i = 0; i < combatPlayer.length; i += 1) {
        const hero = combatPlayer[i];
        if (isUnitDead(hero) || hero.name !== "Beast Tamer" || !isEnergyReady(hero)) continue;
        spendEnergy(hero);
        const boarAtk = isLevelSystemBoost()
          ? scaledByLevel(hero.level, 1, 2, 3)
          : percentOfStat(hero.atk, 0.25);
        const boarHp = isLevelSystemBoost()
          ? scaledByLevel(hero.level, 1, 2, 3)
          : percentOfStat(hero.hp, 0.25);
        const boar = makeMinion("Boar", "🐗", boarAtk, boarHp);
        applyCookBuff(combatPlayer, boar, isUnitDead);
        combatPlayer.push(boar);
        emit({ pulseIdx: i, delay: DELAY.ability });
      }
    },
  },
  {
    id: "summonPerks",
    run(ctx) {
      const { combatPlayer, isUnitDead, emit } = ctx;
      for (let i = 0; i < combatPlayer.length; i += 1) {
        const hero = combatPlayer[i];
        if (isUnitDead(hero) || !hero.perk) continue;
        if (hero.perk.name !== "Cursed Skeleton" && hero.perk.name !== "Cursed Amulet") continue;
        const skeleton = makeMinion("Skeleton", "💀", 1, 1);
        applyCookBuff(combatPlayer, skeleton, isUnitDead);
        combatPlayer.push(skeleton);
        if (hero.perk.name === "Cursed Skeleton") hero.perk = null;
        emit({ pulseIdx: i, delay: DELAY.ability });
      }
    },
  },
  {
    id: "archer",
    run(ctx) {
      const { combatPlayer, combatEnemy, manaMode, isUnitDead, emit } = ctx;
      if (!manaMode || combatEnemy.length === 0) return;
      for (let i = 0; i < combatPlayer.length; i += 1) {
        const hero = combatPlayer[i];
        if (isUnitDead(hero) || hero.name !== "Archer" || !isEnergyReady(hero)) continue;
        if (combatEnemy.length === 0) break;
        spendEnergy(hero);
        const dmg = isLevelSystemBoost()
          ? scaledByLevel(hero.level, 1, 2, 3)
          : percentOfStat(hero.atk, 0.25);
        const targetIdx = Math.floor(Math.random() * combatEnemy.length);
        combatEnemy[targetIdx].hp -= dmg;
        emit({
          pulseIdx: i,
          specificEnemyIdx: targetIdx,
          specificEnemyDmg: dmg,
          delay: DELAY.ability,
        });
        ctx.killEnemyIfDead?.(targetIdx);
      }
    },
  },
  {
    id: "skeletalArcher",
    run(ctx) {
      const { combatEnemy, combatPlayer, isUnitDead, emit, applyHpLoss } = ctx;
      for (let ei = 0; ei < combatEnemy.length; ei += 1) {
        const enemy = combatEnemy[ei];
        if (enemy.ability !== "OPENING_SHOT") continue;
        const living = [];
        combatPlayer.forEach((unit, idx) => {
          if (!isUnitDead(unit)) living.push(idx);
        });
        if (living.length === 0) continue;
        const pick = living[Math.floor(Math.random() * living.length)];
        applyHpLoss?.(combatPlayer[pick], 1, false);
        emit({
          specificPlayerIdx: pick,
          specificPlayerDmg: 1,
          delay: DELAY.ability,
        });
      }
    },
  },
];

export const manaAbilities = {
  SELF_ARMOR(ctx, hero) {
    gainArmor(hero, scaledByLevel(hero.level, 1, 2, 3));
  },
  MIND_CONTROL(ctx, hero, heroIdx) {
    if (ctx.mindControlledMonster || ctx.combatEnemy.length === 0) return;
    const targetMonster = ctx.combatEnemy.shift();
    ctx.mindControlledMonster = {
      ...targetMonster,
      turnsLeft: scaledByLevel(hero.level, 1, 2, 3),
    };
    ctx.emit({ pulseIdx: heroIdx, mcSlide: true, delay: DELAY.mindControl });
  },
  FIRE_WAVE(ctx, hero, heroIdx) {
    const { combatPlayer, combatEnemy, isUnitDead, emit, applyHpLoss, killEnemyIfDead } = ctx;
    const dmg = percentOfStat(hero.atk, 0.25);
    const playerHits = [];
    const enemyHits = [];
    for (let i = heroIdx + 1; i < combatPlayer.length; i += 1) {
      const unit = combatPlayer[i];
      if (isUnitDead(unit)) continue;
      applyHpLoss(unit, dmg, false);
      if (isUnitDead(unit)) unit.isDeadInCombat = true;
      playerHits.push({ idx: i, dmg });
    }
    for (let i = combatEnemy.length - 1; i >= 0; i -= 1) {
      combatEnemy[i].hp -= dmg;
      enemyHits.push({ idx: i, dmg });
      killEnemyIfDead?.(i);
    }
    logDebug(`[FIRE MAGE] Fire wave for ${dmg} to the right.`);
    emit({ pulseIdx: heroIdx, playerHits, enemyHits, delay: DELAY.ability });
  },
};

export function tickVanguard(combatPlayer, { manaMode, isMcAttacking, hpLoss, damagedUnit, isUnitDead }) {
  if (!manaMode || isMcAttacking || hpLoss <= 0 || !damagedUnit) return;
  const damagedIdx = combatPlayer.indexOf(damagedUnit);
  if (damagedIdx <= 0) return;
  const hero = combatPlayer[damagedIdx - 1];
  if (isUnitDead(hero) || hero.name !== "Vanguard" || !hero.hasEnergy) return;
  if ((hero.currentEnergy || 0) >= getHeroMaxEnergy(hero)) {
    hero.currentEnergy = 0;
    hero.bonusHp += 1;
    hero.hp = (hero.hp || 0) + 1;
    logDebug("[VANGUARD] Right hero took damage! Vanguard gained +1 HP.");
  }
}

export function tickRage(hero, { manaMode, isMcAttacking, emit }) {
  if (!manaMode || isMcAttacking || !hero?.hasRage) return;
  const maxRage = getHeroMaxRage(hero);
  if (maxRage <= 0) return;
  hero.currentRage = (hero.currentRage || 0) + 1;
  if (hero.currentRage >= maxRage) {
    hero.currentRage = 0;
    gainArmor(hero, scaledByLevel(hero.level, 1, 2, 3));
    emit?.({ pulseIdx: -1, delay: DELAY.ability });
    logDebug(`[RAGE] ${hero.name} rage filled! Gained armor.`);
  }
}

export { getHeroMaxMana, getHeroMaxEnergy, getHeroMaxRage };

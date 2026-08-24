import { DELAY } from "../../data/constants.js";
import { scaledByLevel } from "../../data/heroes.js";
import { getHeroMaxEnergy, getHeroMaxMana } from "../heroes.js";
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
  summoned.hp += scaledByLevel(cook.level, 1, 2, 3);
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
    isDeadInCombat: false,
    hasMana: false,
    hasEnergy: false,
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
  corpse.perk = null;
  corpse.ability = null;
  corpse.abilityTitle = "";
  corpse.abilityDesc = "";
  corpse.hasMana = false;
  corpse.hasEnergy = false;
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
        const boarStat = scaledByLevel(hero.level, 1, 2, 3);
        const boar = makeMinion("Boar", "🐗", boarStat, boarStat);
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
        const dmg = scaledByLevel(hero.level, 1, 2, 3);
        combatEnemy[0].hp -= dmg;
        emit({
          pulseIdx: i,
          specificEnemyIdx: 0,
          specificEnemyDmg: dmg,
          delay: DELAY.ability,
        });
        ctx.killEnemyIfDead?.(0);
      }
    },
  },
];

export const manaAbilities = {
  SELF_ARMOR(ctx, hero) {
    hero.armor = (hero.armor || 0) + scaledByLevel(hero.level, 1, 2, 3);
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
};

export function tickVanguard(combatPlayer, { manaMode, isMcAttacking, hpLoss, isUnitDead }) {
  if (!manaMode || isMcAttacking || hpLoss <= 0) return;
  for (const hero of combatPlayer) {
    if (isUnitDead(hero) || hero.name !== "Vanguard" || !hero.hasEnergy) continue;
    if ((hero.currentEnergy || 0) >= getHeroMaxEnergy(hero)) {
      hero.currentEnergy = 0;
      hero.bonusHp += 1;
      hero.hp = (hero.hp || 0) + 1;
      logDebug("[VANGUARD] Front hero took damage! Vanguard gained +1 HP and reset energy.");
    }
  }
}

export { getHeroMaxMana, getHeroMaxEnergy };

import { DELAY, MAX_BATTLE_TURNS, BATTLE_GOLD } from "../../data/constants.js";
import { scaledByLevel } from "../../data/heroes.js";
import { calculateHeroStats, isHeroDead } from "../heroes.js";
import { logDebug } from "../debug.js";
import {
  getHeroMaxMana,
  manaAbilities,
  startOfBattlePhases,
  tickRage,
  tickVanguard,
} from "./abilities.js";

function cloneOf(value) {
  return value == null ? null : structuredClone(value);
}

export function isUnitDead(unit, multiplier) {
  if (!unit) return true;
  if (unit.isMinion || unit.isReanimated) return unit.hp <= 0 || !!unit.isDeadInCombat;
  return isHeroDead(unit, multiplier) || !!unit.isDeadInCombat;
}

export function isCorpse(unit, multiplier) {
  if (!unit || unit.isMinion) return false;
  if (unit.isReanimated) return unit.hp <= 0 || !!unit.isDeadInCombat;
  return isHeroDead(unit, multiplier) || !!unit.isDeadInCombat;
}

function toCombatUnit(hero, sourcePartyIndex, multiplier) {
  const clone = structuredClone(hero);
  const stats = calculateHeroStats(clone, multiplier);
  clone.atk = stats.atk;
  clone.hp = stats.hp;
  clone.maxHp = stats.maxHp;
  clone.isDeadInCombat = stats.isDead;
  clone.isReanimated = false;
  clone.isMinion = false;
  clone.sourcePartyIndex = sourcePartyIndex;
  clone.bleed = false;
  return clone;
}

function toCombatEnemy(template) {
  return {
    name: template.name,
    emoji: template.emoji,
    atk: template.atk,
    hp: template.hp,
    maxHp: template.maxHp ?? template.hp,
    level: template.level || 1,
    ability: template.ability || null,
    role: template.role || "FRONT",
    armor: template.armor || 0,
  };
}

function enemyExpValue(enemy) {
  return (enemy.atk || 0) + (enemy.maxHp ?? enemy.hp ?? 0);
}

function makeFaintSpawn(enemy) {
  const atk = Math.max(1, Math.round((enemy.atk || 1) * 0.5));
  const hp = Math.max(1, Math.round((enemy.maxHp || enemy.hp || 1) * 0.5));
  return { name: "Spawn", emoji: "👾", atk, hp, maxHp: hp, level: 1 };
}

function makeFeintSlime() {
  return { name: "Slime", emoji: "🟢", atk: 2, hp: 2, maxHp: 2, level: 1 };
}

function livingIndices(units, multiplier) {
  const idxs = [];
  for (let i = 0; i < units.length; i += 1) {
    if (!isUnitDead(units[i], multiplier)) idxs.push(i);
  }
  return idxs;
}

function applyHpLoss(unit, amount, isMcAttacking) {
  if (isMcAttacking || unit.isMinion || unit.isReanimated) {
    unit.hp -= amount;
  } else {
    unit.permanentDamage = (unit.permanentDamage || 0) + amount;
  }
}

function strikeHero(unit, amount, { ignoreArmor = false, isMcAttacking = false } = {}) {
  let remaining = Math.max(0, amount);
  let armorLoss = 0;
  let hpLoss = 0;
  if (!ignoreArmor && !isMcAttacking && unit.armor && unit.armor > 0) {
    armorLoss = Math.min(unit.armor, remaining);
    unit.armor -= armorLoss;
    remaining -= armorLoss;
  }
  if (remaining > 0) {
    hpLoss = remaining;
    applyHpLoss(unit, hpLoss, isMcAttacking);
  }
  return { armorLoss, hpLoss };
}

function markCombatDeath(unit, isMcAttacking, multiplier) {
  if (!unit || isMcAttacking) return;
  if (unit.isMinion || unit.isReanimated) {
    if (unit.hp <= 0) unit.isDeadInCombat = true;
  } else if (isHeroDead(unit, multiplier)) {
    unit.isDeadInCombat = true;
  }
}

function sortDeadLeft(units, multiplier) {
  units.sort((a, b) => {
    const aDead = isUnitDead(a, multiplier);
    const bDead = isUnitDead(b, multiplier);
    if (aDead === bDead) return 0;
    return aDead ? -1 : 1;
  });
}

function rightmostLiving(units, multiplier) {
  for (let i = units.length - 1; i >= 0; i -= 1) {
    if (!isUnitDead(units[i], multiplier)) return units[i];
  }
  return null;
}

function collectPartyUpdates(combatPlayer) {
  const updates = [];
  for (const unit of combatPlayer) {
    if (unit.isMinion || unit.isReanimated || unit.sourcePartyIndex == null) continue;
    updates.push({
      index: unit.sourcePartyIndex,
      permanentDamage: unit.permanentDamage || 0,
      armor: unit.armor || 0,
      currentMana: unit.currentMana || 0,
      currentEnergy: unit.currentEnergy || 0,
      currentRage: unit.currentRage || 0,
      perk: unit.perk ? structuredClone(unit.perk) : null,
    });
  }
  return updates;
}

function thiefGold(combatPlayer) {
  let gold = 0;
  for (const unit of combatPlayer) {
    if (unit.isMinion || unit.name !== "Thief") continue;
    const amount = scaledByLevel(unit.level, 1, 2, 3);
    gold += amount;
    logDebug(`[THIEF] After combat: +${amount} Gold`);
  }
  return gold;
}

export function simulateBattle({ playerParty, enemies, manaMode, statMultiplier }) {
  const frames = [];
  const combatPlayer = [];
  const packed = [];

  playerParty.forEach((hero, idx) => {
    if (!hero) return;
    packed.push(toCombatUnit(hero, idx, statMultiplier));
  });
  packed.sort((a, b) => {
    if (a.isDeadInCombat === b.isDeadInCombat) return 0;
    return a.isDeadInCombat ? -1 : 1;
  });
  packed.forEach((unit) => combatPlayer.push(unit));

  const combatEnemy = [];
  enemies.forEach((template) => {
    if (template && template.hp > 0) combatEnemy.push(toCombatEnemy(template));
  });
  combatEnemy.sort((a, b) => {
    const ar = a.role === "BACK" ? 1 : 0;
    const br = b.role === "BACK" ? 1 : 0;
    return ar - br;
  });

  let mindControlledMonster = null;
  let battleExp = 0;

  const creditEnemyKill = (enemy) => {
    if (!enemy) return;
    const value = enemyExpValue(enemy);
    battleExp += value;
    logDebug(`[EXP] Killed ${enemy.name} (${value} EXP).`);
  };

  const spawnSplitsIfNeeded = (enemy) => {
    if (enemy?.ability === "FEINT" || enemy?.ability === "SPLIT") {
      for (let s = 0; s < 3; s += 1) combatEnemy.unshift(makeFeintSlime());
      return;
    }
    if (enemy?.ability === "FAINT") combatEnemy.unshift(makeFaintSpawn(enemy));
  };

  const killEnemyIfDead = (index = 0) => {
    const enemy = combatEnemy[index];
    if (!enemy || enemy.hp > 0) return false;
    creditEnemyKill(enemy);
    combatEnemy.splice(index, 1);
    spawnSplitsIfNeeded(enemy);
    return true;
  };

  const emit = (fx = {}, title = null) => {
    frames.push({
      player: cloneOf(combatPlayer),
      enemies: cloneOf(combatEnemy),
      mindControl: cloneOf(mindControlledMonster),
      fx: {
        playerFrontArmorLoss: null,
        playerFrontHpLoss: null,
        enemyFrontDmg: null,
        specificEnemyIdx: -1,
        specificEnemyDmg: null,
        specificPlayerIdx: -1,
        specificPlayerDmg: null,
        playerHits: null,
        enemyHits: null,
        lungePlayer: false,
        lungeEnemy: false,
        pulseIdx: -1,
        mcSlide: false,
        delay: DELAY.turnGap,
        ...fx,
      },
      title,
      result: null,
    });
  };

  const ctx = {
    combatPlayer,
    combatEnemy,
    get mindControlledMonster() {
      return mindControlledMonster;
    },
    set mindControlledMonster(value) {
      mindControlledMonster = value;
    },
    manaMode,
    statMultiplier,
    isUnitDead: (unit) => isUnitDead(unit, statMultiplier),
    isCorpse: (unit) => isCorpse(unit, statMultiplier),
    emit,
    killEnemyIfDead,
    applyHpLoss,
  };

  const finish = (message, goldReward, outcome) => {
    frames.push({
      player: cloneOf(combatPlayer),
      enemies: cloneOf(combatEnemy),
      mindControl: cloneOf(mindControlledMonster),
      fx: { delay: 0 },
      title: message,
      result: {
        message,
        goldReward,
        outcome,
        thiefGold: thiefGold(combatPlayer),
        partyUpdates: collectPartyUpdates(combatPlayer),
        battleExp,
      },
    });
    return { frames, result: frames[frames.length - 1].result };
  };

  emit({ delay: DELAY.battleIntro }, "BATTLE INITIATED!");

  if (manaMode) {
    combatPlayer.forEach((hero) => {
      if (!isUnitDead(hero, statMultiplier) && hero.hasEnergy) {
        hero.currentEnergy = (hero.currentEnergy || 0) + 1;
      }
    });
  }
  emit({ delay: DELAY.energyPulse }, "STAGED START: Accumulating Energy...");

  for (const phase of startOfBattlePhases) {
    phase.run(ctx);
  }

  emit({ delay: DELAY.postStart }, "BATTLE IN PROGRESS");

  for (let turn = 0; turn < MAX_BATTLE_TURNS; turn += 1) {
    sortDeadLeft(combatPlayer, statMultiplier);
    for (let i = combatPlayer.length - 1; i >= 0; i -= 1) {
      if (combatPlayer[i].isMinion && isUnitDead(combatPlayer[i], statMultiplier)) {
        combatPlayer.splice(i, 1);
      }
    }

    const living = combatPlayer.filter((unit) => !isUnitDead(unit, statMultiplier));
    if (living.length === 0 && combatEnemy.length === 0 && !mindControlledMonster) {
      return finish("It's a Draw!", BATTLE_GOLD.draw, "draw");
    }
    if (living.length === 0 && !mindControlledMonster) {
      return finish("Defeat...", BATTLE_GOLD.defeat, "defeat");
    }
    if (combatEnemy.length === 0 && !mindControlledMonster) {
      return finish("Victory!", BATTLE_GOLD.victory, "victory");
    }

    const bleedHits = [];
    combatPlayer.forEach((unit, idx) => {
      if (!unit.bleed || isUnitDead(unit, statMultiplier)) return;
      if (Math.random() >= 0.5) return;
      applyHpLoss(unit, 1, false);
      markCombatDeath(unit, false, statMultiplier);
      bleedHits.push({ idx, dmg: 1 });
    });
    if (bleedHits.length) emit({ playerHits: bleedHits, delay: DELAY.ability });

    if (manaMode) {
      for (let idx = 0; idx < combatPlayer.length; idx += 1) {
        const hero = combatPlayer[idx];
        if (isUnitDead(hero, statMultiplier) || !hero.hasMana) continue;
        const extraMana = hero.perk?.type === "MANA_GAIN" ? hero.perk.manaPerTurn || 2 : 0;
        hero.currentMana = (hero.currentMana || 0) + 1 + extraMana;
        const maxMana = getHeroMaxMana(hero);
        if (hero.currentMana >= maxMana) {
          hero.currentMana = 0;
          emit({ pulseIdx: idx, delay: DELAY.manaPulse });
          const ability = manaAbilities[hero.ability];
          if (ability) ability(ctx, hero, idx);
          emit({ delay: DELAY.manaResolve });
        }
      }
    }

    let pFront = null;
    let isMcAttacking = false;
    if (mindControlledMonster && combatEnemy.length > 0) {
      pFront = mindControlledMonster;
      isMcAttacking = true;
    } else {
      pFront = rightmostLiving(combatPlayer, statMultiplier);
    }

    if (!pFront || combatEnemy.length === 0) {
      if (combatEnemy.length === 0) return finish("Victory!", BATTLE_GOLD.victory, "victory");
      return finish("Defeat...", BATTLE_GOLD.defeat, "defeat");
    }

    const eFront = combatEnemy[0];
    let rawDmgToPlayer = eFront.atk;
    const stats =
      isMcAttacking || pFront.isMinion || pFront.isReanimated
        ? { atk: pFront.atk }
        : calculateHeroStats(pFront, statMultiplier);
    let dmgToEnemy = stats.atk;

    if (!isMcAttacking && pFront.perk?.name === "Iron Chestplate") {
      rawDmgToPlayer = Math.max(0, rawDmgToPlayer - 2);
    }

    const ignoreArmor = eFront.ability === "CRUSH";
    const livingIdxs = livingIndices(combatPlayer, statMultiplier);
    let targetIdxs = [];
    if (isMcAttacking) {
      targetIdxs = [];
    } else if (eFront.ability === "SNEAK" && livingIdxs.length) {
      targetIdxs = [livingIdxs[0]];
    } else if (eFront.ability === "REACH" && livingIdxs.length) {
      targetIdxs = [livingIdxs[livingIdxs.length - 1]];
      if (livingIdxs.length > 1) targetIdxs.push(livingIdxs[livingIdxs.length - 2]);
    } else {
      targetIdxs = [combatPlayer.indexOf(pFront)];
    }

    let frontArmorLoss = 0;
    let frontHpLoss = 0;
    const extraPlayerHits = [];
    let totalHpDealt = 0;
    const frontIdx = isMcAttacking ? -1 : combatPlayer.indexOf(pFront);

    const hitUnit = (unit, idx) => {
      const struck = strikeHero(unit, rawDmgToPlayer, { ignoreArmor, isMcAttacking });
      totalHpDealt += struck.hpLoss;
      if (!isMcAttacking && eFront.ability === "BLEED" && struck.hpLoss > 0) unit.bleed = true;
      if (!isMcAttacking && eFront.ability === "MANA_DRAIN" && unit.hasMana) unit.currentMana = 0;
      tickVanguard(combatPlayer, {
        manaMode,
        isMcAttacking,
        hpLoss: struck.hpLoss,
        damagedUnit: unit,
        isUnitDead: (member) => isUnitDead(member, statMultiplier),
      });
      tickRage(unit, { manaMode, isMcAttacking, emit });
      if (idx === frontIdx || isMcAttacking) {
        frontArmorLoss += struck.armorLoss;
        frontHpLoss += struck.hpLoss;
      } else if (idx >= 0) {
        extraPlayerHits.push({ idx, dmg: struck.hpLoss + struck.armorLoss });
      }
    };

    if (isMcAttacking) {
      hitUnit(pFront, -1);
    } else {
      targetIdxs.forEach((idx) => {
        const unit = combatPlayer[idx];
        if (unit && !isUnitDead(unit, statMultiplier)) hitUnit(unit, idx);
      });
    }

    if (eFront.ability === "LIFESTEAL" && totalHpDealt > 0) {
      eFront.hp = Math.min(eFront.maxHp ?? eFront.hp, eFront.hp + totalHpDealt);
    }

    if ((eFront.armor || 0) > 0 && dmgToEnemy > 0) {
      const used = Math.min(eFront.armor, dmgToEnemy);
      eFront.armor -= used;
      dmgToEnemy -= used;
    }
    if (dmgToEnemy > 0 && eFront.ability === "GROW") eFront.atk += 1;
    eFront.hp -= dmgToEnemy;

    if (!isMcAttacking && eFront.ability === "THORNS") {
      const thorns = strikeHero(pFront, 1, { ignoreArmor: false, isMcAttacking: false });
      frontHpLoss += thorns.hpLoss;
      frontArmorLoss += thorns.armorLoss;
      tickRage(pFront, { manaMode, isMcAttacking: false, emit });
    }

    emit({ lungePlayer: true, lungeEnemy: true, delay: DELAY.lunge });
    emit({
      playerFrontArmorLoss: frontArmorLoss > 0 ? frontArmorLoss : null,
      playerFrontHpLoss: frontHpLoss > 0 ? frontHpLoss : null,
      enemyFrontDmg: stats.atk,
      playerHits: extraPlayerHits.length ? extraPlayerHits : null,
      delay: DELAY.clash,
    });

    if (isMcAttacking) {
      mindControlledMonster.turnsLeft -= 1;
      if (mindControlledMonster.hp <= 0) {
        creditEnemyKill(mindControlledMonster);
        spawnSplitsIfNeeded(mindControlledMonster);
        mindControlledMonster = null;
      } else if (mindControlledMonster.turnsLeft <= 0) {
        mindControlledMonster = null;
      }
    } else {
      targetIdxs.forEach((idx) => markCombatDeath(combatPlayer[idx], false, statMultiplier));
      markCombatDeath(pFront, false, statMultiplier);
    }

    killEnemyIfDead(0);
    emit({ delay: DELAY.turnGap });
  }

  return finish("It's a Draw!", BATTLE_GOLD.draw, "draw");
}

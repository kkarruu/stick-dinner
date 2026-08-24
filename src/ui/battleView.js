import { DELAY, MAX_HERO_LEVEL } from "../data/constants.js";
import { enemyAbilityText } from "../data/enemies.js";
import { calculateHeroStats, expToNextLevel, formatHpText, getHeroMaxEnergy, getHeroMaxMana, getHeroMaxRage } from "../systems/heroes.js";
import { isUnitDead } from "../systems/combat/engine.js";
import { state } from "../state/gameState.js";
import { $, append, el, fill } from "./dom.js";

function expBarFromDisplay(display) {
  if (!display) return null;
  if ((display.level || 1) >= MAX_HERO_LEVEL) {
    return el("div", { class: "exp-container" }, el("span", { class: "max-text" }, "MAX LVL"));
  }
  const need = expToNextLevel(display.level || 1);
  const current = display.exp || 0;
  const pct = need > 0 ? Math.min(100, (current / need) * 100) : 0;
  return el(
    "div",
    { class: "exp-bar", title: `${current} / ${need} EXP` },
    el("div", { class: "exp-bar-fill", style: { width: `${pct}%` } }),
    el("span", { class: "exp-bar-label" }, `${current}/${need}`),
  );
}

function resourceBar(hero, dead) {
  if (!state.manaModeActive || dead || hero.isMinion || hero.isReanimated) return null;
  if (hero.hasRage) {
    const maxR = getHeroMaxRage(hero);
    const currentR = hero.currentRage || 0;
    const segs = [];
    for (let i = 0; i < maxR; i += 1) {
      segs.push(el("div", { class: `resource-segment${i < currentR ? " rage-filled" : ""}` }));
    }
    return el("div", { class: "resource-bar-container" }, ...segs);
  }
  if (hero.hasEnergy) {
    const maxE = getHeroMaxEnergy(hero);
    const currentE = hero.currentEnergy || 0;
    const segs = [];
    for (let i = 0; i < maxE; i += 1) {
      segs.push(el("div", { class: `resource-segment${i < currentE ? " energy-filled" : ""}` }));
    }
    return el("div", { class: "resource-bar-container" }, ...segs);
  }
  if (hero.hasMana) {
    const maxM = getHeroMaxMana(hero);
    const currentM = hero.currentMana || 0;
    const segs = [];
    for (let i = 0; i < maxM; i += 1) {
      segs.push(el("div", { class: `resource-segment${i < currentM ? " mana-filled" : ""}` }));
    }
    return el("div", { class: "resource-bar-container" }, ...segs);
  }
  return null;
}

function combatStats(hero, dead) {
  if (hero.isMinion || hero.isReanimated) {
    return { atk: hero.atk, hp: hero.hp, maxHp: hero.maxHp ?? hero.hp, isDead: dead };
  }
  const stats = calculateHeroStats(hero);
  if (hero.isReanimated) {
    stats.atk = hero.atk;
    stats.hp = hero.hp;
    stats.maxHp = hero.maxHp ?? hero.hp;
  }
  return stats;
}

export function renderBattleFrame(frame, options = {}) {
  const fx = frame.fx || {};
  const playerRoot = $("battle-player-team");
  const enemyRoot = $("battle-enemy-team");
  if (!playerRoot || !enemyRoot) return;

  const playerCards = frame.player.map((hero, index) => {
    const isFront = index === frame.player.length - 1;
    const dead = isUnitDead(hero, state.statMultiplier);
    const css = [
      "card",
      dead ? "dead-card" : "",
      isFront && fx.lungePlayer ? "lunge-player" : "",
      index === fx.pulseIdx ? "ability-pulse" : "",
      options.leveling?.has(hero.sourcePartyIndex) ? "level-up-glow" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const dmgNodes = [];
    if (!dead && fx.specificPlayerIdx === index && fx.specificPlayerDmg > 0) {
      dmgNodes.push(el("div", { class: "dmg-text-center" }, `-${fx.specificPlayerDmg}`));
    }
    const splash = (fx.playerHits || []).find((hit) => hit.idx === index);
    if (!dead && splash && splash.dmg > 0 && fx.specificPlayerIdx !== index) {
      dmgNodes.push(el("div", { class: "dmg-text-center" }, `-${splash.dmg}`));
    }
    if (isFront && !dead) {
      if (fx.playerFrontArmorLoss > 0) {
        dmgNodes.push(el("div", { class: "armor-dmg-text-center" }, `-${fx.playerFrontArmorLoss}`));
      }
      if (fx.playerFrontHpLoss > 0) {
        dmgNodes.push(el("div", { class: "dmg-text-center" }, `-${fx.playerFrontHpLoss}`));
      }
    }

    const stats = combatStats(hero, dead);
    const name = dead ? "Dead Body" : hero.name;
    const card = el("div", { class: css, style: { borderColor: "#3498db", position: "relative" } }, ...dmgNodes);
    if (options.leveling?.has(hero.sourcePartyIndex)) {
      append(
        card,
        el("div", { class: "level-up-arrow", style: { left: "30%" } }, "▲"),
        el("div", { class: "level-up-arrow", style: { left: "50%", animationDelay: "0.12s" } }, "▲"),
        el("div", { class: "level-up-arrow", style: { left: "70%", animationDelay: "0.24s" } }, "▲"),
      );
    }
    append(
      card,
      el(
        "div",
        { class: "badge-row" },
        el(
          "div",
          { class: "tier-badge" },
          hero.isMinion ? "Minion" : hero.isReanimated ? "Reanimated" : `Tier ${hero.tier || 1}`,
        ),
        el("div", { class: "level-badge" }, `Lvl ${hero.level || 1}`),
      ),
      el(
        "div",
        { class: "hero-name-row" },
        el("div", { class: "hero-name" }, name),
        hero.armor > 0 ? el("div", { class: "armor-badge" }, `🛡️${hero.armor}`) : null,
        hero.bleed ? el("div", { class: "armor-badge" }, "🩸") : null,
      ),
      expBarFromDisplay(options.expDisplay?.[hero.sourcePartyIndex]),
      resourceBar(hero, dead),
      el("div", { class: "emoji" }, dead ? "💀" : hero.emoji),
      el(
        "div",
        { class: "ability-box" },
        el("span", { class: "ability-title" }, hero.abilityTitle || ""),
        el("span", { class: "ability-desc" }, hero.abilityDesc || ""),
      ),
      hero.perk ? el("div", { class: "perk-badge" }, `${hero.perk.emoji} ${hero.perk.name}`) : null,
      el(
        "div",
        { class: "stats" },
        el("span", { class: "atk" }, `⚔️${stats.atk}`),
        el("span", { class: "hp" }, formatHpText(stats)),
      ),
    );
    return card;
  });

  if (frame.mindControl) {
    const mc = frame.mindControl;
    const mcClass = `card mind-control-active${fx.mcSlide ? " lunge-enemy" : ""}`;
    playerCards.push(
      el(
        "div",
        { class: mcClass, style: { borderColor: "#9b59b6" } },
        el(
          "div",
          { class: "badge-row" },
          el("div", { class: "tier-badge", style: { background: "#8e44ad" } }, "MIND CONTROL"),
          el("div", { class: "level-badge" }, `Turns: ${mc.turnsLeft}`),
        ),
        el("div", { class: "hero-name mc-name" }, `✨ ${mc.name}`),
        el("div", { class: "emoji" }, mc.emoji),
        el(
          "div",
          { class: "ability-box" },
          el("span", { class: "ability-title mc-title" }, "Controlled"),
          el("span", { class: "ability-desc" }, "Fighting for you"),
        ),
        el(
          "div",
          { class: "stats" },
          el("span", { class: "atk" }, `⚔️${mc.atk}`),
          el("span", { class: "hp" }, `❤️${mc.hp}/${mc.maxHp ?? mc.hp}`),
        ),
      ),
    );
  }

  fill(playerRoot, ...playerCards);

  const enemyCards = frame.enemies.map((enemy, index) => {
    const isFront = index === 0;
    let dmgNode = null;
    const splashHit = (fx.enemyHits || []).find((hit) => hit.idx === index);
    if (fx.specificEnemyIdx === index && fx.specificEnemyDmg != null) {
      dmgNode = el("div", { class: "dmg-text-center" }, `-${fx.specificEnemyDmg}`);
    } else if (splashHit && splashHit.dmg != null) {
      dmgNode = el("div", { class: "dmg-text-center" }, `-${splashHit.dmg}`);
    } else if (isFront && fx.enemyFrontDmg != null) {
      dmgNode = el("div", { class: "dmg-text-center" }, `-${fx.enemyFrontDmg}`);
    }
    const css = `card${isFront && fx.lungeEnemy ? " lunge-enemy" : ""}`;
    return el(
      "div",
      { class: css, style: { borderColor: "#e74c3c" } },
      dmgNode,
      el(
        "div",
        { class: "badge-row" },
        el("div", { class: "tier-badge tier-enemy" }, "Enemy"),
        el("div", { class: "level-badge" }, `Lvl ${enemy.level || 1}`),
      ),
      el("div", { class: "hero-name" }, enemy.name),
      el("div", { class: "emoji" }, enemy.emoji),
      el(
        "div",
        { class: "ability-box" },
        el("span", { class: "ability-title" }, enemy.ability ? "Ability:" : ""),
        el("span", { class: "ability-desc" }, enemyAbilityText(enemy)),
      ),
      el(
        "div",
        { class: "stats" },
        el("span", { class: "atk" }, `⚔️${enemy.atk}`),
        el("span", { class: "hp" }, `❤️${enemy.hp}/${enemy.maxHp ?? enemy.hp}`),
        enemy.armor > 0 ? el("span", { class: "armor-badge" }, `🛡️${enemy.armor}`) : null,
      ),
    );
  });

  fill(enemyRoot, ...enemyCards);
}

export function playBattleExpReveal(frame, snapshots) {
  return new Promise((resolve) => {
    if (!frame) {
      resolve();
      return;
    }
    const display = (snapshots || []).map((snap) => (snap ? { ...snap } : null));
    const step = () => {
      const leveling = new Set();
      let busy = false;
      display.forEach((shown, idx) => {
        if (!shown || shown.dead) return;
        const hero = state.party[idx];
        if (!hero) return;
        if (shown.level < hero.level) {
          const need = expToNextLevel(shown.level);
          const chunk = Math.max(1, Math.ceil((need || 1) / 10));
          shown.exp += chunk;
          if (shown.exp >= need) {
            shown.exp = 0;
            shown.level += 1;
            leveling.add(idx);
          }
          busy = true;
        } else if (shown.exp < (hero.exp || 0)) {
          const need = expToNextLevel(shown.level) || 1;
          const chunk = Math.max(1, Math.ceil(((hero.exp || 0) - shown.exp) / 8), Math.ceil(need / 16));
          shown.exp = Math.min(hero.exp || 0, shown.exp + chunk);
          busy = true;
        }
      });
      renderBattleFrame(frame, { expDisplay: display, leveling });
      if (busy) setTimeout(step, DELAY.expTick || 45);
      else setTimeout(resolve, leveling.size ? DELAY.levelUpHold || 700 : DELAY.expReveal || 280);
    };
    renderBattleFrame(frame, { expDisplay: display, leveling: new Set() });
    setTimeout(step, DELAY.expReveal || 280);
  });
}

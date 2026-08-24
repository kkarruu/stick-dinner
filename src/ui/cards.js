import { MAX_HERO_LEVEL } from "../data/constants.js";
import { state } from "../state/gameState.js";
import {
  calculateHeroStats,
  expToNextLevel,
  getHeroMaxEnergy,
  getHeroMaxMana,
  isHeroDead,
} from "../systems/heroes.js";
import { append, el } from "./dom.js";
import { allowDrop, bindDragSource, bindDropTarget } from "./dragDrop.js";

function expBar(hero) {
  if ((hero.level || 1) >= MAX_HERO_LEVEL) {
    return el("div", { class: "exp-container" }, el("span", { class: "max-text" }, "MAX LVL"));
  }
  const need = expToNextLevel(hero.level || 1);
  const current = hero.exp || 0;
  const pct = need > 0 ? Math.min(100, (current / need) * 100) : 0;
  return el(
    "div",
    { class: "exp-bar", title: `${current} / ${need} EXP` },
    el("div", { class: "exp-bar-fill", style: { width: `${pct}%` } }),
    el("span", { class: "exp-bar-label" }, `${current}/${need}`),
  );
}

function resourceBar(hero) {
  if (!state.manaModeActive || isHeroDead(hero)) return null;
  if (hero.hasEnergy) {
    const maxE = getHeroMaxEnergy(hero);
    const currentE = hero.currentEnergy || 0;
    const segs = [];
    for (let i = 0; i < maxE; i += 1) {
      segs.push(el("div", { class: `resource-segment${i < currentE ? " energy-filled" : ""}` }));
    }
    return el("div", { class: "resource-bar-container", title: `Energy: ${currentE}/${maxE}` }, ...segs);
  }
  if (hero.hasMana) {
    const maxM = getHeroMaxMana(hero);
    const currentM = hero.currentMana || 0;
    const segs = [];
    for (let i = 0; i < maxM; i += 1) {
      segs.push(el("div", { class: `resource-segment${i < currentM ? " mana-filled" : ""}` }));
    }
    return el("div", { class: "resource-bar-container", title: `Mana: ${currentM}/${maxM}` }, ...segs);
  }
  return null;
}

export function renderHeroCard(hero, { source, index, context = "shop", emptyText = "Empty Slot", onLevelClick } = {}) {
  if (!hero) {
    const slot = el("div", { class: "card empty-slot" }, emptyText);
    if (source === "party" || source === "sandboxPartySlot") {
      bindDropTarget(slot, { kind: source, index, context });
    }
    return slot;
  }

  const dead = isHeroDead(hero);
  const stats = calculateHeroStats(hero);
  const isShop = source === "shop" || source === "encounter" || source === "sandboxPoolHero";
  const cssClass = `${isShop ? "card shop-card" : "card party-card"}${dead ? " dead-card" : ""}`;
  const card = el("div", { class: cssClass, draggable: "true" });

  const levelBadge = el(
    "div",
    { class: onLevelClick ? "level-badge clickable" : "level-badge" },
    onLevelClick ? `Lvl ${hero.level} 🔄` : `Lvl ${hero.level || 1}`,
  );
  if (onLevelClick) {
    levelBadge.addEventListener("click", (event) => {
      event.stopPropagation();
      onLevelClick();
    });
  }

  append(
    card,
    el("div", { class: "badge-row" }, el("div", { class: "tier-badge" }, `Tier ${hero.tier || 1}`), levelBadge),
    el(
      "div",
      { class: "hero-name-row" },
      el("div", { class: "hero-name" }, dead ? "Dead" : hero.name),
      hero.armor ? el("div", { class: "armor-badge" }, `🛡️${hero.armor}`) : null,
    ),
    expBar(hero),
    resourceBar(hero),
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
      el("span", { class: "hp" }, dead ? "💀" : `❤️${stats.hp}`),
    ),
  );

  bindDragSource(card, source, index);
  if (source === "party" || source === "sandboxPartySlot") {
    bindDropTarget(card, { kind: source, index, context });
  }
  allowDrop(card);
  return card;
}

export function renderItemCard(
  item,
  { source, index, isFree = false, showCost = true, emptyText = "Empty", extraClass = "" } = {},
) {
  if (!item) {
    return el("div", { class: `item-card empty-slot${extraClass ? ` ${extraClass}` : ""}` }, emptyText);
  }
  const card = el("div", { class: `item-card${extraClass ? ` ${extraClass}` : ""}`, draggable: "true" });
  append(
    card,
    el("div", { class: "badge-row" }, el("div", { class: "tier-badge" }, `Tier ${item.tier}`)),
    el("div", { class: "hero-name" }, item.name),
    el("div", { class: "emoji", style: { margin: "5px 0" } }, item.emoji),
    el(
      "div",
      { class: "ability-box" },
      el("span", { class: "ability-title" }, item.title),
      el("span", { class: "ability-desc" }, item.desc),
    ),
    showCost
      ? el("div", { class: isFree ? "cost-label free" : "cost-label" }, isFree ? "FREE!" : "Cost: 2 💰")
      : null,
  );
  bindDragSource(card, source, index);
  return card;
}

export function renderInventorySlot(item, index) {
  const card = renderItemCard(item, {
    source: "inventory",
    index,
    showCost: false,
    emptyText: "Empty",
    extraClass: "inventory-slot",
  });
  bindDropTarget(card, { kind: "inventory", index });
  return card;
}

export function renderEnemyCard(
  enemy,
  { source, index, emptyText = "Empty Enemy", droppable = false, extraClass = "" } = {},
) {
  if (!enemy) {
    const slot = el("div", { class: "card empty-slot" }, emptyText);
    if (droppable) bindDropTarget(slot, { kind: "sandboxEnemySlot", index });
    return slot;
  }
  const card = el("div", {
    class: `card shop-card enemy-card${extraClass ? ` ${extraClass}` : ""}`,
    draggable: "true",
  });
  append(
    card,
    el("div", { class: "badge-row" }, el("div", { class: "tier-badge tier-enemy" }, "Enemy")),
    el("div", { class: "hero-name" }, enemy.name),
    el("div", { class: "emoji" }, enemy.emoji),
    el(
      "div",
      { class: "ability-box" },
      el("span", { class: "ability-title" }, enemy.ability ? "Ability:" : ""),
      el("span", { class: "ability-desc" }, enemy.ability === "SPLIT" ? "Splits" : "Standard"),
    ),
    el(
      "div",
      { class: "stats" },
      el("span", { class: "atk" }, `⚔️${enemy.atk}`),
      el("span", { class: "hp" }, `❤️${enemy.hp}`),
    ),
  );
  bindDragSource(card, source, index);
  if (droppable) bindDropTarget(card, { kind: "sandboxEnemySlot", index });
  return card;
}

export function renderSandboxPoolHero(hero, index) {
  const statsAtk = hero.baseAtk * state.statMultiplier;
  const statsHp = hero.baseHp * state.statMultiplier;
  const card = el("div", { class: "card shop-card sandbox-mini", draggable: "true" });
  append(
    card,
    el(
      "div",
      { class: "badge-row" },
      el("div", { class: "tier-badge" }, `Tier ${hero.tier}`),
      el("div", { class: "level-badge" }, "Lvl 1"),
    ),
    el("div", { class: "hero-name-row" }, el("div", { class: "hero-name" }, hero.name)),
    expBar(hero),
    resourceBar(hero),
    el("div", { class: "emoji" }, hero.emoji),
    el(
      "div",
      { class: "ability-box" },
      el("span", { class: "ability-title" }, hero.abilityTitle),
      el("span", { class: "ability-desc" }, hero.abilityDesc),
    ),
    el(
      "div",
      { class: "stats" },
      el("span", { class: "atk" }, `⚔️${statsAtk}`),
      el("span", { class: "hp" }, `❤️${statsHp}`),
    ),
  );
  bindDragSource(card, "sandboxPoolHero", index);
  return card;
}

export function renderDeadBodyPoolCard() {
  const card = el("div", { class: "card shop-card dead-card sandbox-mini", draggable: "true" });
  append(
    card,
    el(
      "div",
      { class: "badge-row" },
      el("div", { class: "tier-badge tier-dead" }, "Dead"),
      el("div", { class: "level-badge" }, "Lvl 1"),
    ),
    el("div", { class: "hero-name-row" }, el("div", { class: "hero-name" }, "Dead Body")),
    el("div", { class: "exp-container" }),
    el("div", { class: "emoji" }, "💀"),
    el(
      "div",
      { class: "ability-box" },
      el("span", { class: "ability-title" }, "Corpse"),
      el("span", { class: "ability-desc" }, "For Necro/Warlock"),
    ),
    el("div", { class: "stats" }, el("span", { class: "atk" }, "⚔️0"), el("span", { class: "hp" }, "💀")),
  );
  bindDragSource(card, "sandboxPoolDeadBody", 0);
  return card;
}

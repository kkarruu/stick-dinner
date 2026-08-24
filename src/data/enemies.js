export const ENEMY_POOL = [
  { name: "Slime", emoji: "🟢", atk: 1, hp: 1, level: 1, ai: "CHASE" },
  { name: "Goblin", emoji: "👺", atk: 1, hp: 1, level: 1, ai: "WANDER" },
  { name: "Spider", emoji: "🕷️", atk: 2, hp: 2, level: 1, ai: "WANDER" },
  { name: "Skeleton", emoji: "💀", atk: 2, hp: 3, level: 1, ai: "CHASE" },
  { name: "Minotaur", emoji: "🐂", atk: 4, hp: 5, level: 1, ai: "CHASE" },
  {
    name: "Gelatinous Cube",
    emoji: "🧊",
    atk: 3,
    hp: 6,
    level: 1,
    ability: "FEINT",
    ai: "CHASE",
    role: "FRONT",
  },
  {
    name: "Skeletal Archer",
    emoji: "🦴",
    atk: 3,
    hp: 3,
    level: 1,
    ability: "OPENING_SHOT",
    ai: "CHASE",
    role: "BACK",
  },
  { name: "Owlbear", emoji: "🐻", atk: 5, hp: 6, level: 1, ai: "CHASE" },
  { name: "Kobold", emoji: "🦎", atk: 3, hp: 3, level: 1, ai: "CHASE" },
  { name: "Spearman", emoji: "🔱", atk: 3, hp: 3, level: 1, ability: "REACH", ai: "CHASE", role: "FRONT" },
  { name: "Grave Rat", emoji: "🐀", atk: 2, hp: 2, level: 1, ability: "FAINT", ai: "CHASE", role: "FRONT" },
  { name: "Mana Wraith", emoji: "👻", atk: 2, hp: 4, level: 1, ability: "MANA_DRAIN", ai: "CHASE", role: "FRONT" },
  { name: "Cutthroat", emoji: "🩸", atk: 3, hp: 2, level: 1, ability: "BLEED", ai: "CHASE", role: "FRONT" },
  { name: "Quillbeast", emoji: "🦔", atk: 2, hp: 4, level: 1, ability: "THORNS", ai: "CHASE", role: "FRONT" },
  { name: "Ogre", emoji: "👹", atk: 4, hp: 5, level: 1, ability: "CRUSH", ai: "CHASE", role: "FRONT" },
  { name: "Night Bat", emoji: "🦇", atk: 2, hp: 2, level: 1, ability: "LIFESTEAL", ai: "CHASE", role: "FRONT" },
  { name: "Stalker", emoji: "🥷", atk: 3, hp: 2, level: 1, ability: "SNEAK", ai: "CHASE", role: "BACK" },
  { name: "Shield Bug", emoji: "🪲", atk: 1, hp: 3, level: 1, ability: "SHELL", ai: "CHASE", role: "FRONT", armor: 2 },
  { name: "Peacock", emoji: "🦚", atk: 1, hp: 3, level: 1, ability: "GROW", ai: "WANDER", role: "FRONT" },
];

export const TIER2_ABILITY_ENEMIES = ENEMY_POOL.filter(
  (enemy) => enemy.ability && enemy.ability !== "FEINT" && enemy.ability !== "OPENING_SHOT",
);

export function enemyAbilityText(enemy) {
  const text = {
    FEINT: "Feint - Splits into three 2/2 slimes",
    SPLIT: "Splits",
    OPENING_SHOT: "Start of Battle → Deal 1 damage to a random enemy",
    REACH: "Reach - Hits the next 2 heroes in line",
    FAINT: "Faint - Summon a minion with 50% of this unit's stats",
    MANA_DRAIN: "Mana Drain - Hitting a mana hero empties its mana bar",
    BLEED: "Bleed - Apply bleed (50% chance each turn to deal 1 HP, combat only)",
    THORNS: "Thorns - Deal 1 damage back when attacked",
    CRUSH: "Crush - Ignore armor",
    LIFESTEAL: "Lifesteal - Heal for HP dealt",
    SNEAK: "Sneak - Hits the backline hero",
    SHELL: "Shell - Starts with 2 armor",
    GROW: "Hurt - Gain +1 Attack when this unit takes damage",
  };
  return text[enemy?.ability] || "Standard";
}

export function getSpecialEnemy(name) {
  return ENEMY_POOL.find((enemy) => enemy.name === name);
}

export function cloneEnemy(template, extras = {}) {
  if (!template) return null;
  return {
    name: extras.name ?? template.name,
    emoji: extras.emoji ?? template.emoji,
    atk: extras.atk ?? template.atk,
    hp: extras.hp ?? template.hp,
    maxHp: extras.maxHp ?? extras.hp ?? template.hp,
    level: extras.level ?? template.level ?? 1,
    ability: extras.ability ?? template.ability ?? null,
    ai: extras.ai ?? template.ai ?? "CHASE",
    role: extras.role ?? template.role ?? "FRONT",
    armor: extras.armor ?? template.armor ?? 0,
    packId: extras.packId ?? template.packId ?? null,
  };
}

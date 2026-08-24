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
    ability: "SPLIT",
    ai: "CHASE",
  },
  { name: "Owlbear", emoji: "🐻", atk: 5, hp: 6, level: 1, ai: "CHASE" },
  { name: "Kobold", emoji: "🦎", atk: 3, hp: 3, level: 1, ai: "CHASE" },
];

const FLOOR_1_NAMES = ["Slime", "Goblin", "Kobold"];
const FLOOR_2_PLUS_NAMES = ["Skeleton", "Spider", "Minotaur"];

function byNames(names) {
  return names.map((name) => ENEMY_POOL.find((enemy) => enemy.name === name));
}

export function getDungeonMonsterPool(floor) {
  return floor >= 2 ? byNames(FLOOR_2_PLUS_NAMES) : byNames(FLOOR_1_NAMES);
}

export function cloneEnemy(template) {
  return {
    name: template.name,
    emoji: template.emoji,
    atk: template.atk,
    hp: template.hp,
    level: template.level || 1,
    ability: template.ability || null,
    ai: template.ai || "CHASE",
  };
}

import { GRID_HEIGHT, GRID_WIDTH } from "../data/constants.js";
import { cloneEnemy, ENEMY_POOL, TIER2_ABILITY_ENEMIES } from "../data/enemies.js";
import { state } from "../state/gameState.js";

function isObstacle(x, y) {
  return state.room.obstacles.some((obstacle) => obstacle.x === x && obstacle.y === y);
}

const GENERIC_MOBS = [
  { name: "Slime", emoji: "🟢", ai: "CHASE" },
  { name: "Goblin", emoji: "👺", ai: "WANDER" },
  { name: "Kobold", emoji: "🦎", ai: "CHASE" },
  { name: "Spider", emoji: "🕷️", ai: "WANDER" },
  { name: "Skeleton", emoji: "💀", ai: "CHASE" },
];

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function getRoomMobPlan(floor, roomIndex) {
  const safeFloor = Math.max(1, floor || 1);
  const room = Math.max(1, Math.min(10, roomIndex || 1));
  const t = (room - 1) / 9;
  const start = (safeFloor * (safeFloor + 1)) / 2;
  const end = start + safeFloor;
  const lo = Math.max(1, Math.round(start + t * (end - start)));
  const hi = Math.max(lo, Math.round(start + 1 + t * Math.max(0, end - start - 1)));
  const groupAfter = safeFloor === 1 ? 5 : safeFloor === 2 ? 3 : 2;
  const group = room < groupAfter ? 1 : randomInt(2, 3);
  return { minStat: lo, maxStat: hi, group };
}

function packSpots(origin, count) {
  const deltas = [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
    [2, 0],
    [0, 2],
  ];
  const spots = [];
  for (const [dx, dy] of deltas) {
    const x = origin.x + dx;
    const y = origin.y + dy;
    if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) continue;
    if (isObstacle(x, y)) continue;
    if (state.room.monsters.some((monster) => monster.x === x && monster.y === y)) continue;
    spots.push({ x, y });
    if (spots.length >= count) break;
  }
  return spots;
}

function makeGeneric(stat, extras = {}) {
  const look = GENERIC_MOBS[Math.floor(Math.random() * GENERIC_MOBS.length)];
  return cloneEnemy(
    {
      name: look.name,
      emoji: look.emoji,
      atk: stat,
      hp: stat,
      level: 1,
      ai: look.ai,
    },
    extras,
  );
}

export function spawnRoomMonsters(getSpawn, floor, roomIndex) {
  const plan = getRoomMobPlan(floor, roomIndex);
  const origin = getSpawn();
  const packId = `pack-${floor}-${roomIndex}-${Math.floor(Math.random() * 9999)}`;
  const spots = packSpots(origin, plan.group);
  const monsters = [];

  for (let i = 0; i < spots.length; i += 1) {
    const stat = randomInt(plan.minStat, plan.maxStat);
    const extras = { packId, role: "FRONT" };
    let monster = {
      ...spots[i],
      ...makeGeneric(stat, extras),
    };
    if (floor >= 2 && !monster.ability && Math.random() < 0.5 && TIER2_ABILITY_ENEMIES.length) {
      const spec = TIER2_ABILITY_ENEMIES[Math.floor(Math.random() * TIER2_ABILITY_ENEMIES.length)];
      monster = {
        ...monster,
        name: spec.name,
        emoji: spec.emoji,
        ability: spec.ability,
        role: spec.role || "FRONT",
        armor: spec.armor || 0,
      };
    }
    monsters.push(monster);
  }

  if (floor === 2 && roomIndex >= 3 && Math.random() < 0.45) {
    const spot = packSpots(origin, spots.length + 1).at(-1);
    const archer = ENEMY_POOL.find((enemy) => enemy.ability === "OPENING_SHOT");
    if (spot && archer) {
      const stat = Math.max(3, plan.minStat);
      monsters.push({
        ...spot,
        ...cloneEnemy(archer, { packId, role: "BACK", atk: stat, hp: stat }),
      });
    }
  }

  if (floor === 2 && roomIndex >= 8 && Math.random() < 0.7) {
    const cube = ENEMY_POOL.find((enemy) => enemy.ability === "FEINT");
    if (cube) {
      const spot = packSpots(origin, monsters.length + 1).at(-1) || getSpawn();
      monsters.push({
        ...spot,
        ...cloneEnemy(cube, { packId, role: "FRONT" }),
      });
    }
  }

  return monsters;
}

export function intendedMove(monster, head) {
  if (monster.ai === "CHASE") {
    const dx = Math.sign(head.x - monster.x);
    const dy = Math.sign(head.y - monster.y);
    if (Math.random() > 0.5) return { dx, dy: 0 };
    return { dx: 0, dy };
  }
  const dirs = [
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
  ];
  return dirs[Math.floor(Math.random() * dirs.length)];
}

export function moveMonsterPacks(head, isBlocked) {
  const packs = new Map();
  const singles = [];
  for (const monster of state.room.monsters) {
    if (monster.packId) {
      if (!packs.has(monster.packId)) packs.set(monster.packId, []);
      packs.get(monster.packId).push(monster);
    } else {
      singles.push(monster);
    }
  }

  const occupiedBy = (x, y, ignore) =>
    state.room.monsters.some((monster) => monster !== ignore && monster.x === x && monster.y === y);

  for (const group of packs.values()) {
    const leader = group[0];
    const step = intendedMove(leader, head);
    const dests = group.map((monster) => ({
      monster,
      x: monster.x + step.dx,
      y: monster.y + step.dy,
    }));
    const blocked = dests.some(
      (dest) =>
        isBlocked(dest.x, dest.y) ||
        occupiedBy(
          dest.x,
          dest.y,
          group.find((member) => member.x === dest.x && member.y === dest.y),
        ),
    );
    const overlap = dests.some((dest, idx) =>
      dests.some((other, otherIdx) => idx !== otherIdx && dest.x === other.x && dest.y === other.y),
    );
    if (!blocked && !overlap) {
      dests.forEach((dest) => {
        dest.monster.x = dest.x;
        dest.monster.y = dest.y;
      });
    }
  }

  for (const monster of singles) {
    const step = intendedMove(monster, head);
    const tx = monster.x + step.dx;
    const ty = monster.y + step.dy;
    if (!isBlocked(tx, ty) && !occupiedBy(tx, ty, monster)) {
      monster.x = tx;
      monster.y = ty;
    }
  }
}

import { FLOOR_THEMES, TILE_SIZE } from "../data/constants.js";
import { state } from "../state/gameState.js";
import { $ } from "./dom.js";

let canvas;
let ctx;

export function initDungeonCanvas() {
  canvas = $("gameCanvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");
}

export function focusDungeon() {
  canvas?.focus();
}

export function drawGridDungeon() {
  if (!ctx || !canvas) initDungeonCanvas();
  if (!ctx || !canvas) return;

  const theme = FLOOR_THEMES[Math.min(4, state.dungeonFloor)];
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = theme.wall;
  for (const obstacle of state.room.obstacles) {
    ctx.fillRect(obstacle.x * TILE_SIZE + 4, obstacle.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
  }

  for (const door of state.room.doors) {
    ctx.fillStyle = door.color;
    ctx.fillRect(door.x * TILE_SIZE + 6, door.y * TILE_SIZE + 6, TILE_SIZE - 12, TILE_SIZE - 12);
  }

  for (const shop of state.room.shops) {
    ctx.fillStyle = shop.color;
    ctx.fillRect(shop.x * TILE_SIZE + 4, shop.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
  }

  if (state.room.chest && !state.room.chest.collected) {
    ctx.fillStyle = state.room.chest.color;
    ctx.fillRect(
      state.room.chest.x * TILE_SIZE + 8,
      state.room.chest.y * TILE_SIZE + 8,
      TILE_SIZE - 16,
      TILE_SIZE - 16,
    );
  }

  if (state.room.crate && !state.room.crate.collected) {
    ctx.fillStyle = state.room.crate.color;
    ctx.fillRect(
      state.room.crate.x * TILE_SIZE + 10,
      state.room.crate.y * TILE_SIZE + 10,
      TILE_SIZE - 20,
      TILE_SIZE - 20,
    );
  }

  if (state.room.traveler && !state.room.traveler.collected) {
    ctx.fillStyle = state.room.traveler.color;
    ctx.fillRect(
      state.room.traveler.x * TILE_SIZE + 6,
      state.room.traveler.y * TILE_SIZE + 6,
      TILE_SIZE - 12,
      TILE_SIZE - 12,
    );
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "🧙",
      state.room.traveler.x * TILE_SIZE + TILE_SIZE / 2,
      state.room.traveler.y * TILE_SIZE + TILE_SIZE / 2,
    );
  }

  ctx.font = "24px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const monster of state.room.monsters) {
    ctx.fillText(monster.emoji, monster.x * TILE_SIZE + TILE_SIZE / 2, monster.y * TILE_SIZE + TILE_SIZE / 2);
  }

  for (const part of state.playerSnake) {
    ctx.fillStyle = "rgba(26, 188, 156, 0.2)";
    ctx.fillRect(part.x * TILE_SIZE + 2, part.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.strokeStyle = "#1abc9c";
    ctx.lineWidth = 2;
    ctx.strokeRect(part.x * TILE_SIZE + 2, part.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.globalAlpha = 1;
    ctx.fillText(
      part.heroRef ? part.heroRef.emoji : "🧙‍♂️",
      part.x * TILE_SIZE + TILE_SIZE / 2,
      part.y * TILE_SIZE + TILE_SIZE / 2,
    );
  }
}

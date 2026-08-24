import { SCREEN } from "../../data/constants.js";
import { state } from "../../state/gameState.js";
import { addGold } from "../shop.js";
import { grantPartyBattleExp, livingPartyCount, snapshotPartyExp } from "../heroes.js";
import { logDebug } from "../debug.js";
import { simulateBattle } from "./engine.js";
import { setPlaybackAutoplay, startPlayback, stepBackward, stepForward, stopPlayback } from "./playback.js";
import { refresh } from "../../ui/refresh.js";
import { renderBattleFrame, playBattleExpReveal } from "../../ui/battleView.js";
import { $ } from "../../ui/dom.js";
import { showScreen } from "../../ui/screens.js";
import { drawGridDungeon, focusDungeon } from "../../ui/dungeonCanvas.js";

function applyPartyUpdates(partyList, updates) {
  for (const update of updates) {
    const hero = partyList[update.index];
    if (!hero) continue;
    hero.permanentDamage = update.permanentDamage;
    hero.armor = update.armor;
    hero.currentMana = update.currentMana;
    hero.currentEnergy = update.currentEnergy;
    hero.currentRage = update.currentRage ?? hero.currentRage;
    hero.perk = update.perk;
  }
}

function persistBattle(result, { grantExp = true } = {}) {
  if (state.pendingBattleResult?.applied) return;
  if (!state.isSandboxBattle) {
    applyPartyUpdates(state.party, result.partyUpdates);
    if (grantExp && result.battleExp) {
      grantPartyBattleExp(state.party, result.battleExp);
      logDebug(`[EXP] Living party gained ${result.battleExp} battle EXP.`);
    }
    addGold(result.goldReward);
    addGold(result.thiefGold || 0);
    for (const idx of state.activeEnemyIndices) {
      if (state.room.monsters[idx]) state.room.monsters[idx].hp = 0;
    }
    state.room.monsters = state.room.monsters.filter((monster) => monster.hp > 0);
  }
  if (state.pendingBattleResult) state.pendingBattleResult.applied = true;
}

export function beginBattle({ enemies, sourceParty, isSandbox, monsterIndices = [] }) {
  stopPlayback();
  state.currentState = SCREEN.BATTLE;
  state.isSandboxBattle = !!isSandbox;
  state.inBattleTransition = true;
  state.activeEnemyIndices = monsterIndices;
  showScreen(SCREEN.BATTLE);
  const returnBtn = $("battle-return-btn");
  if (returnBtn) {
    returnBtn.style.display = "none";
    returnBtn.textContent = isSandbox ? "Return to Sandbox" : "Return to Dungeon";
  }

  const { frames, result } = simulateBattle({
    playerParty: sourceParty,
    enemies,
    manaMode: state.manaModeActive,
    statMultiplier: state.statMultiplier,
  });
  state.pendingBattleResult = { applied: false, result };

  const title = $("battle-title");
  if (title) title.textContent = "BATTLE INITIATED!";

  let lastFrame = null;
  startPlayback(frames, {
    autoplay: state.autoplayActive,
    onFrame(frame, index, total) {
      lastFrame = frame;
      if (frame.title && title) title.textContent = frame.title;
      renderBattleFrame(frame);
      const indicator = $("vcr-step-indicator");
      if (indicator) indicator.textContent = `Step ${index + 1} / ${total}`;
    },
    onDone(result) {
      persistBattle(result, { grantExp: false });
      if (title) title.textContent = result.message;
      const finishUi = () => {
        if (returnBtn) returnBtn.style.display = "block";
        refresh();
      };
      if (state.isSandboxBattle || !result.battleExp) {
        finishUi();
        return;
      }
      const snaps = snapshotPartyExp(state.party);
      grantPartyBattleExp(state.party, result.battleExp);
      logDebug(`[EXP] Living party gained ${result.battleExp} battle EXP.`);
      playBattleExpReveal(lastFrame, snaps).then(finishUi);
    },
  });
}

export function toggleAutoplay(enabled) {
  state.autoplayActive = enabled;
  const vcr = $("vcr-step-controls");
  if (vcr) vcr.style.display = enabled ? "none" : "flex";
  if (state.currentState === SCREEN.BATTLE) setPlaybackAutoplay(enabled);
}

export function vcrNext() {
  stepForward();
}

export function vcrPrev() {
  stepBackward();
}

export function returnFromBattle() {
  stopPlayback();
  if (state.pendingBattleResult && !state.pendingBattleResult.applied) {
    const last = state.pendingBattleResult;
    if (last.result) persistBattle(last.result);
  }

  const returnBtn = $("battle-return-btn");
  if (returnBtn) returnBtn.style.display = "none";

  if (state.isSandboxBattle) {
    state.currentState = SCREEN.SANDBOX;
    showScreen(SCREEN.SANDBOX);
    refresh();
    return;
  }

  state.inBattleTransition = false;
  if (state.hardcoreModeActive && livingPartyCount(state.party) === 0 && state.party.some(Boolean)) {
    state.currentState = SCREEN.GAMEOVER;
    showScreen(SCREEN.GAMEOVER);
    refresh();
    return;
  }

  state.currentState = SCREEN.DUNGEON;
  showScreen(SCREEN.DUNGEON);
  focusDungeon();
  drawGridDungeon();
  refresh();
}

export function resetCombat() {
  stopPlayback();
}

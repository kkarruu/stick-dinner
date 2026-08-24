let timer = null;
let frames = [];
let index = 0;
let completed = false;
let listeners = {
  onFrame: () => {},
  onDone: () => {},
};

function currentFrame() {
  return frames[index] || null;
}

function notify() {
  const frame = currentFrame();
  if (!frame) return;
  listeners.onFrame(frame, index, frames.length);
  if (frame.result && !completed) {
    completed = true;
    stopTimer();
    listeners.onDone(frame.result);
  }
}

function stopTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function queueAdvance() {
  stopTimer();
  const frame = currentFrame();
  if (!frame || frame.result || index >= frames.length - 1) return;
  timer = setTimeout(() => {
    index += 1;
    notify();
    if (!completed) queueAdvance();
  }, frame.fx?.delay ?? 800);
}

export function stopPlayback() {
  stopTimer();
}

export function startPlayback(battleFrames, { autoplay, onFrame, onDone }) {
  stopPlayback();
  frames = battleFrames || [];
  index = 0;
  completed = false;
  listeners = { onFrame, onDone };
  if (frames.length === 0) return;
  notify();
  if (autoplay && !completed) queueAdvance();
}

export function setPlaybackAutoplay(autoplay) {
  if (autoplay) {
    if (!completed) queueAdvance();
  } else {
    stopTimer();
  }
}

export function stepForward() {
  stopTimer();
  if (index < frames.length - 1) {
    index += 1;
    notify();
  }
}

export function stepBackward() {
  stopTimer();
  if (index > 0) {
    index -= 1;
    listeners.onFrame(currentFrame(), index, frames.length);
  }
}

export function getPlaybackIndex() {
  return index;
}

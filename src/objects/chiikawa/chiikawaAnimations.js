// chiikawaAnimations.js

// --- Base Frame Calculation Functions ---

// Standing/Idle frames (200ms per frame for a slower idle).
const makeStandingFrames = (startFrame, count) => ({
  duration: count * 200, // 200ms per frame
  frames: Array.from({ length: count }, (_, i) => ({
    time: i * 200,
    frame: startFrame + i
  }))
});

// Walking/Fast transition frames (100ms per frame).
const makeWalkingFrames = (startFrame, count) => {
  const frameDuration = 100;
  const duration = count * frameDuration;
  return {
    duration: duration,
    frames: Array.from({ length: count }, (_, i) => ({
      time: i * frameDuration,
      frame: startFrame + i
    }))
  };
};

// --- STANDARD MOVEMENTS ---

// STANDING: Frames 1 through 8.
export const STAND_RIGHT = makeStandingFrames(0, 8);
export const STAND_LEFT = STAND_RIGHT;

// WALKING: Frames 9-24.
export const WALK_RIGHT = makeWalkingFrames(9, 16);
export const WALK_LEFT = WALK_RIGHT;

// PICK_UP: (Using first standing frame, frame 1)
export const PICK_UP_RIGHT = { duration: 400, frames: [{ time: 0, frame: 1 }] };
export const PICK_UP_LEFT = PICK_UP_RIGHT;

// --- COMMAND ANIMATIONS ---

// SIT (Transition to sit): Frames 25 through 32. Uses 100ms frames (800ms total).
export const SIT = makeWalkingFrames(25, 32); 

// SIT_IDLE (Static last frame of sitting animation): Frame 32.
export const SIT_IDLE = { 
    duration: 100, // Duration is arbitrary for a single frame
    frames: [{ time: 0, frame: 32 }] 
};

// SIT_TO_STAND: Frames 33 through 40.
export const SIT_TO_STAND = makeWalkingFrames(33, 40); // 800ms total duration

// CRY: Frame definitions unchanged.
export const CRY = {
  duration: 800,
  frames: [
    { time: 0, frame: 14 },
    { time: 200, frame: 15 },
    { time: 400, frame: 14 },
    { time: 600, frame: 16 }
  ]
};

// DANCE: Frame definitions unchanged.
export const DANCE = {
  duration: 640,
  frames: [
    { time: 0, frame: 21 }, { time: 80, frame: 22 },
    { time: 160, frame: 23 }, { time: 240, frame: 22 },
    { time: 320, frame: 21 }, { time: 400, frame: 20 },
    { time: 480, frame: 19 }, { time: 560, frame: 20 }
  ]
};
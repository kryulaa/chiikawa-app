// Standing frames (1–8 on sheet, only RIGHT used, LEFT mirrored)
const makeStandingFrames = (startFrame = 0, count = 8) => ({
  duration: 1600, // doubled from 800 → idle twice as slow
  frames: Array.from({ length: count }, (_, i) => ({
    time: i * 200, // spread frames evenly over duration
    frame: startFrame + i
  }))
});

// Walking frames (rest of sheet after 8)
const makeWalkingFrames = (startFrame = 8, count = 4) => ({
  duration: 400, // keep as is
  frames: Array.from({ length: count }, (_, i) => ({
    time: i * 100,
    frame: startFrame + i
  }))
});

// RIGHT frames
export const STAND_RIGHT = makeStandingFrames(0, 8); // frames 0–7 in sheet
export const STAND_LEFT = STAND_RIGHT; // mirrored

export const WALK_RIGHT = makeWalkingFrames(8, 4); // frames 8–11 in sheet
export const WALK_LEFT = WALK_RIGHT; // mirrored

// PICK_UP frames (use first standing frame as placeholder, mirrored for LEFT)
export const PICK_UP_RIGHT = { duration: 400, frames: [{ time: 0, frame: 0 }] };
export const PICK_UP_LEFT = PICK_UP_RIGHT; // mirrored

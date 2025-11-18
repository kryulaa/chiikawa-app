import { resources } from '../core/Resources.js';
import { Sprite } from '../core/Sprite.js';
import { Vector2 } from '../core/Vector2.js';
import { FrameIndexPattern } from '../core/FrameIndexPattern.js';
import { Animations } from '../core/Animations.js';
import { STAND_RIGHT, WALK_RIGHT, WALK_LEFT, STAND_LEFT, CRY, DANCE, SIT, SIT_LOOP, SIT_TO_STAND } from './objects/chiikawa/chiikawaAnimations.js';

// SPRITES
export const waterSprite = new Sprite({ resource: resources.images.water, frameSize: new Vector2(720, 480) });
export const islandSprite = new Sprite({ resource: resources.images.island, frameSize: new Vector2(720, 480) });
export const chiikawaSprite = new Sprite({ resource: resources.images.chiikawa, frameSize: new Vector2(64, 64), hFrames: 7, vFrames: 11 });
export const shadow = new Sprite({ resource: resources.images.chiikawa_shadow, frameSize: new Vector2(64, 64) });


// --- ANIMATION CREATION FUNCTION ---
export function createChiikawaAnimations() {
    return new Animations({
        // Standard Movements
        standRight: new FrameIndexPattern(STAND_RIGHT),
        walkRight: new FrameIndexPattern(WALK_RIGHT),
        standLeft: new FrameIndexPattern(STAND_LEFT),
        walkLeft: new FrameIndexPattern(WALK_LEFT), 
        
        // Command Animations
        cry: new FrameIndexPattern(CRY),
        dance: new FrameIndexPattern(DANCE), 
        sit: new FrameIndexPattern(SIT),
        sitLoop: new FrameIndexPattern(SIT_LOOP), 
        sitToStand: new FrameIndexPattern(SIT_TO_STAND), 
    });
}

// Local player gets its own independent Animations instance.
chiikawaSprite.animations = createChiikawaAnimations();
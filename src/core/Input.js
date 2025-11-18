// ./src/Input.js

export class Input {
    constructor() {
        this.heldDirections = [];

        // Maps physical key press names to canonical game direction strings
        this.keyMap = {
            "ArrowUp": "UP",
            "w": "UP",
            "ArrowDown": "DOWN",
            "s": "DOWN",
            "ArrowLeft": "LEFT", 
            "a": "LEFT",
            "ArrowRight": "RIGHT",
            "d": "RIGHT",
        };
    }

    get direction() {
        return this.heldDirections[0];
    }

    pressKey(key) {
        const dir = this.keyMap[key];
        if (dir && !this.heldDirections.includes(dir)) {
            this.heldDirections.unshift(dir);
        }
    }

    releaseKey(key) {
        const dir = this.keyMap[key];
        const index = this.heldDirections.indexOf(dir);
        if (index > -1) {
            this.heldDirections.splice(index, 1);
        }
    }
}
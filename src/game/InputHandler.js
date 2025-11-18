import { chatBubble } from '../multiplayer/PlayerSetup.js';
import { input, COMMAND_MAP } from './GameLoopLogic.js';
import { sendChatMessage } from '../multiplayer/Networking.js';

// The function window.setCommandAnimation is defined in main.js
// We call it directly on the window object.

window.addEventListener("keydown", (e) => {
    
    if (e.key === "Enter") {
        if (!chatBubble.isTyping) {
            // State 1: Not typing, press Enter -> Start typing
            chatBubble.startTyping(); 
        }
        else {
            // State 2: Currently typing
            
            if (chatBubble.message.length === 0) {
                chatBubble.sendMessage(); // Exit typing mode
                e.preventDefault();
                return;
            }

            const commandKey = chatBubble.message.toLowerCase();
            let commandAnimation = COMMAND_MAP[commandKey];
            
            if (commandAnimation) {
                // Command detected!
                chatBubble.setMessage(chatBubble.message); 

                // Use the global setter function defined in main.js
                window.setCommandAnimation(commandAnimation, 0); 
                
                chatBubble.message = ""; // Clear the message buffer
                chatBubble.sendMessage(); // Set isTyping to false
            } else {
                // Send the message
                sendChatMessage(chatBubble.message);
                chatBubble.sendMessage(); 
            }
        }
        e.preventDefault();
        return;
    }

    if (chatBubble.isTyping) {
        chatBubble.handleKey(e.key);
        e.preventDefault();
        return;
    }

    input.pressKey?.(e.key);
});

window.addEventListener("keyup", (e) => {
    input.releaseKey?.(e.key);
});
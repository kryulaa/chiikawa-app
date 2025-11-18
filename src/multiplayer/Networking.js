import { supabase } from '../../supabaseClient.js';
import { myId, myName, otherPlayers, chatBubble } from './PlayerSetup.js';

let lastChatTimestamp = null;

export async function sendChatMessage(message) {
    if (!message) return;
    try {
        await supabase.from("chat").insert([{
            player_id: myId,
            name: myName,
            message: message
        }]);
    } catch (err) {
        console.error("Supabase chat insert error:", err);
    }
}

export async function fetchChats() {
    try {
        let query = supabase.from("chat").select("*").order("created_at", { ascending: true });
        if (lastChatTimestamp) query = query.gt("created_at", lastChatTimestamp);

        const { data, error } = await query;
        if (error) return console.error("Supabase fetch chat error:", error);

        data?.forEach(c => {
            const player = otherPlayers.find(p => p.id === c.player_id) || (c.player_id === myId ? { chat: chatBubble } : null);
            
            if (player && player.chat) {
                player.chat.setMessage(c.message); 
            }
        });

        if (data?.length) lastChatTimestamp = data[data.length - 1].created_at;
    } catch (err) {
        console.error("Supabase chat fetch error:", err);
    }
}

// Start polling for chats
setInterval(fetchChats, 200);
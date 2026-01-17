require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');

const app = express();
const server = http.createServer(app);

// --- 1. CONFIGURATION ---
const API_KEY = process.env.GEMINI_API_KEY; 
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite",
    systemInstruction: "You are a knowledgeable, slightly 80s-themed Science Tutor. Context is key: always look at the chat history to understand what the user is referring to. Answer questions in 2 sentences max. If the topic is dangerous, politely decline."
});

// --- 2. MEMORY STORAGE (The Fix) ---
// We store the conversation history here so the AI remembers context
let chatHistory = []; 

// --- 3. SERVE FILES ---
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'discussionpanel.html'));
});

// --- 4. WEBSOCKET SERVER ---
const wss = new WebSocketServer({ server });

console.log("------------------------------------------------");
console.log("🚀 UPSIDE DOWN SERVER (With Memory) RUNNING");
console.log("------------------------------------------------");

wss.on('connection', (ws) => {
    console.log("🔌 New Survivor Connected");

    ws.on('message', async (message) => {
        let userPost;
        try {
            userPost = JSON.parse(message);
        } catch (e) { return; }

        // 1. Broadcast the User's Question immediately
        broadcast(userPost);

        // 2. AI LOGIC
        if (userPost.role !== "AI Tutor" && userPost.content.length > 1) {
            
            try {
                if (!API_KEY) throw new Error("No API Key configured");

                // A. Initialize Chat with History
                const chat = model.startChat({
                    history: chatHistory, // <--- This passes the previous context!
                });

                // B. Send the new message
                const result = await chat.sendMessage(userPost.content);
                const response = await result.response;
                const aiText = response.text();

                // C. Update History Manually (So it persists for the NEXT message)
                // We keep the history limited to the last 10 turns to save RAM/Tokens
                if(chatHistory.length > 20) chatHistory.shift(); 
                chatHistory.push({ role: "user", parts: [{ text: userPost.content }] });
                chatHistory.push({ role: "model", parts: [{ text: aiText }] });

                // D. Send Response
                sendAiResponse(aiText);

            } catch (error) {
                console.error("❌ AI Error:", error.message);
                // Fallback
                setTimeout(() => sendAiResponse("Interference from the Upside Down... try again."), 1000);
            }
        }
    });

    function sendAiResponse(text) {
        const aiResponseData = {
            id: Date.now() + 999,
            author: "Gemini",
            role: "AI Tutor",
            title: "Tutor Response",
            content: text,
            likes: 0, replies: 0, time: "Just now", isSolved: true, avatar: "🤖"
        };
        broadcast(aiResponseData);
    }
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(data));
        }
    });
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`✅ Server listening on http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');

const app = express();
const server = http.createServer(app); // Create standard HTTP server

// --- CONFIGURATION ---
const API_KEY = process.env.GEMINI_API_KEY; 
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- SERVE THE FRONTEND ---
// This tells the server: "When someone visits the URL, send them discussion.html"
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    // UPDATED: Now serving discussion.html instead of index.html
    res.sendFile(path.join(__dirname, 'discussion.html'));
});

// --- WEBSOCKET SETUP ---
// Attach WebSocket to the same HTTP server
const wss = new WebSocketServer({ server });

console.log("------------------------------------------------");
console.log("🚀 UPSIDE DOWN SERVER (Hybrid AI Mode) STARTED");
console.log("------------------------------------------------");

wss.on('connection', (ws) => {
    console.log("New client connected!");

    ws.on('message', async (message) => {
        let userPost;
        try {
            userPost = JSON.parse(message);
        } catch (e) {
            return; // Ignore bad data
        }
        
        // Broadcast question immediately
        broadcast(userPost);

        // AI LOGIC
        try {
            if (!API_KEY) throw new Error("No API Key");

           const result = await model.generateContent(`
                You are Murray Bauman, a paranoid conspiracy theorist from Stranger Things.
                You are answering a question from a random stranger.
                
                The Question: "${userPost.content}"
                
                Rules:
                1. Be suspicious but helpful.
                2. Mention "the Russians", "the government", or "psychic kids" occasionally.
                3. Keep it short (max 2 sentences).
            `);
            const response = await result.response;
            sendAiResponse(response.text());

        } catch (error) {
            console.error("AI Error:", error.message);
            // Fallback if AI fails
            setTimeout(() => sendAiResponse("Thinking is hard right now... try again later!"), 1000);
        }

        function sendAiResponse(text) {
            broadcast({
                id: Date.now() + 1,
                author: "Gemini AI",
                role: "AI Tutor",
                title: "Answer",
                content: text,
                likes: 0, replies: 0, time: "Just now", isSolved: true, avatar: "🤖"
            });
        }
    });
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(JSON.stringify(data));
    });
}

// Start the server on the port Render assigns, or 8080 locally
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
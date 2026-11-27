import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();

const server = createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files
app.use(express.static(path.join(__dirname, "people")));

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "people", "index.html"));
});

// Socket.IO connection
io.on("connection", (socket) => {

    console.log("A user connected:", socket.id);

    // LOGIN EVENT
    socket.on("login", (name) => {

        // If already logged in, don't accept another login
        if (socket.username) return;

        const username = String(name).trim().slice(0, 30);

        if (!username) {
            socket.emit("loginError", "Please enter a valid name");
            return;
        }

        // Store username on this user's socket
        socket.username = username;

        console.log(username + " logged in");

        // Inform this user that login was successful
        socket.emit("loginSuccess", username);
    });

    // MESSAGE EVENT
    socket.on("message", (message) => {

        // User must login before sending messages
        if (!socket.username) return;

        const cleanMessage = String(message).trim().slice(0, 1000);

        if (!cleanMessage) return;

        const chatData = {
            username: socket.username,
            message: cleanMessage,
            senderId: socket.id
        };

        console.log(chatData.username + ": " + chatData.message);

        // Send message to all connected users
        io.emit("message", chatData);
    });

    // DISCONNECT EVENT
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });

});

// Start server
server.listen(3000, () => {
    console.log("Server running at PORT 3000");
});

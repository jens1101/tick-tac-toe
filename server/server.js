const express = require("express");
const path = require("path");
const http = require("http");
const socket = require("socket.io");

const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app);
const io = socket(server, {});

// Set static folder
app.use(express.static(path.join(__dirname, "../", "public")));

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle new socket connection requests from client
io.on("connection", (socket) => {
  console.log("New web socket connection!");
});

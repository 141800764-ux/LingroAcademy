// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Enable CORS so anyone can connect from any network
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store users: { userId: socketId }
const users = {};

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  // Register a teacher or student
  socket.on("register", id => {
    users[id] = socket.id;
    console.log("Registered:", id);
  });

  // Teacher calls student
  socket.on("call-user", ({ from, to, offer }) => {
    if (users[to]) {
      io.to(users[to]).emit("incoming-call", { from, offer });
    } else {
      socket.emit("user-not-found", to);
    }
  });

  // Student answers call
  socket.on("answer-call", ({ to, answer }) => {
    if (users[to]) {
      io.to(users[to]).emit("call-answered", { answer });
    }
  });

  // Exchange ICE candidates for WebRTC
  socket.on("ice-candidate", ({ to, candidate }) => {
    if (users[to]) {
      io.to(users[to]).emit("ice-candidate", { candidate });
    }
  });

  // Send lesson data from teacher to student
  socket.on("lesson-data", ({ to, data }) => {
    if (users[to]) {
      io.to(users[to]).emit("lesson-data", data);
    }
  });

  // Remove user from list when they disconnect
  socket.on("disconnect", () => {
    for (const id in users) {
      if (users[id] === socket.id) {
        delete users[id];
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

// Serve static files (teacher.html, student.html, etc.)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});

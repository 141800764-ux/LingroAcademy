const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST"] }
});

// Store users
const users = {};

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("register", id => { users[id] = socket.id; console.log("Registered:", id); });

  socket.on("call-user", ({ from, to, offer }) => {
    if(users[to]) io.to(users[to]).emit("incoming-call",{ from, offer });
    else socket.emit("user-not-found", to);
  });

  socket.on("answer-call", ({ to, answer }) => { if(users[to]) io.to(users[to]).emit("call-answered",{ answer }); });

  socket.on("ice-candidate", ({ to, candidate }) => { if(users[to]) io.to(users[to]).emit("ice-candidate",{ candidate }); });

  socket.on("lesson-data", ({ to, data }) => { if(users[to]) io.to(users[to]).emit("lesson-data", data); });

  socket.on("disconnect", ()=>{
    for(const id in users) if(users[id]===socket.id) delete users[id];
    console.log("User disconnected:", socket.id);
  });
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>console.log(`Signaling server running on port ${PORT}`));

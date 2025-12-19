const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve static files (teacher.html, student.html, etc.)
app.use(express.static(__dirname));

let teacherSocket = null;
let students = {}; // socketId → socket

io.on("connection", socket => {
    console.log("Connected:", socket.id);

    // Register as teacher
    socket.on("register-teacher", () => {
        teacherSocket = socket;
        console.log("Teacher registered:", socket.id);
        socket.emit("student-list", Object.keys(students));
    });

    // Register as student
    socket.on("register-student", () => {
        students[socket.id] = socket;
        console.log("Student registered:", socket.id);
        if (teacherSocket) {
            teacherSocket.emit("student-list", Object.keys(students));
        }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
        delete students[socket.id];
        if (teacherSocket?.id === socket.id) teacherSocket = null;
        teacherSocket?.emit("student-list", Object.keys(students));
    });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve static files (teacher.html, student.html, etc.)
app.use(express.static(__dirname));

// Keep track of teacher and students
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

    // Teacher calls a student
    socket.on("call-student", studentId => {
        if (students[studentId]) {
            students[studentId].emit("incoming-call", socket.id);
        }
    });

    // WebRTC signaling (offer/answer/ICE)
    socket.on("offer", data => socket.broadcast.emit("offer", data));
    socket.on("answer", data => teacherSocket?.emit("answer", data));
    socket.on("ice-candidate", candidate => socket.broadcast.emit("ice-candidate", candidate));

    // Teacher shares lesson
    socket.on("share-lesson", lesson => {
        Object.values(students).forEach(s => s.emit("share-lesson", lesson));
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
        delete students[socket.id];
        if (teacherSocket?.id === socket.id) teacherSocket = null;
        teacherSocket?.emit("student-list", Object.keys(students));
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

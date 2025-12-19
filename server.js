const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

let teacherSocket = null;
let students = {}; // socketId → socket

io.on("connection", socket => {
    console.log("Connected:", socket.id);

    socket.on("register-teacher", () => {
        teacherSocket = socket;
        socket.emit("student-list", Object.keys(students));
    });

    socket.on("register-student", () => {
        students[socket.id] = socket;
        if (teacherSocket) {
            teacherSocket.emit("student-list", Object.keys(students));
        }
    });

    socket.on("call-student", studentId => {
        if (students[studentId]) {
            students[studentId].emit("incoming-call");
        }
    });

    socket.on("offer", offer => socket.broadcast.emit("offer", offer));
    socket.on("answer", answer => teacherSocket?.emit("answer", answer));
    socket.on("ice-candidate", c => socket.broadcast.emit("ice-candidate", c));

    socket.on("share-lesson", lesson => {
        Object.values(students).forEach(s =>
            s.emit("share-lesson", lesson)
        );
    });

    socket.on("disconnect", () => {
        delete students[socket.id];
        if (teacherSocket?.id === socket.id) teacherSocket = null;
        teacherSocket?.emit("student-list", Object.keys(students));
    });
});

server.listen(3000, () =>
    console.log("Server running on http://localhost:3000")
);

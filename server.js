const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // allow any origin for testing
});

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

let teacherSocket = null;
let studentSockets = [];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('register-teacher', () => {
        teacherSocket = socket;
        console.log('Teacher registered:', socket.id);
    });

    socket.on('register-student', () => {
        studentSockets.push(socket);
        console.log('Student registered:', socket.id);
    });

    socket.on('call-start', () => {
        studentSockets.forEach(s => s.emit('call-start'));
    });

    socket.on('offer', (offer) => {
        studentSockets.forEach(s => s.emit('offer', offer));
    });

    socket.on('answer', (answer) => {
        if(teacherSocket) teacherSocket.emit('answer', answer);
    });

    socket.on('ice-candidate', (candidate) => {
        socket.broadcast.emit('ice-candidate', candidate);
    });

    socket.on('share-lesson', (lesson) => {
        studentSockets.forEach(s => s.emit('share-lesson', lesson));
    });

    socket.on('disconnect', () => {
        studentSockets = studentSockets.filter(s => s.id !== socket.id);
        if(teacherSocket && teacherSocket.id === socket.id) teacherSocket = null;
    });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));

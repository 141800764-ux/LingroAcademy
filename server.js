const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static(__dirname));

let teacherSocket = null;
let studentSockets = []; // {id: socket.id, socket: socket, callId: string}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('register-teacher', () => {
        teacherSocket = socket;
        console.log('Teacher registered:', socket.id);
    });

    socket.on('register-student', () => {
        studentSockets.push({id: socket.id, socket: socket, callId: ""});
        console.log('Student registered:', socket.id);
    });

    // Student registers their call ID
    socket.on('register-call-id', (callId) => {
        const student = studentSockets.find(s => s.id === socket.id);
        if(student) student.callId = callId;
        console.log(`Student ${socket.id} registered call ID: ${callId}`);
    });

    // Teacher calls student by call ID
    socket.on('call-student', (callId) => {
        const student = studentSockets.find(s => s.callId === callId);
        if(student){
            student.socket.emit('incoming-call', callId);
            console.log(`Call sent to student ${student.id} with ID ${callId}`);
        }
    });

    // Student accepts call
    socket.on('answer-call', (callId) => {
        if(teacherSocket)

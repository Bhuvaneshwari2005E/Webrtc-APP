const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', socket => {
    console.log('User connected:', socket.id);

    socket.on('join-room', roomID => {
        socket.join(roomID);
        socket.to(roomID).emit('user-joined', socket.id);

        socket.on('offer', data => {
            socket.to(roomID).emit('offer', data);
        });

        socket.on('answer', data => {
            socket.to(roomID).emit('answer', data);
        });

        socket.on('ice-candidate', data => {
            socket.to(roomID).emit('ice-candidate', data);
        });

        socket.on('disconnect', () => {
            socket.to(roomID).emit('user-left', socket.id);
        });
    });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));

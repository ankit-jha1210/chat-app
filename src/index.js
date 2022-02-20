const express = require('express');
const path = require('path');
const app = express();
const socketio = require('socket.io');
const http = require('http');
const Filter = require('bad-words');
const { addUser, getUser, removeUser, getUsersInRoom } = require('./utils/user')
const generateMessages = require('./utils/messages')
const public_dir_path = path.join(__dirname, 'public');
const port = process.env.PORT || 3000;
app.use(express.static(public_dir_path));

const server = http.createServer(app);
const io = socketio(server);
io.on('connection', socket => {
  socket.on('join', (options, callBack) => {
    const { error, user } = addUser({ ...options, id: socket.id });
    if (error) {
      return callBack(error);
    }

    socket.join(user.room)
    socket.emit('message', generateMessages.generateMessage('admin', 'Welcome'));
    socket.broadcast.to(user.room).emit('message', generateMessages.generateMessage('admin', `${user.username} has joined`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })
    callBack();
  })
  socket.on('sendMessage', (msg, callBack) => {
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return callBack('Profanity not allowed');
    }
    const user = getUser(socket.id);
    io.to(user.room).emit('message', generateMessages.generateMessage(user.username, msg));
    callBack();
  });
  socket.on('sendLocation', (location, callBack) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      'locationMessage',
      generateMessages.generateLocationMessages(
        user.username,
        `https://google.com/maps?q=${location.latitude},${location.longitude}`)
    );
    callBack();
  });
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit('message', generateMessages.generateMessage('admin', `${user.username} has left!`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  });
});

server.listen(port, () => {
  console.log('Server is running on ' + port);
});

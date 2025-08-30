const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());

const users = [];

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("New user connected");

  // Join a room
  socket.on("join", ({ username, room }) => {
    const user = { id: socket.id, username, room };
    users.push(user);

    socket.join(room);
    socket.emit("message", {
      user: "admin",
      text: `${username}, welcome to the room ${room}`,
    });
    socket.broadcast.to(room).emit("message", {
      user: "admin",
      text: `${username} has joined!`,
    });

    // Send users and room info
    io.to(room).emit("roomData", {
      room,
      users: users.filter((user) => user.room === room),
    });
  });
  
 socket.on('sendMessage', ({ username, room, message }) => {
    io.to(room).emit('message', { user: username, text: message });
  });

  
  // When client disconnects
  socket.on("disconnect", () => {
    const user = users.find((user) => user.id === socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.username} has left.`,
      });

      // Remove user from list
      const index = users.findIndex((user) => user.id === socket.id);
      if (index !== -1) {
        users.splice(index, 1);
      }

      // Send updated users list
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: users.filter((u) => u.room === user.room),
      });
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

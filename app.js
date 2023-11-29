const express = require("express")
const http = require("http")
const socketIO = require("socket.io")
require("dotenv").config()
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

app.use(express.static(__dirname + "/public"));

const PORT = process.env.PORT

const filePath = path.join(__dirname, "/public/index.html")

// The connection route
app.get('/', (req, res) => {
    res.sendFile(filePath);
  });

  //create an object "clients" to store every client or user that connect to the app.
  const clients = {}

  // create an event listener "connection" to generate a socket for the connecting client.
io.on("connection", (socket)=>{
    console.log("A new user is connected", socket.id)

    // Event listener to process the emited signup datas from the client.
    socket.on("join", (phoneNum,username, roomId)=>{
        if(clients[socket.id]){
           socket.leave(clients[socket.id].roomId) 
        }

        socket.join(roomId)
        clients[socket.id] = {phoneNum,username, roomId}

        io.to(roomId).emit("newMessage", `${username} has joined the chat`)
    })

    // Event listener to process the emited "chat messages" from the clients.
    socket.on('sendMessage', (data) => {
        const {phoneNum, username, roomId} = clients[socket.id]
        io.to(roomId).emit("newMessage", `${username}(${phoneNum}):${data}`)
      });

      //Event listener to process "keypress" from the client.
    socket.on("typing", (data)=>{
        io.emit("typing", data)
    })
    
    //Event listener to process "keyup" and "keydown" from the client.
    socket.on("notTyping", (data)=>{
        io.emit("notTyping")
    })  

    //Event listener to handle client disconnection from the app.
    socket.on("disconnect", ()=>{
        const {phoneNum, username, roomId} = clients[socket.id]
        io.to(roomId).emit("newMessage", `${username}(${phoneNum}) has left the chat`)
        delete clients[socket.id]
        console.log("A user is disconnected")
    })
})

server.listen(PORT, ()=>{
    console.log(`server listening on http://localhost:${PORT}`)
})
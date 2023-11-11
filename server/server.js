// Server für Websocket Communication
const socketServer = require("http").createServer();
const serverPort = 8080; 

const io = require("socket.io")(socketServer, {
    cors: {origin: "*"}
});

io.on("connection", socket => {
    console.log("a user connected");

    socket.on("message", message => {
        io.emit("message", message);
    });
})

socketServer.listen(serverPort, () => console.log(`listening on port ${serverPort}`));


// Server für Frontend
const express = require("express");
const app = express();
const appPort = 3000; 

app.use(express.static("../app"));

app.listen(appPort, () => {
    console.log(`listening on port ${appPort}`);
});
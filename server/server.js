const http = require("http").createServer();

const io = require("socket.io")(http, {
    cors: {origin: "*"}
});

io.on("connection", socket => {
    console.log("a user connected");

    socket.on("message", message => {
        io.emit("message", message);
    });
})

http.listen(8080, () => console.log("listening on port 8080"));
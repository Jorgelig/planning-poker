var express = require("express");
var app = express();
var http = require("http").Server(app);
var path = require("path");
var io = require("socket.io")(http);
var expressStaticGzip = require("express-static-gzip");
const distPath = path.join(__dirname, "/dist");

// Serve static files
app.use(expressStaticGzip(distPath));
// for client side routing serve index.html when no match
app.use("/*", expressStaticGzip(distPath));

// WebSockets
io.on("connection", function(socket) {
    const room = socket.handshake.query.room;
    socket.join(room);
    socket.to(room).broadcast.emit("user connected");

    socket.on("message to others", data => {
        socket.to(room).broadcast.emit("message to others", data);
    });

    socket.on("send model", data => {
        socket.to(data.id).emit("send model", data);
    });

    socket.on("disconnect", function() {
        socket.to(room).broadcast.emit("user disconnected");
    });

    if (io.sockets.adapter.rooms[room]) {
        const ids = Object.keys(io.sockets.adapter.rooms[room].sockets);
        if (ids.length > 0) {
            socket.to(ids[0]).emit("ask for model", { id: socket.id });
        }
    }
});

http.listen(process.env.PORT || 3000, function() {});

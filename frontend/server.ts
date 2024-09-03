import { createServer } from "http";
import { parse } from "url";
import next from "next";
import ssh2 from "ssh2";

const http = require("http");
const server = http.createServer((req: any, res: any) => {
  // Handle HTTP requests if needed
});

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`
  );
});

const { Server } = require("socket.io");
const io = new Server(server);

io.on("connection", (socket: any) => {
  console.log("A user connected");

  const conn = new ssh2.Client();

  conn.on("ready", () => {
    console.log("Client connected");
    socket.emit("data", "\r\n*** SSH CONNECTION ESTABLISHED ***\r\n");
    conn.shell((err, stream) => {
      if (err)
        return socket.emit(
          "data",
          "\r\n*** SSH SHELL ERROR: " + err.message + " ***\r\n"
        );
      socket.on("command", (data: any) => {
        stream.write(data.data);
      });
      stream.on("data", (d:any) => {
        socket.emit("stdout", d.toString("binary"));
      });
      stream.on("close", () => {
        conn.end();
      });
    });
  });


  conn.connect({
    host: "localhost",
    port: 2222,
    username: "lab-user",
    password: "password",
  });


  // Handle chat messages
  socket.on("chat message", (message: any) => {
    io.emit("chat message", message); // Broadcast the message to all connected clients
  });

  socket.on("command", (message: any) => {
    io.emit("command", message)
  })

  socket.on("disconnect", () => {
    conn.end();
    console.log("A user disconnected");
  });
});

server.listen(3001, () => {
  console.log("WebSocket server listening on port 3001");
});

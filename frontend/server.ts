 import { createServer } from "http";
import { parse } from "url";
import next from "next";
const cors = require("cors");
const http = require("http");


const httpServer = http.createServer((req: any, res: any) => {
  // Handle HTTP requests if needed
});

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
  port: parseInt(process.env.PORT || "3000", 10)
});
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

import express from "express";

const app = express();

app.get("/ping", (req, res) => {
  res.set("Content-Type", "text/plain");
  res.send("pong");
});

export = app;

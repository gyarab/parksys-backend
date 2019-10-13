import express from "express";
import example from "./example";

const app = express();

app.get("/ping", (req, res) => {
  res.set("Content-Type", "text/plain");
  res.send("pong");
});

console.log(example.do());

export = app;

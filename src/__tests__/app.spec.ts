import { app } from "../app";
import request from "supertest";

describe("App", () => {
  test("should pong", async () => {
    const response = await request(app)
      .get("/ping")
      .expect("Content-Type", "text/plain; charset=utf-8")
      .expect(200);
    expect(response.text).toBe("pong");
  });
});

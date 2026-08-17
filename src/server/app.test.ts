// @vitest-environment node
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { parseMap, Resort } from "./resort";

function testApp() {
  const resort = new Resort(parseMap("W#"), [{ room: "101", guestName: "Alice Smith" }]);
  return createApp(resort);
}

describe("REST API", () => {
  it("returns the map and cabana availability", async () => {
    const response = await request(testApp()).get("/api/map").expect(200);

    expect(response.body).toMatchObject({
      width: 2,
      height: 1,
      summary: { totalCabanas: 1, availableCabanas: 1 },
    });
    expect(response.body.tiles[0][0]).toMatchObject({
      cabanaId: "cabana-0-0",
      available: true,
    });
  });

  it("validates a guest, books a cabana, and updates the map response", async () => {
    const app = testApp();

    await request(app)
      .post("/api/cabanas/cabana-0-0/bookings")
      .send({ room: "101", guestName: "Alice Smith" })
      .expect(201);

    const mapResponse = await request(app).get("/api/map").expect(200);
    expect(mapResponse.body.summary.availableCabanas).toBe(0);
    expect(mapResponse.body.tiles[0][0].available).toBe(false);

    const conflict = await request(app)
      .post("/api/cabanas/cabana-0-0/bookings")
      .send({ room: "101", guestName: "Alice Smith" })
      .expect(409);
    expect(conflict.body.message).toContain("no longer available");
  });

  it("returns a human-readable error for invalid guest details", async () => {
    const response = await request(testApp())
      .post("/api/cabanas/cabana-0-0/bookings")
      .send({ room: "999", guestName: "Unknown Guest" })
      .expect(422);

    expect(response.body.message).toContain("couldn’t match");
  });
});

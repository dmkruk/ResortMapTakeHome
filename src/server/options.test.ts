// @vitest-environment node
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseOptions } from "./options";

const cwd = "/review/project";

describe("server CLI options", () => {
  it("uses working-directory defaults", () => {
    expect(parseOptions([], cwd)).toEqual({
      mapPath: path.join(cwd, "map.ascii"),
      bookingsPath: path.join(cwd, "bookings.json"),
      port: 3000,
      dev: false,
    });
  });

  it("accepts custom input files, port, and development mode", () => {
    expect(parseOptions([
      "--map", "fixtures/map.ascii",
      "--bookings", "fixtures/guests.json",
      "--port", "4321",
      "--dev",
    ], cwd)).toEqual({
      mapPath: path.join(cwd, "fixtures/map.ascii"),
      bookingsPath: path.join(cwd, "fixtures/guests.json"),
      port: 4321,
      dev: true,
    });
  });

  it.each([
    [["--map"], "Missing value"],
    [["--port", "0"], "Port must be"],
    [["--unknown", "value"], "Unknown option"],
  ])("rejects invalid arguments %#", (args, message) => {
    expect(() => parseOptions(args, cwd)).toThrow(message);
  });
});

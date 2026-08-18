// @vitest-environment node
import { describe, expect, it } from "vitest";
import { BookingError, parseGuests, parseMap, Resort } from "./resort";

function expectBookingError(action: () => void, status: number): void {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(BookingError);
    expect(error).toMatchObject({ status });
    return;
  }
  throw new Error(`Expected booking to fail with status ${status}.`);
}

describe("input parsing", () => {
  it("parses every map symbol, CRLF input, coordinates, and cabana labels", () => {
    const tiles = parseMap(".#pcW\r\nW....\r\n");

    expect(tiles.map((row) => row.map((tile) => tile.type))).toEqual([
      ["empty", "path", "pool", "chalet", "cabana"],
      ["cabana", "empty", "empty", "empty", "empty"],
    ]);
    expect(tiles[0][4]).toMatchObject({ x: 4, y: 0, cabanaId: "cabana-4-0", label: "Cabana 1" });
    expect(tiles[1][0]).toMatchObject({ x: 0, y: 1, cabanaId: "cabana-0-1", label: "Cabana 2" });
  });

  it.each([
    ["an empty map", "", "The map file is empty."],
    ["unequal row widths", "..\n...", "Map row 2 has 3 columns; expected 2."],
    ["an unknown symbol", ".X", 'Unsupported map symbol "X" at row 1, column 2.'],
  ])("rejects %s", (_case, source, message) => {
    expect(() => parseMap(source)).toThrow(message);
  });

  it("normalizes valid guest records", () => {
    expect(parseGuests([{ room: " 101 ", guestName: " Alice Smith " }])).toEqual([
      { room: "101", guestName: "Alice Smith" },
    ]);
  });

  it.each([
    ["a non-array root", {}, "The bookings file must contain a JSON array."],
    ["a numeric room", [{ room: 101, guestName: "Alice" }], "Invalid guest entry at position 1."],
    ["a missing guest name", [{ room: "101" }], "Invalid guest entry at position 1."],
    ["a blank guest name", [{ room: "101", guestName: "  " }], "Invalid guest entry at position 1."],
  ])("rejects guest data with %s", (_case, value, message) => {
    expect(() => parseGuests(value)).toThrow(message);
  });
});

describe("resort booking logic", () => {
  it("books a current guest case-insensitively and updates availability", () => {
    const resort = new Resort(parseMap("W"), [{ room: "101", guestName: "Alice Smith" }]);

    const result = resort.bookCabana("cabana-0-0", " 101 ", "  alice smith ");

    expect(result.cabanaId).toBe("cabana-0-0");
    expect(resort.getMap()).toMatchObject({
      summary: { totalCabanas: 1, availableCabanas: 0 },
      tiles: [[{ available: false }]],
    });
  });

  it.each([
    ["an unknown cabana", "cabana-9-9", "101", "Alice Smith", 404],
    ["missing guest details", "cabana-0-0", "", "Alice Smith", 400],
    ["a non-current guest", "cabana-0-0", "999", "Someone Else", 422],
  ])("rejects %s", (_case, cabanaId, room, guestName, status) => {
    const resort = new Resort(parseMap("W"), [{ room: "101", guestName: "Alice Smith" }]);
    expectBookingError(() => resort.bookCabana(cabanaId, room, guestName), status);
  });

  it("rejects a duplicate booking with conflict status", () => {
    const resort = new Resort(parseMap("W"), [{ room: "101", guestName: "Alice Smith" }]);
    resort.bookCabana("cabana-0-0", "101", "Alice Smith");

    expectBookingError(
      () => resort.bookCabana("cabana-0-0", "101", "Alice Smith"),
      409,
    );
  });
});

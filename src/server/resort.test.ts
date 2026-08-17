// @vitest-environment node
import { describe, expect, it } from "vitest";
import { BookingError, InputError, parseGuests, parseMap, Resort } from "./resort";

describe("resort booking logic", () => {
  it("parses the supported map symbols and labels cabanas", () => {
    const tiles = parseMap("c#W\n.pp");

    expect(tiles[0][0].type).toBe("chalet");
    expect(tiles[0][1].type).toBe("path");
    expect(tiles[0][2]).toMatchObject({
      type: "cabana",
      cabanaId: "cabana-2-0",
      label: "Cabana 1",
    });
    expect(tiles[1][1].type).toBe("pool");
  });

  it("rejects malformed map and guest files with useful errors", () => {
    expect(() => parseMap("..\n..."))
      .toThrow(new InputError("Map row 2 has 3 columns; expected 2."));
    expect(() => parseGuests([{ room: 101, guestName: "Alice" }]))
      .toThrow("Invalid guest entry at position 1.");
  });

  it("books a cabana for a current guest and marks it unavailable", () => {
    const resort = new Resort(parseMap("W"), [{ room: "101", guestName: "Alice Smith" }]);

    const result = resort.bookCabana("cabana-0-0", "101", "  alice smith ");

    expect(result.cabanaId).toBe("cabana-0-0");
    expect(resort.getMap().summary.availableCabanas).toBe(0);
    expect(resort.getMap().tiles[0][0].available).toBe(false);
  });

  it("rejects invalid guest details and duplicate bookings", () => {
    const resort = new Resort(parseMap("W"), [{ room: "101", guestName: "Alice Smith" }]);

    expect(() => resort.bookCabana("cabana-0-0", "999", "Someone Else"))
      .toThrow(BookingError);

    resort.bookCabana("cabana-0-0", "101", "Alice Smith");
    try {
      resort.bookCabana("cabana-0-0", "101", "Alice Smith");
    } catch (error) {
      expect(error).toMatchObject({ status: 409 });
    }
  });
});

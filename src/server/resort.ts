import type { BookingResponse, Guest, ResortMap, Tile, TileType } from "../shared/types.js";

const TILE_TYPES: Record<string, TileType> = {
  ".": "empty",
  "#": "path",
  p: "pool",
  c: "chalet",
  W: "cabana",
};

export class InputError extends Error {}

export class BookingError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function parseMap(source: string): Tile[][] {
  const rows = source.trimEnd().split(/\r?\n/);

  if (rows.length === 0 || rows[0].length === 0) {
    throw new InputError("The map file is empty.");
  }

  const width = rows[0].length;
  let cabanaNumber = 0;

  return rows.map((row, y) => {
    if (row.length !== width) {
      throw new InputError(`Map row ${y + 1} has ${row.length} columns; expected ${width}.`);
    }

    return [...row].map((symbol, x): Tile => {
      const type = TILE_TYPES[symbol];
      if (!type) {
        throw new InputError(`Unsupported map symbol "${symbol}" at row ${y + 1}, column ${x + 1}.`);
      }

      if (type !== "cabana") {
        return { type, x, y };
      }

      cabanaNumber += 1;
      return {
        type,
        x,
        y,
        cabanaId: `cabana-${x}-${y}`,
        label: `Cabana ${cabanaNumber}`,
        available: true,
      };
    });
  });
}

export function parseGuests(value: unknown): Guest[] {
  if (!Array.isArray(value)) {
    throw new InputError("The bookings file must contain a JSON array.");
  }

  return value.map((guest, index) => {
    if (
      typeof guest !== "object" ||
      guest === null ||
      !("room" in guest) ||
      !("guestName" in guest) ||
      typeof guest.room !== "string" ||
      typeof guest.guestName !== "string" ||
      !guest.room.trim() ||
      !guest.guestName.trim()
    ) {
      throw new InputError(`Invalid guest entry at position ${index + 1}.`);
    }

    return { room: guest.room.trim(), guestName: guest.guestName.trim() };
  });
}

export class Resort {
  private readonly bookedCabanaIds = new Set<string>();
  private readonly cabanaIds: Set<string>;

  constructor(
    private readonly tiles: Tile[][],
    private readonly guests: Guest[],
  ) {
    this.cabanaIds = new Set(
      tiles.flat().flatMap((tile) => (tile.cabanaId ? [tile.cabanaId] : [])),
    );
  }

  getMap(): ResortMap {
    let totalCabanas = 0;
    let availableCabanas = 0;

    const tiles = this.tiles.map((row) =>
      row.map((tile) => {
        if (!tile.cabanaId) return { ...tile };

        totalCabanas += 1;
        const available = !this.bookedCabanaIds.has(tile.cabanaId);
        if (available) availableCabanas += 1;
        return { ...tile, available };
      }),
    );

    return {
      width: tiles[0]?.length ?? 0,
      height: tiles.length,
      tiles,
      summary: { totalCabanas, availableCabanas },
    };
  }

  bookCabana(cabanaId: string, room: unknown, guestName: unknown): BookingResponse {
    if (!this.cabanaIds.has(cabanaId)) {
      throw new BookingError("We couldn’t find that cabana.", 404);
    }

    if (this.bookedCabanaIds.has(cabanaId)) {
      throw new BookingError("That cabana is no longer available. Please choose another one.", 409);
    }

    if (typeof room !== "string" || typeof guestName !== "string" || !room.trim() || !guestName.trim()) {
      throw new BookingError("Enter both your room number and guest name.", 400);
    }

    const normalizedName = guestName.trim().toLocaleLowerCase();
    const isCurrentGuest = this.guests.some(
      (guest) =>
        guest.room === room.trim() && guest.guestName.toLocaleLowerCase() === normalizedName,
    );

    if (!isCurrentGuest) {
      throw new BookingError(
        "We couldn’t match that room and guest name. Please check both and try again.",
        422,
      );
    }

    this.bookedCabanaIds.add(cabanaId);
    return {
      cabanaId,
      message: "Your cabana is reserved. We’ll see you poolside!",
    };
  }
}

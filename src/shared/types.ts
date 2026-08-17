export type TileType = "empty" | "path" | "pool" | "chalet" | "cabana";

export interface Tile {
  type: TileType;
  x: number;
  y: number;
  cabanaId?: string;
  label?: string;
  available?: boolean;
}

export interface ResortMap {
  width: number;
  height: number;
  tiles: Tile[][];
  summary: {
    totalCabanas: number;
    availableCabanas: number;
  };
}

export interface Guest {
  room: string;
  guestName: string;
}

export interface BookingRequest {
  room: string;
  guestName: string;
}

export interface BookingResponse {
  cabanaId: string;
  message: string;
}

export interface ApiError {
  message: string;
}

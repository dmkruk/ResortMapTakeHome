import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResortMap } from "../shared/types";
import { App } from "./App";

function mapWithAvailability(available: boolean): ResortMap {
  return {
    width: 2,
    height: 1,
    summary: { totalCabanas: 1, availableCabanas: available ? 1 : 0 },
    tiles: [[
      {
        type: "cabana",
        x: 0,
        y: 0,
        cabanaId: "cabana-0-0",
        label: "Cabana 1",
        available,
      },
      { type: "pool", x: 1, y: 0 },
    ]],
  };
}

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("cabana booking UI", () => {
  it("loads the map, books a cabana, and updates its visible state", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(mapWithAvailability(true)))
      .mockResolvedValueOnce(jsonResponse({
        cabanaId: "cabana-0-0",
        message: "Your cabana is reserved. We’ll see you poolside!",
      }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Cabana 1, available" }));
    await user.type(screen.getByLabelText("Room number"), "101");
    await user.type(screen.getByLabelText("Guest name"), "Alice Smith");
    await user.click(screen.getByRole("button", { name: "Reserve cabana" }));

    expect(await screen.findByText("Reservation confirmed.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cabana 1, reserved" })).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/cabanas/cabana-0-0/bookings",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows the API validation message and keeps the form open", async () => {
    vi.stubGlobal("fetch", vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(mapWithAvailability(true)))
      .mockResolvedValueOnce(jsonResponse({
        message: "We couldn’t match that room and guest name. Please check both and try again.",
      }, false)));
    const user = userEvent.setup();

    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Cabana 1, available" }));
    await user.type(screen.getByLabelText("Room number"), "999");
    await user.type(screen.getByLabelText("Guest name"), "Unknown Guest");
    await user.click(screen.getByRole("button", { name: "Reserve cabana" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t match");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("explains that a reserved cabana cannot be booked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(mapWithAvailability(false))));
    const user = userEvent.setup();

    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Cabana 1, reserved" }));

    await waitFor(() => expect(screen.getByText("This cabana is reserved")).toBeInTheDocument());
    expect(screen.queryByLabelText("Room number")).not.toBeInTheDocument();
  });
});

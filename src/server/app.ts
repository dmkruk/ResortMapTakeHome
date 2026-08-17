import express, { type Express, type Request, type Response } from "express";
import { BookingError, Resort } from "./resort.js";

export function createApp(resort: Resort): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  app.get("/api/map", (_request: Request, response: Response) => {
    response.json(resort.getMap());
  });

  app.post("/api/cabanas/:cabanaId/bookings", (request: Request, response: Response) => {
    try {
      const result = resort.bookCabana(
        String(request.params.cabanaId),
        request.body?.room,
        request.body?.guestName,
      );
      response.status(201).json(result);
    } catch (error) {
      if (error instanceof BookingError) {
        response.status(error.status).json({ message: error.message });
        return;
      }
      throw error;
    }
  });

  app.use("/api", (_request: Request, response: Response) => {
    response.status(404).json({ message: "API route not found." });
  });

  return app;
}

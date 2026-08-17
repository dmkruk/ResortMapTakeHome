import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApp } from "./app.js";
import { parseOptions } from "./options.js";
import { InputError, parseGuests, parseMap, Resort } from "./resort.js";

async function start(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const [mapSource, bookingsSource] = await Promise.all([
    readFile(options.mapPath, "utf8"),
    readFile(options.bookingsPath, "utf8"),
  ]);

  let bookingData: unknown;
  try {
    bookingData = JSON.parse(bookingsSource);
  } catch {
    throw new InputError("The bookings file contains invalid JSON.");
  }

  const app = createApp(new Resort(parseMap(mapSource), parseGuests(bookingData)));

  if (options.dev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
    const staticDirectory = path.join(projectRoot, "dist");
    app.use(express.static(staticDirectory));
    app.use((_request, response) => response.sendFile(path.join(staticDirectory, "index.html")));
  }

  app.listen(options.port, () => {
    console.log(`Azure Bay is ready at http://localhost:${options.port}`);
    console.log(`Map: ${options.mapPath}`);
    console.log(`Bookings: ${options.bookingsPath}`);
  });
}

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Could not start Azure Bay: ${message}`);
  process.exitCode = 1;
});

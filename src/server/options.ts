import path from "node:path";

export interface ServerOptions {
  mapPath: string;
  bookingsPath: string;
  port: number;
  dev: boolean;
}

const HELP = `Usage: npm run start -- [options]

Options:
  --map <path>       ASCII resort map (default: ./map.ascii)
  --bookings <path>  Current guest JSON file (default: ./bookings.json)
  --port <number>    Web server port (default: 3000)
  --help             Show this help message`;

export function parseOptions(args: string[], cwd = process.cwd()): ServerOptions {
  const options: ServerOptions = {
    mapPath: path.resolve(cwd, "map.ascii"),
    bookingsPath: path.resolve(cwd, "bookings.json"),
    port: 3000,
    dev: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === "--help") {
      console.log(HELP);
      process.exit(0);
    }
    if (option === "--dev") {
      options.dev = true;
      continue;
    }

    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${option}.\n\n${HELP}`);
    }

    if (option === "--map") options.mapPath = path.resolve(cwd, value);
    else if (option === "--bookings") options.bookingsPath = path.resolve(cwd, value);
    else if (option === "--port") {
      const port = Number(value);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("Port must be an integer between 1 and 65535.");
      }
      options.port = port;
    } else {
      throw new Error(`Unknown option: ${option}.\n\n${HELP}`);
    }
    index += 1;
  }

  return options;
}

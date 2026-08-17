import { type CSSProperties, type FormEvent, useEffect, useState } from "react";
import arrowCorner from "../../assets/arrowCornerSquare.png";
import arrowCrossing from "../../assets/arrowCrossing.png";
import arrowEnd from "../../assets/arrowEnd.png";
import arrowSplit from "../../assets/arrowSplit.png";
import arrowStraight from "../../assets/arrowStraight.png";
import cabanaImage from "../../assets/cabana.png";
import chaletImage from "../../assets/houseChimney.png";
import type { ApiError, BookingResponse, ResortMap, Tile } from "../shared/types";

type CabanaTile = Tile & { cabanaId: string; label: string; available: boolean };

async function getMap(): Promise<ResortMap> {
  const response = await fetch("/api/map");
  if (!response.ok) throw new Error("The resort map is unavailable right now.");
  return response.json() as Promise<ResortMap>;
}

function isCabana(tile: Tile): tile is CabanaTile {
  return (
    tile.type === "cabana" &&
    typeof tile.cabanaId === "string" &&
    typeof tile.label === "string" &&
    typeof tile.available === "boolean"
  );
}

function App(): React.JSX.Element {
  const [map, setMap] = useState<ResortMap | null>(null);
  const [loadError, setLoadError] = useState("");
  const [selectedCabana, setSelectedCabana] = useState<CabanaTile | null>(null);
  const [confirmation, setConfirmation] = useState("");

  const loadMap = async (): Promise<void> => {
    setLoadError("");
    try {
      setMap(await getMap());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "The resort map is unavailable right now.");
    }
  };

  useEffect(() => {
    void loadMap();
  }, []);

  const finishBooking = (result: BookingResponse): void => {
    setMap((currentMap) => {
      if (!currentMap) return currentMap;
      return {
        ...currentMap,
        tiles: currentMap.tiles.map((row) =>
          row.map((tile) =>
            tile.cabanaId === result.cabanaId ? { ...tile, available: false } : tile,
          ),
        ),
        summary: {
          ...currentMap.summary,
          availableCabanas: Math.max(0, currentMap.summary.availableCabanas - 1),
        },
      };
    });
    setSelectedCabana(null);
    setConfirmation(result.message);
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#main" aria-label="Azure Bay home">
          <span className="brand-mark" aria-hidden="true">AB</span>
          <span>
            <strong>Azure Bay</strong>
            <small>Resort &amp; Spa</small>
          </span>
        </a>
        <span className="guest-service">
          <span className="status-dot" aria-hidden="true" />
          Guest services online
        </span>
      </header>

      <main id="main">
        <section className="intro" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Poolside, perfected</p>
            <h1 id="page-title">Find your place in the sun.</h1>
            <p className="intro-copy">
              Choose an available cabana on the resort map and reserve it with your room details.
            </p>
          </div>
          {map && (
            <div className="availability-card" aria-label="Cabana availability">
              <span className="availability-number">{map.summary.availableCabanas}</span>
              <span>
                <strong>cabanas available</strong>
                <small>of {map.summary.totalCabanas} around the pool</small>
              </span>
            </div>
          )}
        </section>

        {confirmation && (
          <div className="confirmation" role="status">
            <span className="confirmation-icon" aria-hidden="true">✓</span>
            <span><strong>Reservation confirmed.</strong> {confirmation}</span>
            <button type="button" onClick={() => setConfirmation("")} aria-label="Dismiss confirmation">×</button>
          </div>
        )}

        <section className="map-section" aria-labelledby="map-title">
          <div className="map-heading">
            <div>
              <p className="section-number">01 / Resort map</p>
              <h2 id="map-title">Select a cabana</h2>
            </div>
            <Legend />
          </div>

          <div className="map-frame">
            {loadError ? (
              <div className="map-message" role="alert">
                <p>{loadError}</p>
                <button type="button" onClick={() => void loadMap()}>Try again</button>
              </div>
            ) : map ? (
              <ResortMapView map={map} onCabanaClick={setSelectedCabana} />
            ) : (
              <div className="map-message" role="status">
                <span className="loading-spinner" aria-hidden="true" />
                <p>Preparing your resort map…</p>
              </div>
            )}
          </div>
          <p className="map-tip"><span aria-hidden="true">✦</span> Tap any cabana to check its availability.</p>
        </section>
      </main>

      <footer>
        <span>Azure Bay Resort &amp; Spa</span>
        <span>Cabana reservations · Daily 8:00–18:00</span>
      </footer>

      {selectedCabana && (
        <BookingDialog
          cabana={selectedCabana}
          onClose={() => setSelectedCabana(null)}
          onBooked={finishBooking}
        />
      )}
    </div>
  );
}

function Legend(): React.JSX.Element {
  return (
    <div className="legend" aria-label="Map legend">
      <span><i className="legend-dot available" />Available</span>
      <span><i className="legend-dot reserved" />Reserved</span>
      <span><i className="legend-dot pool" />Pool</span>
    </div>
  );
}

function ResortMapView({
  map,
  onCabanaClick,
}: {
  map: ResortMap;
  onCabanaClick: (cabana: CabanaTile) => void;
}): React.JSX.Element {
  const gridStyle = { "--map-columns": map.width } as CSSProperties;

  return (
    <div className="map-scroll">
      <div
        className="resort-map"
        style={gridStyle}
        role="group"
        aria-label={`Resort map with ${map.summary.availableCabanas} available cabanas`}
      >
        {map.tiles.flat().map((tile) => (
          <MapTile key={`${tile.x}-${tile.y}`} tile={tile} tiles={map.tiles} onCabanaClick={onCabanaClick} />
        ))}
      </div>
    </div>
  );
}

function MapTile({
  tile,
  tiles,
  onCabanaClick,
}: {
  tile: Tile;
  tiles: Tile[][];
  onCabanaClick: (cabana: CabanaTile) => void;
}): React.JSX.Element {
  if (isCabana(tile)) {
    return (
      <div className="map-tile cabana-tile">
        <button
          className={tile.available ? "cabana available" : "cabana reserved"}
          type="button"
          aria-label={`${tile.label}, ${tile.available ? "available" : "reserved"}`}
          onClick={() => onCabanaClick(tile)}
        >
          <img src={cabanaImage} alt="" />
          <span className="cabana-number">{tile.label.replace("Cabana ", "")}</span>
          {!tile.available && <span className="reserved-mark" aria-hidden="true">×</span>}
        </button>
      </div>
    );
  }

  if (tile.type === "chalet") {
    return <div className="map-tile chalet-tile"><img src={chaletImage} alt="" /></div>;
  }

  if (tile.type === "pool") {
    return <div className="map-tile pool-tile" aria-hidden="true" />;
  }

  if (tile.type === "path") {
    const path = getPathArtwork(tile.x, tile.y, tiles);
    return (
      <div className="map-tile path-tile" aria-hidden="true">
        <img src={path.source} alt="" style={{ transform: `rotate(${path.rotation}deg)` }} />
      </div>
    );
  }

  return <div className="map-tile empty-tile" aria-hidden="true" />;
}

function getPathArtwork(x: number, y: number, tiles: Tile[][]): { source: string; rotation: number } {
  const connects = {
    up: tiles[y - 1]?.[x]?.type === "path",
    right: tiles[y]?.[x + 1]?.type === "path",
    down: tiles[y + 1]?.[x]?.type === "path",
    left: tiles[y]?.[x - 1]?.type === "path",
  };
  const count = Object.values(connects).filter(Boolean).length;

  if (count === 4) return { source: arrowCrossing, rotation: 0 };
  if (count === 3) {
    if (!connects.left) return { source: arrowSplit, rotation: 0 };
    if (!connects.up) return { source: arrowSplit, rotation: 90 };
    if (!connects.right) return { source: arrowSplit, rotation: 180 };
    return { source: arrowSplit, rotation: 270 };
  }
  if (count === 2) {
    if (connects.up && connects.down) return { source: arrowStraight, rotation: 0 };
    if (connects.left && connects.right) return { source: arrowStraight, rotation: 90 };
    if (connects.up && connects.right) return { source: arrowCorner, rotation: 0 };
    if (connects.right && connects.down) return { source: arrowCorner, rotation: 90 };
    if (connects.down && connects.left) return { source: arrowCorner, rotation: 180 };
    return { source: arrowCorner, rotation: 270 };
  }
  if (connects.down) return { source: arrowEnd, rotation: 0 };
  if (connects.left) return { source: arrowEnd, rotation: 90 };
  if (connects.up) return { source: arrowEnd, rotation: 180 };
  if (connects.right) return { source: arrowEnd, rotation: 270 };
  return { source: arrowCrossing, rotation: 0 };
}

function BookingDialog({
  cabana,
  onClose,
  onBooked,
}: {
  cabana: CabanaTile;
  onClose: () => void;
  onBooked: (booking: BookingResponse) => void;
}): React.JSX.Element {
  const [room, setRoom] = useState("");
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`/api/cabanas/${cabana.cabanaId}/bookings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ room, guestName }),
      });
      const result = (await response.json()) as BookingResponse | ApiError;
      if (!response.ok) {
        setError(result.message || "We couldn’t complete your reservation.");
        return;
      }
      onBooked(result as BookingResponse);
    } catch {
      setError("We couldn’t reach guest services. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="booking-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Close">×</button>
        <div className={`dialog-cabana ${cabana.available ? "available" : "reserved"}`}>
          <img src={cabanaImage} alt="" />
        </div>
        <p className="eyebrow">Poolside collection</p>
        <h2 id="dialog-title">{cabana.label}</h2>

        {cabana.available ? (
          <>
            <p className="dialog-copy">This cabana is available. Confirm your stay details to reserve it.</p>
            <form onSubmit={(event) => void submit(event)}>
              <label htmlFor="room">Room number</label>
              <input
                id="room"
                name="room"
                inputMode="numeric"
                autoComplete="off"
                value={room}
                onChange={(event) => setRoom(event.target.value)}
                placeholder="e.g. 101"
                required
                autoFocus
              />
              <label htmlFor="guest-name">Guest name</label>
              <input
                id="guest-name"
                name="guestName"
                autoComplete="name"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Name on reservation"
                required
              />
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="reserve-button" type="submit" disabled={submitting}>
                {submitting ? "Reserving…" : "Reserve cabana"}
              </button>
              <p className="form-note">Your room details are only used to validate this reservation.</p>
            </form>
          </>
        ) : (
          <>
            <p className="unavailable-title">This cabana is reserved</p>
            <p className="dialog-copy">Choose another cabana marked in green on the map.</p>
            <button className="reserve-button secondary" type="button" onClick={onClose}>Back to map</button>
          </>
        )}
      </section>
    </div>
  );
}

export { App };

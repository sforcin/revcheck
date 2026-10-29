import { useState } from "react";

// Minimal check that a file matches docs/trip-format.md.
function validate(trip) {
  if (!Array.isArray(trip?.samples) || trip.samples.length < 2) {
    throw new Error("Trip needs a `samples` array with at least 2 entries.");
  }
  for (const k of ["t", "lat", "lon", "speed_mps", "a_long", "a_lat"]) {
    if (typeof trip.samples[0][k] !== "number") throw new Error(`Samples are missing \`${k}\`.`);
  }
  return trip;
}

export default function TripLoader({ onLoad }) {
  const [error, setError] = useState(null);

  const loadDemo = async () => {
    try {
      const res = await fetch("/demo-trip.json");
      onLoad(validate(await res.json()));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const loadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      onLoad(validate(JSON.parse(await file.text())));
      setError(null);
    } catch (err) {
      setError(`Couldn't read that file: ${err.message}`);
    }
    e.target.value = ""; // allow re-opening the same file
  };

  return (
    <div className="card">
      <h3>Trip</h3>
      <button className="primary" onClick={loadDemo}>
        Load demo trip
      </button>
      <label className="filebtn">
        Open trip file (.json)
        <input type="file" accept=".json,application/json" onChange={loadFile} />
      </label>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

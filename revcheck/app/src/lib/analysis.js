// Turns a trip (time series of speed + acceleration) into driving events,
// a score, and feedback, judged against the car's own capabilities.
//
// This is deliberately simple threshold logic so the app works end to end.
// The engine you build (sensor fusion + ML) will produce cleaner signals and,
// later, its own `events` list; if a trip file includes `events`, the app
// uses those instead of detecting them here.

import { accelCapabilityG } from "./cars.js";

const G = 9.81;

// Fraction of the car's capability that counts as an event.
export const THRESHOLDS = {
  brake: { moderate: 0.35, harsh: 0.5 },
  accel: { moderate: 0.6, harsh: 0.85 },
  turn: { moderate: 0.4, harsh: 0.55 },
};
const MIN_DURATION_S = 0.5; // ignore spikes shorter than this (potholes, bumps)
const RELEASE = 0.75;       // an event ends when the signal drops below 75% of the threshold
const MERGE_GAP_S = 1.0;    // same-type events closer than this are one event

// Colors from a colorblind-checked palette; every use also shows a text label.
export const EVENT_INFO = {
  brake: { label: "Hard braking", color: "#eb6834" },
  accel: { label: "Hard acceleration", color: "#2a78d6" },
  turn: { label: "Sharp turn", color: "#1baf7a" },
};

const FEEDBACK = {
  brake: {
    moderate: "Firm stop. Looking further ahead and easing off earlier gives smoother, cheaper stops.",
    harsh: "Very hard stop. Repeated stops like this wear pads and rotors quickly; leave more following distance.",
  },
  accel: {
    moderate: "Brisk acceleration. Gentler throttle saves fuel and drivetrain wear.",
    harsh: "Near full-throttle acceleration. Hard on the engine and tires, especially before the engine is warm.",
  },
  turn: {
    moderate: "Quick turn. Slowing a bit more before the corner keeps the car settled.",
    harsh: "Turn near the car's grip limit. Brake before the turn, not in it, to keep a safety margin.",
  },
};

/** Intensity of each signal as a fraction of what this car can do (0..1+). */
function intensities(sample, car) {
  const aLongG = sample.a_long / G;
  const aLatG = sample.a_lat / G;
  return {
    brake: aLongG < 0 ? -aLongG / car.max_brake_g : 0,
    accel: aLongG > 0 ? aLongG / accelCapabilityG(car) : 0,
    turn: Math.abs(aLatG) / car.max_lateral_g,
  };
}

/**
 * Find runs where a signal rises above the "moderate" threshold.
 * Hysteresis (start high, end lower) and merging stop sensor noise from
 * splitting one maneuver into several events.
 */
export function detectEvents(samples, car) {
  const runs = [];
  for (const type of Object.keys(THRESHOLDS)) {
    const on = THRESHOLDS[type].moderate;
    let run = null;
    samples.forEach((s, i) => {
      const x = intensities(s, car)[type];
      if (!run && x >= on) run = { type, start: i, end: i, peak: i, peakValue: x };
      if (!run) return;
      if (x >= on * RELEASE) {
        run.end = i;
        if (x > run.peakValue) Object.assign(run, { peak: i, peakValue: x });
      } else {
        runs.push(run);
        run = null;
      }
    });
    if (run) runs.push(run);
  }

  // Merge same-type runs separated by a short gap.
  runs.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const r of runs) {
    const prev = merged.findLast((m) => m.type === r.type);
    if (prev && samples[r.start].t - samples[prev.end].t < MERGE_GAP_S) {
      prev.end = r.end;
      if (r.peakValue > prev.peakValue) Object.assign(prev, { peak: r.peak, peakValue: r.peakValue });
    } else {
      merged.push({ ...r });
    }
  }

  const events = [];
  for (const r of merged) pushEvent(events, r, samples);
  return events.sort((a, b) => a.t - b.t);
}

function pushEvent(events, run, samples) {
  const { type, end } = run;
  const duration = samples[end].t - samples[run.start].t;
  if (duration < MIN_DURATION_S) return;
  const p = samples[run.peak];
  const severity = run.peakValue >= THRESHOLDS[type].harsh ? "harsh" : "moderate";
  events.push({
    type,
    severity,
    t: p.t,
    duration_s: duration,
    lat: p.lat,
    lon: p.lon,
    speed_mps: p.speed_mps,
    peak_g: type === "turn" ? Math.abs(p.a_lat) / G : Math.abs(p.a_long) / G,
    pct_of_capability: run.peakValue,
  });
}

export function feedbackFor(event) {
  return FEEDBACK[event.type]?.[event.severity] ?? "";
}

/** Great-circle distance in meters. */
function haversine(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function tripStats(samples) {
  let dist = 0;
  for (let i = 1; i < samples.length; i++) dist += haversine(samples[i - 1], samples[i]);
  return {
    distance_m: dist,
    duration_s: samples.at(-1).t - samples[0].t,
    max_speed_mps: Math.max(...samples.map((s) => s.speed_mps)),
  };
}

/**
 * 0-100 score. Each event costs points by severity; the total is divided by
 * distance so long trips aren't punished for being long, then mapped through
 * an exponential so the score never goes negative.
 */
export function tripScore(events, distance_m) {
  const cost = { moderate: 3, harsh: 8 };
  const penalty = events.reduce((sum, e) => sum + cost[e.severity], 0);
  const perKm = penalty / Math.max(distance_m / 1000, 1); // trips under 1 km count as 1 km
  return Math.round(100 * Math.exp(-perKm / 15));
}

export function analyzeTrip(trip, car) {
  const events = trip.events ?? detectEvents(trip.samples, car);
  const stats = tripStats(trip.samples);
  return { events, stats, score: tripScore(events, stats.distance_m) };
}

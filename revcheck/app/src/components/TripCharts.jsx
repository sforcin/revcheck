import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { mph } from "../lib/units.js";

const G = 9.81;

// Two stacked charts sharing a time axis: speed on top, g-forces below.
// (Separate charts rather than one chart with two y-axes, which is hard to read.)
export default function TripCharts({ samples, events }) {
  // Plot every 5th sample (2 Hz) so long trips stay fast to draw.
  const data = samples
    .filter((_, i) => i % 5 === 0)
    .map((s) => ({
      t: s.t - samples[0].t,
      speed: +mph(s.speed_mps).toFixed(1),
      long: +(s.a_long / G).toFixed(3),
      lat: +(s.a_lat / G).toFixed(3),
    }));
  const t0 = samples[0].t;
  const fmtT = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
  const axis = { stroke: "var(--ink-3)", fontSize: 11 };

  return (
    <div className="card charts">
      <h3>Speed</h3>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data} syncId="trip" margin={{ left: -10, right: 8 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={fmtT} tick={axis} />
          <YAxis unit=" mph" tick={axis} width={64} />
          <Tooltip labelFormatter={fmtT} formatter={(v) => [`${v} mph`, "Speed"]} />
          <Line dataKey="speed" stroke="#2a78d6" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>

      <h3>G-forces</h3>
      <p className="hint">
        Forward (+ accelerating, − braking) and sideways (turning). Dashed lines mark detected events.
      </p>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={data} syncId="trip" margin={{ left: -10, right: 8 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={fmtT} tick={axis} />
          <YAxis unit=" g" tick={axis} width={64} />
          <Tooltip
            labelFormatter={fmtT}
            formatter={(v, name) => [`${v} g`, name === "long" ? "Forward" : "Sideways"]}
          />
          <ReferenceLine y={0} stroke="var(--ink-3)" />
          {events.map((e, i) => (
            <ReferenceLine key={i} x={e.t - t0} stroke="var(--ink-3)" strokeDasharray="3 3" />
          ))}
          <Line dataKey="long" name="long" stroke="#eb6834" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line dataKey="lat" name="lat" stroke="#1baf7a" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="legend">
        <span>
          <i className="dot" style={{ background: "#eb6834" }} /> Forward
        </span>
        <span>
          <i className="dot" style={{ background: "#1baf7a" }} /> Sideways
        </span>
      </div>
    </div>
  );
}

import { EVENT_INFO } from "../lib/analysis.js";
import { fmtDuration, miles, mph } from "../lib/units.js";

function scoreLabel(score) {
  if (score >= 90) return "Smooth driver";
  if (score >= 75) return "Mostly smooth";
  if (score >= 50) return "Room to improve";
  return "Hard on the car";
}

export default function Summary({ trip, analysis, car }) {
  const { score, stats, events } = analysis;
  const counts = Object.keys(EVENT_INFO).map((type) => ({
    type,
    n: events.filter((e) => e.type === type).length,
  }));

  return (
    <div className="card summary">
      <div className="score">
        <div className="score-num">{score}</div>
        <div>
          <div className="score-label">{scoreLabel(score)}</div>
          <div className="muted">
            {trip.name ?? "Trip"} · {car.name}
          </div>
        </div>
      </div>
      <dl className="stats">
        <div>
          <dt>Distance</dt>
          <dd>{miles(stats.distance_m).toFixed(1)} mi</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{fmtDuration(stats.duration_s)}</dd>
        </div>
        <div>
          <dt>Top speed</dt>
          <dd>{Math.round(mph(stats.max_speed_mps))} mph</dd>
        </div>
        {counts.map(({ type, n }) => (
          <div key={type}>
            <dt>
              <i className="dot" style={{ background: EVENT_INFO[type].color }} />
              {EVENT_INFO[type].label}
            </dt>
            <dd>{n}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

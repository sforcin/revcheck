import { EVENT_INFO, feedbackFor } from "../lib/analysis.js";
import { fmtDuration, mph } from "../lib/units.js";

export default function EventList({ events, selected, onSelect, t0 = 0 }) {
  if (!events.length) {
    return (
      <div className="card">
        <h3>Feedback</h3>
        <p>No hard braking, acceleration or sharp turns on this trip. Nice driving.</p>
      </div>
    );
  }
  return (
    <div className="card">
      <h3>Feedback ({events.length} events)</h3>
      <ul className="events">
        {events.map((e, i) => (
          <li key={i}>
            <button className={`event ${selected === i ? "active" : ""}`} onClick={() => onSelect(i)}>
              <div className="event-head">
                <i className="dot" style={{ background: EVENT_INFO[e.type].color }} />
                <strong>{EVENT_INFO[e.type].label}</strong>
                <span className={`badge ${e.severity}`}>{e.severity}</span>
                <span className="muted right">at {fmtDuration(e.t - t0)}</span>
              </div>
              <div className="muted">
                {e.peak_g.toFixed(2)} g at {Math.round(mph(e.speed_mps))} mph
                {e.pct_of_capability != null &&
                  ` · ${Math.round(e.pct_of_capability * 100)}% of what your car can do`}
              </div>
              <p>{feedbackFor(e)}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

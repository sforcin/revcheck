# Trip file format (v1)

This is the contract between the **engine** (Python: reads raw phone/OBD logs,
fuses sensors, writes trips) and the **app** (shows trips and feedback).
Anything that writes this format can be opened in the app.

```json
{
  "version": 1,
  "name": "Commute to campus",
  "source": "engine v0.1",
  "samples": [
    { "t": 0.0, "lat": 33.9737, "lon": -117.3281, "speed_mps": 0.0, "a_long": 0.0, "a_lat": 0.0 }
  ],
  "events": []
}
```

| Field | Units | Meaning |
|---|---|---|
| `t` | seconds | time since trip start (or any increasing clock) |
| `lat`, `lon` | degrees | position |
| `speed_mps` | m/s | ground speed |
| `a_long` | m/s² | acceleration along the car's forward axis (+ speeding up, − braking) |
| `a_lat` | m/s² | sideways acceleration (+ turning right, − turning left) |

Samples should be evenly spaced; 10 Hz is a good rate.

`a_long` and `a_lat` are in the **car's** frame, not the phone's. Turning raw
phone accelerometer readings into car-frame values (and cleaning them with a
Kalman filter) is the engine's main job.

`events` is optional. If it's missing, the app detects events itself with simple
thresholds. When the engine has its own detector or classifier, it can write
events with: `type` (`brake` | `accel` | `turn`), `severity` (`moderate` | `harsh`),
`t`, `lat`, `lon`, `speed_mps`, `peak_g`, and optionally `pct_of_capability`.

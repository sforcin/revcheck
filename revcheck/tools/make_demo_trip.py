"""Generate a synthetic demo trip in the RevCheck trip format (docs/trip-format.md).

The drive is scripted as a list of phases (speed changes, turns, cruising).
We integrate them at 10 Hz into speed, heading and position,
then add sensor-like noise. A few phases are deliberately aggressive so the
app has events to show.

    python tools/make_demo_trip.py   # writes app/public/demo-trip.json
"""
import json
import math
import random
from pathlib import Path

G = 9.81
DT = 0.1
START = (33.9737, -117.3281)   # near UC Riverside
random.seed(4)

MPH = 0.44704

# Each phase is one of:
#   ("hold", seconds)                         keep current speed (or stay parked)
#   ("speed", accel_g, target_mph)            accelerate/brake until target speed
#   ("turn", seconds, turn_rate_deg_per_s)    turn at constant speed (+ = right)
PHASES = [
    ("hold", 3),                 # parked
    ("speed", 0.14, 25),         # gentle pull-away
    ("hold", 18),
    ("speed", -0.12, 15),        # slow for the corner
    ("turn", 6, 15),             # normal right turn
    ("speed", 0.15, 40),
    ("hold", 25),
    ("speed", -0.55, 12),        # HARD BRAKE: car ahead stopped suddenly
    ("speed", 0.14, 35),
    ("hold", 12),
    ("speed", -0.15, 26),        # slows only a little for the corner...
    ("turn", 4, -24),            # ...SHARP LEFT taken fast
    ("hold", 15),
    ("speed", -0.32, 0),         # stops a bit late for a light (firm, not extreme)
    ("hold", 5),
    ("speed", 0.30, 30),         # HARD ACCELERATION from the light
    ("hold", 20),
    ("speed", -0.1, 22),
    ("turn", 7, -12),            # gentle left
    ("hold", 15),
    ("speed", -0.2, 0),          # normal stop
    ("hold", 3),
]


def main():
    lat, lon = START
    v, heading = 0.0, math.radians(90)   # heading measured from north; start facing east
    t = 0.0
    samples = []
    m_per_deg_lat = 111_320.0
    m_per_deg_lon = 111_320.0 * math.cos(math.radians(lat))

    for phase in PHASES:
        kind = phase[0]
        if kind == "hold":
            steps = [(0.0, 0.0)] * int(round(phase[1] / DT))
        elif kind == "turn":
            steps = [(0.0, math.radians(phase[2]))] * int(round(phase[1] / DT))
        else:  # "speed": accelerate or brake until the target speed
            a = phase[1] * G
            target = phase[2] * MPH
            n = max(1, int(round(abs(target - v) / abs(a) / DT)))
            steps = [(a, 0.0)] * n
        for a, yaw in steps:
            if kind == "speed":
                v_next = v + a * DT
                # don't overshoot the target speed
                if (a > 0 and v_next > target) or (a < 0 and v_next < target):
                    a, v_next = (target - v) / DT, target
                v = max(0.0, v_next)
            heading += yaw * DT
            lat += v * math.cos(heading) * DT / m_per_deg_lat
            lon += v * math.sin(heading) * DT / m_per_deg_lon
            a_lat = v * yaw  # centripetal acceleration, + = turning right

            # sensor-like noise, plus the occasional pothole spike (too short to count)
            bump = random.gauss(0, 0.25 * G) if random.random() < 0.01 else 0.0
            samples.append({
                "t": round(t, 2),
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "speed_mps": round(max(0.0, v + random.gauss(0, 0.15)), 3),
                "a_long": round(a + random.gauss(0, 0.02 * G) + bump, 3),
                "a_lat": round(a_lat + random.gauss(0, 0.02 * G), 3),
            })
            t += DT

    trip = {
        "version": 1,
        "name": "Demo drive (synthetic)",
        "source": "tools/make_demo_trip.py",
        "samples": samples,
    }
    out = Path(__file__).resolve().parents[1] / "app" / "public" / "demo-trip.json"
    out.write_text(json.dumps(trip, separators=(",", ":")))
    print(f"wrote {len(samples)} samples ({t:.0f} s) to {out}")


if __name__ == "__main__":
    main()

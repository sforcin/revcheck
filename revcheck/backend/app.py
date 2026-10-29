"""RevCheck API: serves the car database to the app.

    uvicorn app:app --reload --port 8000

Endpoints (the app calls them in this order as you fill in the dropdowns):
    GET /api/years
    GET /api/makes?year=2022
    GET /api/models?year=2022&make=Toyota
    GET /api/options?year=2022&make=Toyota&model=Camry
    GET /api/vehicles/{id}            -> vehicle + estimated capabilities
"""
import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException

DB_PATH = Path(__file__).resolve().parent / "revcheck.db"

app = FastAPI(title="RevCheck API")


def query(sql: str, params: tuple = ()) -> list[dict]:
    """Run a read-only query and return rows as dicts.

    Values always go in `params` (the ? placeholders), never pasted into the
    SQL string. That's what keeps user input from being run as SQL.
    """
    if not DB_PATH.exists():
        raise HTTPException(503, "Database not built yet. Run: python build_db.py")
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    try:
        return [dict(r) for r in con.execute(sql, params)]
    finally:
        con.close()


@app.get("/api/years")
def years():
    return [r["year"] for r in query("SELECT DISTINCT year FROM vehicles ORDER BY year DESC")]


@app.get("/api/makes")
def makes(year: int):
    rows = query("SELECT DISTINCT make FROM vehicles WHERE year = ? ORDER BY make", (year,))
    return [r["make"] for r in rows]


@app.get("/api/models")
def models(year: int, make: str):
    rows = query(
        "SELECT DISTINCT model FROM vehicles WHERE year = ? AND make = ? ORDER BY model",
        (year, make),
    )
    return [r["model"] for r in rows]


@app.get("/api/options")
def options(year: int, make: str, model: str):
    """Trims/engines for one model, each with a readable label."""
    rows = query(
        """SELECT id, drive, cylinders, displ, trany, atv_type
           FROM vehicles
           WHERE year = ? AND make = ? AND model = ?
           ORDER BY displ, trany""",
        (year, make, model),
    )
    for r in rows:
        engine = "Electric" if r["atv_type"] == "EV" else (
            f"{r['displ']:.1f} L {r['cylinders']}-cyl" if r["displ"] else "Engine n/a")
        if r["atv_type"] and r["atv_type"] != "EV":
            engine += f" {r['atv_type']}"
        r["label"] = " · ".join(x for x in (engine, r["trany"], r["drive"]) if x)
    return [{"id": r["id"], "label": r["label"]} for r in rows]


@app.get("/api/vehicles/{vehicle_id}")
def vehicle(vehicle_id: int):
    """One vehicle joined with its class's estimated capabilities."""
    rows = query(
        """SELECT v.id, v.year, v.make, v.model, v.epa_vclass, v.drive, v.atv_type,
                  c.name AS class_name, c.zero_to_60_s, c.max_brake_g, c.max_lateral_g, c.mass_kg
           FROM vehicles v
           LEFT JOIN class_map m ON m.epa_vclass = v.epa_vclass
           LEFT JOIN classes c   ON c.id = COALESCE(m.class_id, 13)
           WHERE v.id = ?""",
        (vehicle_id,),
    )
    if not rows:
        raise HTTPException(404, "No vehicle with that id")
    v = rows[0]

    # Small adjustments on top of the class estimate.
    if v["atv_type"] == "EV":
        v["zero_to_60_s"] = round(v["zero_to_60_s"] * 0.75, 1)  # instant torque
        v["mass_kg"] += 350                                      # battery pack
    if v["drive"] and ("All-Wheel" in v["drive"] or "4-Wheel" in v["drive"]):
        v["zero_to_60_s"] = round(v["zero_to_60_s"] * 0.95, 1)   # better launch traction

    v["source"] = f"Estimated from EPA class: {v['epa_vclass']}"
    return v

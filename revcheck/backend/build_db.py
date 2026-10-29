"""Build the RevCheck car database (revcheck.db) from the EPA vehicle list.

    python build_db.py            # download the full EPA list (1984-today, ~50k rows)
    python build_db.py --sample   # small hand-made sample, works offline
    python build_db.py --csv path/to/vehicles.csv   # use a CSV you downloaded yourself

The EPA data comes from fueleconomy.gov (U.S. DOE / EPA). If the automatic
download fails, get "vehicles.csv" from https://www.fueleconomy.gov/feg/download.shtml
and pass it with --csv.
"""
import argparse
import csv
import io
import sqlite3
import urllib.request
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
DB_PATH = HERE / "revcheck.db"
EPA_URL = "https://www.fueleconomy.gov/feg/epadata/vehicles.csv.zip"

# EPA size class -> our class id (see classes.sql). Checked in order, first
# match wins, so specific phrases come before general ones
# ("Minicompact" before "Compact", "Minivan" before "Van").
CLASS_RULES = [
    ("two seater", 1),
    ("minicompact", 2),
    ("subcompact", 2),
    ("station wagon", 6),
    ("compact", 3),
    ("midsize", 4),
    ("large car", 5),
    ("small sport utility", 7),
    ("standard sport utility", 8),
    ("sport utility", 7),
    ("small pickup", 9),
    ("pickup", 10),
    ("minivan", 11),
    ("van", 12),
]
OTHER_CLASS = 13


def classify(vclass: str) -> int:
    v = (vclass or "").lower()
    for phrase, class_id in CLASS_RULES:
        if phrase in v:
            return class_id
    return OTHER_CLASS


def read_csv_text(args) -> str:
    if args.sample:
        return (HERE / "data" / "sample_vehicles.csv").read_text()
    if args.csv:
        return Path(args.csv).read_text(encoding="utf-8", errors="replace")
    print(f"Downloading {EPA_URL} ...")
    try:
        with urllib.request.urlopen(EPA_URL, timeout=60) as resp:
            data = resp.read()
    except OSError as e:
        raise SystemExit(
            f"Download failed ({e}).\nGet vehicles.csv from https://www.fueleconomy.gov/feg/download.shtml "
            "and run: python build_db.py --csv path/to/vehicles.csv\n"
            "Or try the offline sample: python build_db.py --sample"
        )
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        name = next(n for n in z.namelist() if n.endswith(".csv"))
        return z.read(name).decode("utf-8", errors="replace")


def to_int(x):
    try:
        return int(float(x))
    except (TypeError, ValueError):
        return None


def to_float(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--sample", action="store_true", help="use the small offline sample")
    ap.add_argument("--csv", help="path to an EPA vehicles.csv you downloaded")
    args = ap.parse_args()

    rows = list(csv.DictReader(io.StringIO(read_csv_text(args))))
    print(f"Read {len(rows):,} vehicle records")

    con = sqlite3.connect(DB_PATH)
    con.executescript((HERE / "schema.sql").read_text())
    con.executescript((HERE / "classes.sql").read_text())

    # Parameterized INSERT: the ? placeholders let SQLite handle quoting,
    # which is also what protects against SQL injection.
    con.executemany(
        """INSERT OR REPLACE INTO vehicles
           (id, year, make, model, base_model, epa_vclass, drive, cylinders, displ, trany, atv_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            (
                to_int(r["id"]), to_int(r["year"]), r["make"].strip(), r["model"].strip(),
                (r.get("baseModel") or "").strip() or None, r.get("VClass"), r.get("drive"),
                to_int(r.get("cylinders")), to_float(r.get("displ")), r.get("trany"),
                (r.get("atvType") or "").strip() or None,
            )
            for r in rows
            if to_int(r.get("id")) and to_int(r.get("year"))
        ],
    )

    # Map every distinct EPA class that appears in the data to one of ours.
    vclasses = [v for (v,) in con.execute("SELECT DISTINCT epa_vclass FROM vehicles WHERE epa_vclass IS NOT NULL")]
    con.executemany("INSERT INTO class_map (epa_vclass, class_id) VALUES (?, ?)",
                    [(v, classify(v)) for v in vclasses])
    con.commit()

    # A quick report, written as SQL so you can see a GROUP BY + JOIN in action.
    print("\nVehicles per class:")
    for name, n in con.execute(
        """SELECT c.name, COUNT(*) AS n
           FROM vehicles v
           JOIN class_map m ON m.epa_vclass = v.epa_vclass
           JOIN classes c   ON c.id = m.class_id
           GROUP BY c.name
           ORDER BY n DESC"""
    ):
        print(f"  {name:<22} {n:>7,}")
    con.close()
    print(f"\nWrote {DB_PATH}")


if __name__ == "__main__":
    main()

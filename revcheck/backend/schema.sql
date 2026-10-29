-- RevCheck car database (SQLite).
--
-- vehicles      one row per EPA vehicle record (a year/make/model/trim combo)
-- classes       our capability estimates for each kind of vehicle
-- class_map     links each EPA size class (e.g. "Midsize Cars") to one of our classes
--
-- Splitting it this way means the capability numbers live in ONE place per
-- class instead of being copied onto 45,000 vehicle rows ("normalization").

DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS class_map;
DROP TABLE IF EXISTS classes;

CREATE TABLE classes (
    id            INTEGER PRIMARY KEY,
    name          TEXT NOT NULL UNIQUE,
    zero_to_60_s  REAL NOT NULL,
    max_brake_g   REAL NOT NULL,
    max_lateral_g REAL NOT NULL,
    mass_kg       REAL NOT NULL
);

CREATE TABLE class_map (
    epa_vclass TEXT PRIMARY KEY,                 -- exactly as written in the EPA data
    class_id   INTEGER NOT NULL REFERENCES classes(id)
);

CREATE TABLE vehicles (
    id         INTEGER PRIMARY KEY,              -- EPA record id
    year       INTEGER NOT NULL,
    make       TEXT NOT NULL,
    model      TEXT NOT NULL,
    base_model TEXT,
    epa_vclass TEXT,
    drive      TEXT,
    cylinders  INTEGER,
    displ      REAL,                             -- engine size in liters
    trany      TEXT,                             -- transmission
    atv_type   TEXT                              -- EV, Hybrid, Plug-in Hybrid, Diesel, ...
);

-- The dropdowns filter by year, then make, then model: index exactly that path.
CREATE INDEX idx_vehicles_ymm ON vehicles (year, make, model);

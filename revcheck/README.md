# RevCheck

Driving feedback judged against your car: hard braking, hard acceleration and
sharp turns, scored relative to what *your* car can do.

```
revcheck/
├── app/       React web app: car picker, trip map, g-force charts, feedback
├── backend/   Python API + SQLite car database (year / make / model -> capabilities)
├── engine/    Python sensor fusion (to build): raw phone/OBD logs -> trip.json
├── docs/      trip-format.md, the contract between engine and app
└── tools/     make_demo_trip.py, generates the synthetic demo trip
```

## Run it

You need two terminal tabs: one for the backend, one for the app.

**Tab 1: backend** (Python 3.10+)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python build_db.py              # downloads the EPA vehicle list (one time)
uvicorn app:app --reload --port 8000
```

If the download fails, run `python build_db.py --sample` for a small offline sample.

**Tab 2: app** (Node.js 20+)

```bash
cd app
npm install
npm run dev                     # open the printed http://localhost:5173 link
```

Pick your car (year, make, model, trim), then **Load demo trip**.

## Where the car data comes from

Vehicle names, size classes, drivetrains and engines come from the U.S. EPA's
fuel economy data ([fueleconomy.gov](https://www.fueleconomy.gov/feg/download.shtml)).
That data has no performance specs, so braking, cornering, 0–60 and weight are
**estimated from the vehicle's class** (`backend/classes.sql`), with small
adjustments for EVs and AWD. Users can adjust any value in the app.

## Status

- [x] App: car picker, trip view, threshold event detection, scoring
- [x] Backend: SQLite car database built from EPA data, REST API
- [ ] Engine: phone-to-car alignment, GPS/IMU Kalman filter, trip export
- [ ] Learned event classifier
- [ ] Save trips to the database; recording trips from a phone

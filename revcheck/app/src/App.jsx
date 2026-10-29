import { useMemo, useState } from "react";
import CarProfile from "./components/CarProfile.jsx";
import TripLoader from "./components/TripLoader.jsx";
import Summary from "./components/Summary.jsx";
import TripMap from "./components/TripMap.jsx";
import TripCharts from "./components/TripCharts.jsx";
import EventList from "./components/EventList.jsx";
import { loadCar, saveCar } from "./lib/cars.js";
import { analyzeTrip } from "./lib/analysis.js";

export default function App() {
  const [car, setCar] = useState(loadCar);
  const [trip, setTrip] = useState(null);
  const [selected, setSelected] = useState(null); // index of the highlighted event

  // Re-analyze whenever the trip or the car profile changes.
  const analysis = useMemo(() => (trip ? analyzeTrip(trip, car) : null), [trip, car]);

  const updateCar = (next) => {
    setCar(next);
    saveCar(next);
  };

  const openTrip = (t) => {
    setTrip(t);
    setSelected(null);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          Rev<span>Check</span>
        </div>
        <p className="tagline">Driving feedback judged against your car</p>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <CarProfile car={car} onChange={updateCar} />
          <TripLoader onLoad={openTrip} />
        </aside>

        <section className="content">
          {!analysis ? (
            <div className="empty card">
              <h2>No trip loaded</h2>
              <p>Load the demo trip to see how it works, or open a trip file from the engine.</p>
            </div>
          ) : (
            <>
              <Summary trip={trip} analysis={analysis} car={car} />
              <TripMap
                samples={trip.samples}
                events={analysis.events}
                selected={selected}
                onSelect={setSelected}
              />
              <TripCharts samples={trip.samples} events={analysis.events} />
              <EventList
                events={analysis.events}
                selected={selected}
                onSelect={setSelected}
                t0={trip.samples[0].t}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

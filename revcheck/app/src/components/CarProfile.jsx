import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { CAR_PRESETS } from "../lib/cars.js";

const FIELDS = [
  { key: "mass_kg", label: "Weight", unit: "kg", step: 50 },
  { key: "zero_to_60_s", label: "0–60 mph", unit: "s", step: 0.1 },
  { key: "max_brake_g", label: "Max braking", unit: "g", step: 0.05 },
  { key: "max_lateral_g", label: "Max cornering", unit: "g", step: 0.05 },
];
const SPEC_KEYS = FIELDS.map((f) => f.key);

/** A <select> that shows a placeholder until something is picked. */
function Picker({ label, value, items, onPick, disabled, getValue = (x) => x, getLabel = (x) => x }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value ?? ""} disabled={disabled || !items.length} onChange={(e) => onPick(e.target.value)}>
        <option value="" disabled>
          {items.length ? `Choose ${label.toLowerCase()}` : "—"}
        </option>
        {items.map((it) => (
          <option key={getValue(it)} value={getValue(it)}>
            {getLabel(it)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function CarProfile({ car, onChange }) {
  const [online, setOnline] = useState(true);
  const [lists, setLists] = useState({ years: [], makes: [], models: [], options: [] });
  const [editing, setEditing] = useState(false);
  const [version, setVersion] = useState(0); // bump to reload the number boxes

  const setList = (key, items) => setLists((l) => ({ ...l, [key]: items }));

  // Each dropdown's choices depend on the one above it, so each effect
  // re-runs when its parent selection changes.
  useEffect(() => {
    api.years().then((y) => setList("years", y)).catch(() => setOnline(false));
  }, []);
  useEffect(() => {
    if (car.year) api.makes(car.year).then((x) => setList("makes", x)).catch(() => {});
  }, [car.year]);
  useEffect(() => {
    if (car.year && car.make) api.models(car.year, car.make).then((x) => setList("models", x)).catch(() => {});
  }, [car.year, car.make]);
  useEffect(() => {
    if (car.year && car.make && car.model)
      api.options(car.year, car.make, car.model).then((x) => setList("options", x)).catch(() => {});
  }, [car.year, car.make, car.model]);

  // Picking a level clears everything below it.
  const pickYear = (year) => {
    setLists((l) => ({ ...l, makes: [], models: [], options: [] }));
    onChange({ ...car, year: Number(year), make: null, model: null, vehicle_id: null });
  };
  const pickMake = (make) => {
    setLists((l) => ({ ...l, models: [], options: [] }));
    onChange({ ...car, make, model: null, vehicle_id: null });
  };
  const pickModel = (model) => {
    setLists((l) => ({ ...l, options: [] }));
    onChange({ ...car, model, vehicle_id: null });
  };
  const pickTrim = async (id) => {
    const v = await api.vehicle(id);
    const specs = Object.fromEntries(SPEC_KEYS.map((k) => [k, v[k]]));
    onChange({
      ...car,
      ...specs,
      vehicle_id: v.id,
      name: `${v.year} ${v.make} ${v.model}`,
      class_name: v.class_name,
      source: v.source,
      edited: false,
    });
    setVersion((n) => n + 1);
  };

  const pickPreset = (key) => {
    onChange({ ...car, ...CAR_PRESETS[key], name: CAR_PRESETS[key].label, source: "Generic profile", edited: false });
    setVersion((n) => n + 1);
  };
  const setField = (key, value) => {
    const num = parseFloat(value);
    if (!Number.isNaN(num) && num > 0) onChange({ ...car, [key]: num, edited: true });
  };

  return (
    <div className="card">
      <h3>Your car</h3>

      {online ? (
        <>
          <div className="grid2">
            <Picker label="Year" value={car.year} items={lists.years} onPick={pickYear} />
            <Picker label="Make" value={car.make} items={lists.makes} onPick={pickMake} disabled={!car.year} />
          </div>
          <Picker label="Model" value={car.model} items={lists.models} onPick={pickModel} disabled={!car.make} />
          <Picker
            label="Trim"
            value={car.vehicle_id}
            items={lists.options}
            onPick={pickTrim}
            disabled={!car.model}
            getValue={(o) => o.id}
            getLabel={(o) => o.label}
          />
        </>
      ) : (
        <>
          <p className="error">
            Can't reach the car database. Start the backend (see README) and reload. Using a generic profile for now.
          </p>
          <Picker
            label="Type"
            value={Object.keys(CAR_PRESETS).find((k) => CAR_PRESETS[k].label === car.name) ?? ""}
            items={Object.keys(CAR_PRESETS)}
            onPick={pickPreset}
            getLabel={(k) => CAR_PRESETS[k].label}
          />
        </>
      )}

      <div className="specs">
        <div className="specs-head">
          <strong>{car.name}</strong>
          <button className="link" onClick={() => setEditing((e) => !e)}>
            {editing ? "Done" : "Adjust"}
          </button>
        </div>
        {editing ? (
          <div className="grid2">
            {FIELDS.map((f) => (
              <label className="field" key={f.key}>
                <span>
                  {f.label} <em>{f.unit}</em>
                </span>
                <input
                  key={`${version}-${f.key}`}
                  type="number"
                  step={f.step}
                  defaultValue={car[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              </label>
            ))}
          </div>
        ) : (
          <dl className="spec-list">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <dt>{f.label}</dt>
                <dd>
                  {car[f.key]} {f.unit}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <p className="hint">
          {car.source ?? "Generic profile"}
          {car.edited ? " · adjusted by you" : ""}. Estimates, not official specs.
        </p>
      </div>
    </div>
  );
}

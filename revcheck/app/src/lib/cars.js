// Car profiles. Feedback is judged against what *this* car can do,
// so 0.4 g of braking means something different in an SUV than a sports car.
//
// The real per-car values come from the backend database (picked by year,
// make and model). These presets are the fallback when it's not running.
// Numbers are rough, typical values for each class, not specs for any model.

export const CAR_PRESETS = {
  compact: {
    label: "Compact sedan",
    mass_kg: 1350,
    zero_to_60_s: 8.5,
    max_brake_g: 0.85,
    max_lateral_g: 0.82,
  },
  suv: {
    label: "Midsize SUV",
    mass_kg: 1900,
    zero_to_60_s: 8.0,
    max_brake_g: 0.8,
    max_lateral_g: 0.75,
  },
  truck: {
    label: "Full-size pickup",
    mass_kg: 2300,
    zero_to_60_s: 7.0,
    max_brake_g: 0.75,
    max_lateral_g: 0.7,
  },
  sports: {
    label: "Sports car",
    mass_kg: 1500,
    zero_to_60_s: 4.5,
    max_brake_g: 1.0,
    max_lateral_g: 0.95,
  },
};

// Used until a car is picked from the database.
export const DEFAULT_CAR = {
  name: "Compact sedan",
  source: "Generic profile",
  ...CAR_PRESETS.compact,
};

const STORAGE_KEY = "revcheck.car";

export function loadCar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_CAR, ...JSON.parse(raw) } : DEFAULT_CAR;
  } catch {
    return DEFAULT_CAR;
  }
}

export function saveCar(car) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(car));
  } catch {
    /* storage unavailable (private mode): the profile just won't persist */
  }
}

// Average acceleration (in g) needed to do 0-60 mph in the given time.
// 60 mph = 26.82 m/s. Real cars pull harder at low speed, so this is a
// conservative stand-in for "max acceleration".
export function accelCapabilityG(car) {
  return 26.82 / car.zero_to_60_s / 9.81;
}

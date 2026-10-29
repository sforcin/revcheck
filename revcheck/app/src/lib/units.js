// Data is stored in SI units (meters, m/s); the app displays US units.
export const mph = (mps) => mps * 2.23694;
export const miles = (m) => m / 1609.34;
export const fmtDuration = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

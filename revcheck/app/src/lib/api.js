// Small helpers for the backend API (see backend/app.py).
async function get(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/${path}${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

export const api = {
  years: () => get("years"),
  makes: (year) => get("makes", { year }),
  models: (year, make) => get("models", { year, make }),
  options: (year, make, model) => get("options", { year, make, model }),
  vehicle: (id) => get(`vehicles/${id}`),
};

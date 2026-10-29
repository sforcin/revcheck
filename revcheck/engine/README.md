# Engine (to build)

Python code that turns raw drive logs into trip files the app can open
(see `../docs/trip-format.md`). This is the part to build step by step:

1. Load a phone sensor log (GPS, accelerometer, gyroscope) into NumPy arrays.
2. Find the phone-to-car rotation (gravity while parked, GPS speed changes while driving).
3. Fuse IMU + GPS with a Kalman filter for clean speed and car-frame accelerations.
4. Write `trip.json`, then open it in the app.
5. Later: a learned event classifier that writes its own `events`.

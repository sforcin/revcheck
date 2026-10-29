-- Rough, typical capabilities per vehicle class. These are ESTIMATES for
-- feedback purposes, not measured specs for any specific model; users can
-- override them in the app.
INSERT INTO classes (id, name, zero_to_60_s, max_brake_g, max_lateral_g, mass_kg) VALUES
    (1,  'Sports / two-seater',  5.5, 0.95, 0.92, 1450),
    (2,  'Small car',            8.5, 0.85, 0.84, 1300),
    (3,  'Compact car',          8.0, 0.85, 0.83, 1400),
    (4,  'Midsize car',          7.5, 0.85, 0.83, 1550),
    (5,  'Large car',            7.0, 0.83, 0.80, 1750),
    (6,  'Wagon',                8.0, 0.84, 0.80, 1550),
    (7,  'Small SUV',            8.5, 0.82, 0.78, 1650),
    (8,  'Standard SUV',         7.5, 0.78, 0.74, 2200),
    (9,  'Small pickup',         8.0, 0.78, 0.72, 1900),
    (10, 'Full-size pickup',     7.0, 0.75, 0.70, 2400),
    (11, 'Minivan',              8.0, 0.80, 0.75, 2000),
    (12, 'Van',                 10.0, 0.72, 0.65, 2500),
    (13, 'Other',                8.0, 0.80, 0.78, 1700);

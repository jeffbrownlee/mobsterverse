-- Resource Types Table (global, not game-specific)
CREATE TABLE IF NOT EXISTS resource_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Resource Type Attributes Table
CREATE TABLE IF NOT EXISTS resource_type_attributes (
    id SERIAL PRIMARY KEY,
    resource_type_id INTEGER NOT NULL REFERENCES resource_types(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('integer', 'decimal', 'string', 'boolean')),
    is_required BOOLEAN DEFAULT true,
    default_value TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource_type_id, name)
);

-- Resources Table (instances of resource types)
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    resource_type_id INTEGER NOT NULL REFERENCES resource_types(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource_type_id, name)
);

-- Resource Attribute Values Table
CREATE TABLE IF NOT EXISTS resource_attribute_values (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    attribute_id INTEGER NOT NULL REFERENCES resource_type_attributes(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource_id, attribute_id)
);

-- Resource Sets Table (named collections of resources)
CREATE TABLE IF NOT EXISTS resource_sets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Resource Set Items Table (which resources belong to which sets)
CREATE TABLE IF NOT EXISTS resource_set_items (
    id SERIAL PRIMARY KEY,
    resource_set_id INTEGER NOT NULL REFERENCES resource_sets(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource_set_id, resource_id)
);

-- Add resource_set_id to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS resource_set_id INTEGER REFERENCES resource_sets(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resource_type_attributes_type_id ON resource_type_attributes(resource_type_id);
CREATE INDEX IF NOT EXISTS idx_resources_type_id ON resources(resource_type_id);
CREATE INDEX IF NOT EXISTS idx_resource_attribute_values_resource_id ON resource_attribute_values(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_attribute_values_attribute_id ON resource_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_resource_set_items_set_id ON resource_set_items(resource_set_id);
CREATE INDEX IF NOT EXISTS idx_resource_set_items_resource_id ON resource_set_items(resource_id);
CREATE INDEX IF NOT EXISTS idx_games_resource_set_id ON games(resource_set_id);

-- Baseline Resource Types
INSERT INTO resource_types (name, description) VALUES
('Transports', 'Used to move resources between locations'),
('Vehicles', 'Provide enforcers with speed and armor when attacking'),
('Items', 'Goods that can be produced and consumed'),
('Associates', 'Earn money and create items'),
('Enforcers', 'Used to defend your resources and attack other players'),
('Weapons', 'Used by associates and enforcers to attack and defend');

-- Baseline Resource Type Attributes
-- Transports (id=1): value, capacity, hitpoints
INSERT INTO resource_type_attributes (resource_type_id, name, data_type, is_required) VALUES
(1, 'value', 'integer', true),
(1, 'capacity', 'integer', true),
(1, 'hitpoints', 'integer', true);

-- Vehicles (id=2): value, capacity, travelunits, travelcost, hitpoints, speed
INSERT INTO resource_type_attributes (resource_type_id, name, data_type, is_required) VALUES
(2, 'value', 'integer', true),
(2, 'capacity', 'integer', true),
(2, 'travelunits', 'decimal', true),
(2, 'travelcost', 'decimal', true),
(2, 'hitpoints', 'integer', true),
(2, 'speed', 'integer', true);

-- Items (id=3): value, travelunits, travelcost
INSERT INTO resource_type_attributes (resource_type_id, name, data_type, is_required) VALUES
(3, 'value', 'integer', true),
(3, 'travelunits', 'decimal', true),
(3, 'travelcost', 'decimal', true);

-- Associates (id=4): value, weaponlevel, weaponcount, travelunits, travelcost, hitpoints, recruitmin, recruitmax
INSERT INTO resource_type_attributes (resource_type_id, name, data_type, is_required) VALUES
(4, 'value', 'integer', true),
(4, 'weaponlevel', 'integer', true),
(4, 'weaponcount', 'integer', true),
(4, 'travelunits', 'decimal', true),
(4, 'travelcost', 'decimal', true),
(4, 'hitpoints', 'integer', true),
(4, 'recruitmin', 'integer', true),
(4, 'recruitmax', 'integer', true);

-- Enforcers (id=5): value, weaponlevel, weaponcount, travelunits, travelcost, hitpoints, recruitmin, recruitmax
INSERT INTO resource_type_attributes (resource_type_id, name, data_type, is_required) VALUES
(5, 'value', 'integer', true),
(5, 'weaponlevel', 'integer', true),
(5, 'weaponcount', 'integer', true),
(5, 'travelunits', 'decimal', true),
(5, 'travelcost', 'decimal', true),
(5, 'hitpoints', 'integer', true),
(5, 'recruitmin', 'integer', true),
(5, 'recruitmax', 'integer', true);

-- Weapons (id=6): value, capacity, weaponlevel, travelunits, travelcost
INSERT INTO resource_type_attributes (resource_type_id, name, data_type, is_required) VALUES
(6, 'value', 'integer', true),
(6, 'capacity', 'integer', true),
(6, 'weaponlevel', 'integer', true),
(6, 'travelunits', 'decimal', true),
(6, 'travelcost', 'decimal', true);

-- Baseline Resources
-- Enforcers
INSERT INTO resources (resource_type_id, name) VALUES
(5, 'Assassins'),
(5, 'Bodyguards'),
(5, 'Hitmen'),
(5, 'Pimps'),
(5, 'Thugs');

-- Items
INSERT INTO resources (resource_type_id, name) VALUES
(3, 'Cocaine'),
(3, 'Hashish'),
(3, 'Heroin'),
(3, 'Methamphetamine'),
(3, 'Whiskey');

-- Associates
INSERT INTO resources (resource_type_id, name) VALUES
(4, 'Bootleggers'),
(4, 'Cooks'),
(4, 'Hookers'),
(4, 'Hustlers'),
(4, 'Smugglers');

-- Transports
INSERT INTO resources (resource_type_id, name) VALUES
(1, 'Boeing 737'),
(1, 'Boeing 777X'),
(1, 'Airbus A380'),
(1, 'Cargo Ship');

-- Vehicles
INSERT INTO resources (resource_type_id, name) VALUES
(2, 'Ducati'),
(2, 'Stretch Escalade'),
(2, 'Hummer H3'),
(2, 'Armored Limo');

-- Weapons
INSERT INTO resources (resource_type_id, name) VALUES
(6, 'Tommy Guns'),
(6, 'Mac-10s'),
(6, 'Desert Eagles'),
(6, 'AK-47s'),
(6, 'Aguila HV');

-- Resource Attribute Values
-- Enforcers
INSERT INTO resource_attribute_values (resource_id, attribute_id, value) VALUES
-- Assassins (id=1)
(1, 2, '1000'), (1, 11, '50'), (1, 14, '2'), (1, 16, '1'), (1, 23, '20'), (1, 26, '1500'), (1, 31, '2'), (1, 33, '5'),
-- Bodyguards (id=2)
(2, 2, '500'), (2, 11, '25'), (2, 14, '1'), (2, 16, '1'), (2, 23, '20'), (2, 26, '955'), (2, 31, '4'), (2, 33, '7'),
-- Hitmen (id=3)
(3, 2, '740'), (3, 11, '35'), (3, 14, '2'), (3, 16, '1'), (3, 23, '20'), (3, 26, '1175'), (3, 31, '3'), (3, 33, '6'),
-- Pimps (id=4)
(4, 2, '325'), (4, 11, '20'), (4, 14, '1'), (4, 16, '1'), (4, 23, '20'), (4, 26, '710'), (4, 31, '5'), (4, 33, '10'),
-- Thugs (id=5)
(5, 2, '275'), (5, 11, '15'), (5, 14, '1'), (5, 16, '1'), (5, 23, '20'), (5, 26, '500'), (5, 31, '7'), (5, 33, '14');

-- Items
INSERT INTO resource_attribute_values (resource_id, attribute_id, value) VALUES
-- Cocaine (id=6)
(6, 3, '12'), (6, 17, '.001'), (6, 22, '5'),
-- Hashish (id=7)
(7, 3, '9'), (7, 17, '.001'), (7, 22, '5'),
-- Heroin (id=8)
(8, 3, '9'), (8, 17, '.001'), (8, 22, '5'),
-- Methamphetamine (id=9)
(9, 3, '6'), (9, 17, '.001'), (9, 22, '5'),
-- Whiskey (id=10)
(10, 3, '4'), (10, 17, '.001'), (10, 22, '.25');

-- Associates
INSERT INTO resource_attribute_values (resource_id, attribute_id, value) VALUES
-- Bootleggers (id=11)
(11, 1, '250'), (11, 10, '10'), (11, 13, '1'), (11, 15, '1'), (11, 24, '20'), (11, 25, '250'), (11, 30, '10'), (11, 32, '15'),
-- Cooks (id=12)
(12, 1, '750'), (12, 10, '35'), (12, 13, '2'), (12, 15, '1'), (12, 24, '20'), (12, 25, '1000'), (12, 30, '2'), (12, 32, '5'),
-- Hookers (id=13)
(13, 1, '400'), (13, 10, '20'), (13, 13, '1'), (13, 15, '1'), (13, 24, '20'), (13, 25, '430'), (13, 30, '5'), (13, 32, '10'),
-- Hustlers (id=14)
(14, 1, '450'), (14, 10, '25'), (14, 13, '1'), (14, 15, '1'), (14, 24, '20'), (14, 25, '335'), (14, 30, '7'), (14, 32, '12'),
-- Smugglers (id=15)
(15, 1, '500'), (15, 10, '30'), (15, 13, '1'), (15, 15, '1'), (15, 24, '20'), (15, 25, '750'), (15, 30, '3'), (15, 32, '6');

-- Transports
INSERT INTO resource_attribute_values (resource_id, attribute_id, value) VALUES
-- Boeing 737 (id=16)
(16, 4, '1000000'), (16, 9, '100'), (16, 27, '25000'),
-- Boeing 777X (id=17)
(17, 4, '3000000'), (17, 9, '425'), (17, 27, '75000'),
-- Airbus A380 (id=18)
(18, 4, '10000000'), (18, 9, '850'), (18, 27, '200000'),
-- Cargo Ship (id=28)
(28, 4, '25000000'), (28, 9, '10000'), (28, 27, '300000');

-- Vehicles
INSERT INTO resource_attribute_values (resource_id, attribute_id, value) VALUES
-- Ducati (id=19)
(19, 5, '4000'), (19, 8, '2'), (19, 18, '2'), (19, 21, '20'), (19, 28, '3000'), (19, 29, '20'),
-- Stretch Escalade (id=25)
(25, 5, '30000'), (25, 8, '10'), (25, 18, '25'), (25, 21, '180'), (25, 28, '21000'), (25, 29, '10'),
-- Hummer H3 (id=26)
(26, 5, '12500'), (26, 8, '5'), (26, 18, '15'), (26, 21, '100'), (26, 28, '9000'), (26, 29, '15'),
-- Armored Limo (id=27)
(27, 5, '70000'), (27, 8, '20'), (27, 18, '35'), (27, 21, '200'), (27, 28, '48000'), (27, 29, '5');

-- Weapons
INSERT INTO resource_attribute_values (resource_id, attribute_id, value) VALUES
-- Tommy Guns (id=20)
(20, 6, '5500'), (20, 7, '50'), (20, 12, '40'), (20, 19, '.25'), (20, 20, '10'),
-- Mac-10s (id=21)
(21, 6, '2500'), (21, 7, '25'), (21, 12, '20'), (21, 19, '.2'), (21, 20, '5'),
-- Desert Eagles (id=22)
(22, 6, '1000'), (22, 7, '10'), (22, 12, '10'), (22, 19, '.15'), (22, 20, '3'),
-- AK-47s (id=23)
(23, 6, '4000'), (23, 7, '25'), (23, 12, '30'), (23, 19, '.25'), (23, 20, '6'),
-- Aguila HV (id=24)
(24, 6, '7000'), (24, 7, '5'), (24, 12, '50'), (24, 19, '.5'), (24, 20, '12');

-- Resource Sets
INSERT INTO resource_sets (name) VALUES ('Old School');

-- Resource Set Items (Old School set includes all resources)
INSERT INTO resource_set_items (resource_set_id, resource_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),  -- Enforcers
(1, 6), (1, 7), (1, 8), (1, 9), (1, 10), -- Items
(1, 11), (1, 12), (1, 13), (1, 14), (1, 15), -- Associates
(1, 16), (1, 17), (1, 18), (1, 28), -- Transports
(1, 19), (1, 25), (1, 26), (1, 27), -- Vehicles
(1, 20), (1, 21), (1, 22), (1, 23), (1, 24); -- Weapons

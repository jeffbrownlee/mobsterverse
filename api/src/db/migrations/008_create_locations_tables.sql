-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create location_sets table
CREATE TABLE IF NOT EXISTS location_sets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create junction table for location sets and locations
CREATE TABLE IF NOT EXISTS location_set_locations (
    location_set_id INTEGER REFERENCES location_sets(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    PRIMARY KEY (location_set_id, location_id)
);

-- Add location_set_id to games table
ALTER TABLE games
ADD COLUMN location_set_id INTEGER REFERENCES location_sets(id);

-- Add location_id to players table
ALTER TABLE players
ADD COLUMN location_id INTEGER REFERENCES locations(id);

-- Insert some default locations (major cities)
INSERT INTO locations (name, latitude, longitude) VALUES
('New York City', 40.7128, -74.0060),
('Los Angeles', 34.0522, -118.2437),
('Chicago', 41.8781, -87.6298),
('Miami', 25.7617, -80.1918),
('Las Vegas', 36.1699, -115.1398),
('San Francisco', 37.7749, -122.4194),
('Boston', 42.3601, -71.0589),
('Seattle', 47.6062, -122.3321),
('Denver', 39.7392, -104.9903),
('Atlanta', 33.7490, -84.3880),
('Philadelphia', 39.9526, -75.1652),
('Phoenix', 33.4484, -112.0740),
('Detroit', 42.3314, -83.0458),
('New Orleans', 29.9511, -90.0715),
('Dallas', 32.7767, -96.7970),
('Houston', 29.7604, -95.3698),
('London', 51.5074, -0.1278),
('Paris', 48.8566, 2.3522),
('Berlin', 52.5200, 13.4050),
('Tokyo', 35.6762, 139.6503),
('Sydney', -33.8688, 151.2093),
('Toronto', 43.6532, -79.3832),
('Rome', 41.9028, 12.4964),
('Madrid', 40.4168, -3.7038),
('Amsterdam', 52.3676, 4.9041),
('Dubai', 25.2048, 55.2708),
('Hong Kong', 22.3193, 114.1694),
('Singapore', 1.3521, 103.8198),
('Moscow', 55.7558, 37.6173),
('Mumbai', 19.0760, 72.8777);

-- Insert some default location sets
INSERT INTO location_sets (name) VALUES
('US Cities'),
('World Cities'),
('European Cities'),
('Asia Pacific');

-- Link locations to location sets
-- US Cities
INSERT INTO location_set_locations (location_set_id, location_id)
SELECT 1, id FROM locations WHERE name IN (
    'New York City', 'Los Angeles', 'Chicago', 'Miami', 'Las Vegas',
    'San Francisco', 'Boston', 'Seattle', 'Denver', 'Atlanta',
    'Philadelphia', 'Phoenix', 'Detroit', 'New Orleans', 'Dallas', 'Houston'
);

-- World Cities
INSERT INTO location_set_locations (location_set_id, location_id)
SELECT 2, id FROM locations;

-- European Cities
INSERT INTO location_set_locations (location_set_id, location_id)
SELECT 3, id FROM locations WHERE name IN (
    'London', 'Paris', 'Berlin', 'Rome', 'Madrid', 'Amsterdam', 'Moscow'
);

-- Asia Pacific
INSERT INTO location_set_locations (location_set_id, location_id)
SELECT 4, id FROM locations WHERE name IN (
    'Tokyo', 'Sydney', 'Hong Kong', 'Singapore', 'Mumbai'
);

export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  created_at?: Date;
}

export interface LocationSet {
  id: number;
  name: string;
  created_at?: Date;
}

export interface LocationSetWithLocations extends LocationSet {
  locations: Location[];
}

export interface CreateLocationDTO {
  name: string;
  latitude: number;
  longitude: number;
}

export interface CreateLocationSetDTO {
  name: string;
  location_ids: number[];
}

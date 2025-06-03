/**
 * Interface representing a country with all available data fields
 */
export interface Country {
  country: string;
  population: number;
  land_area_km2: number;
  wikipedia: string;
  flag: string;
  
  // These fields are added during data processing
  continent: string;
  region: string;
}

/**
 * Interface for the raw data structure from JSON
 */
export interface CountryData {
  [continent: string]: {
    [region: string]: Omit<Country, 'continent' | 'region'>[];
  };
}

/**
 * Type for sizing criteria options
 */
export type SizingCriteria = 'population' | 'land_area_km2';

/**
 * Interface for processed country data with additional visualization properties
 */
export interface CountryVisualizationData extends Country {
  radius: number;
  x: number;
  y: number;
}

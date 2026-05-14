export const METERS_PER_MILE = 1609.344;
export const METERS_PER_KILOMETER = 1000;
export const METERS_PER_FOOT = 0.3048;

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}

export function milesToMeters(miles: number): number {
  return miles * METERS_PER_MILE;
}

export function metersToKilometers(meters: number): number {
  return meters / METERS_PER_KILOMETER;
}

export function metersToFeet(meters: number): number {
  return meters / METERS_PER_FOOT;
}

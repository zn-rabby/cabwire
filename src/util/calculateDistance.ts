export const calculateDistance = (
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371; // Earth radius in km
  const dLat = toRad(dropoff.lat - pickup.lat);
  const dLon = toRad(dropoff.lng - pickup.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(pickup.lat)) *
      Math.cos(toRad(dropoff.lat)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 🌍 Convert degree to radian
const toRadians = (degree: number): number => (degree * Math.PI) / 180;

// 📏 Calculate distance (Haversine Formula)
export const getDistanceFromLatLonInKm = (
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): number => {
  if (
    !pickup ||
    !dropoff ||
    typeof pickup.lat !== 'number' ||
    typeof pickup.lng !== 'number' ||
    typeof dropoff.lat !== 'number' ||
    typeof dropoff.lng !== 'number'
  ) {
    throw new Error('Invalid pickup or dropoff coordinates');
  }

  const R = 6371; // Earth radius in kilometers
  const dLat = toRadians(dropoff.lat - pickup.lat);
  const dLon = toRadians(dropoff.lng - pickup.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(pickup.lat)) *
      Math.cos(toRadians(dropoff.lat)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Number(distance.toFixed(2)); // Return up to 2 decimal points
};

// 💵 Calculate fare based on distance
export const calculateDistanceBasedFare = (distance: number): number => {
  if (typeof distance !== 'number' || isNaN(distance) || distance < 0) {
    throw new Error('Invalid distance for fare calculation');
  }

  const baseFare = 50; // Flat base fare
  const ratePerKm = 20; // Per kilometer rate

  const fare = baseFare + distance * ratePerKm;
  return Math.round(fare); // Whole number fare
};

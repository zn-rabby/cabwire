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

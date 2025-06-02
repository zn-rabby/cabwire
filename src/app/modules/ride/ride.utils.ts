// ride.utils.ts
import { ICategory } from '../category/category.interface';
import { IService } from '../service/service.interface';

interface FareCalculationInput {
  category: ICategory;
  service: IService;
  distance?: number; // in km
  duration?: number; // in minutes
}

export const calculateFare = ({
  category,
  service,
  distance = 0,
  duration = 0,
}: FareCalculationInput): number => {
  // Defensive checks for number fields; if missing, use 0
  const ratePerKm =
    typeof category.ratePerKm === 'number' ? category.ratePerKm : 0;
  const ratePerHour =
    typeof category.ratePerHour === 'number' ? category.ratePerHour : 0;
  const baseFare = typeof service.baseFare === 'number' ? service.baseFare : 0;
  const basePrice =
    typeof category.basePrice === 'number' ? category.basePrice : 0;

  // Ensure distance and duration are numbers and >=0
  const dist = typeof distance === 'number' && distance > 0 ? distance : 0;
  const dur = typeof duration === 'number' && duration > 0 ? duration : 0;

  const distanceFare = dist * ratePerKm;
  const durationFare = (dur / 60) * ratePerHour; // duration is in minutes

  const totalFare = baseFare + basePrice + distanceFare + durationFare;

  // Round to 2 decimal places
  const roundedFare = Math.round(totalFare * 100) / 100;

  if (isNaN(roundedFare)) {
    throw new Error('Fare calculation resulted in NaN');
  }

  return roundedFare;
};

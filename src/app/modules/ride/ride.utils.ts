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
  const ratePerKm =
    typeof category.ratePerKm === 'number' ? category.ratePerKm : 0;
  const ratePerHour =
    typeof category.ratePerHour === 'number' ? category.ratePerHour : 0;
  const baseFare = typeof service.baseFare === 'number' ? service.baseFare : 0;
  const basePrice =
    typeof category.basePrice === 'number' ? category.basePrice : 0;

  const dist = typeof distance === 'number' && distance > 0 ? distance : 0;
  const dur = typeof duration === 'number' && duration > 0 ? duration : 0;

  let totalFare = baseFare + basePrice;
  console.log('totalFare', baseFare, baseFare, baseFare);

  if (['car', 'emergency-car'].includes(service.serviceName)) {
    const distanceFare = dist * ratePerKm;
    totalFare += distanceFare;
    // console.log('distanceFare', distanceFare);
  } else if (service.serviceName === 'rental-car') {
    const durationInHours = dur / 60;
    const timeFare = durationInHours * ratePerHour;
    // console.log('timeFare=', timeFare);
    totalFare += timeFare;
  } else {
    throw new Error('Unsupported service type');
  }

  const roundedFare = Math.round(totalFare * 100) / 100;

  if (isNaN(roundedFare)) {
    throw new Error('Fare calculation resulted in NaN');
  }

  console.log('totalFare', totalFare);
  console.log('roundedFare', roundedFare);
  return roundedFare;
};

import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';

interface IDriverLicenseInfo {
  licenseNumber: number;
  licenseExpiryDate: Date;
  uploadDriversLicense: string;
}
interface IDriverVehiclesInfo {
  vehiclesMake: string;
  vehiclesModel: string;
  vehiclesYear: Date;
  vehiclesRegistrationNumber: Number;
  vehiclesInsuranceNumber: Number;
  vehiclesPicture: string;
  vehiclesCategory: Number;
}

export type IUser = {
  name: string;
  role: USER_ROLES;
  email: string;
  password: string;
  contact?: string;
  location?: string;
  geoLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  image?: string;
  status?: 'active' | 'block';
  verified: boolean;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number;
    expireAt: Date;
  };
  gender?: 'male' | 'female' | 'others';
  dateOfBirth?: Date;
  driverLicense?: IDriverLicenseInfo;
  driverVehicles?: IDriverVehiclesInfo;
  isDeleted: boolean;
};

export interface DeleteAccountPayload {
  password: string;
}

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;

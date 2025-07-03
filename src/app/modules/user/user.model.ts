import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { IUser, UserModal } from './user.interface';

// Driver license sub-schema
const driverLicenseSchema = new Schema(
  {
    licenseNumber: { type: Number, required: false },
    licenseExpiryDate: { type: Date, required: false },
    uploadDriversLicense: { type: String, required: false },
  },
  { _id: false }
);

// Driver vehicle sub-schema
const driverVehicleSchema = new Schema(
  {
    vehiclesMake: { type: String },
    vehiclesModel: { type: String },
    vehiclesYear: { type: Date },
    vehiclesRegistrationNumber: { type: Number },
    vehiclesInsuranceNumber: { type: Number },
    vehiclesPicture: { type: String },
    vehiclesCategory: { type: String },
  },
  { _id: false }
);

// User main schema
const userSchema = new Schema<IUser, UserModal>(
  {
    name: { type: String, required: true },
    location: { type: String },
    geoLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        index: '2dsphere',
      },
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 8,
    },
    image: {
      type: String,
      default: 'https://i.ibb.co/z5YHLV9/profile.png',
    },
    contact: { type: String },
    status: {
      type: String,
      enum: ['active', 'block'],
      default: 'active',
    },
    stripeAccountId: { type: String },
    verified: { type: Boolean, default: false },
    driverLicense: { type: driverLicenseSchema },
    driverVehicles: { type: driverVehicleSchema },
    authentication: {
      type: {
        isResetPassword: { type: Boolean, default: false },
        oneTimeCode: { type: Number, default: null },
        expireAt: { type: Date, default: null },
      },
      select: false,
    },
    isOnline: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ geoLocation: '2dsphere' });
//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await User.findById(id);
  return isExist;
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await User.findOne({ email });
  return isExist;
};

//is match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

//check user
userSchema.pre('save', async function (next) {
  //check user
  const isExist = await User.findOne({ email: this.email });
  if (isExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already exist!');
  }

  //password hash
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});

export const User = model<IUser, UserModal>('User', userSchema);

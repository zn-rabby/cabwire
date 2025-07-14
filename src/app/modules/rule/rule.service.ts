import { StatusCodes } from 'http-status-codes';
import { IRule } from './rule.interface';
import { Rule } from './rule.model';
import ApiError from '../../../errors/ApiError';

//privacy policy

const createPrivacyPolicyToDB = async (payload: IRule) => {
  // Destructure payload to get the target audience (driver or user)
  const { content, for: targetFor } = payload;

  // Check if privacy policy exists for that target (driver/user)
  const isExistPrivacy = await Rule.findOne({
    type: 'privacy',
    for: targetFor,
  });

  if (isExistPrivacy) {
    // Update if exists
    const result = await Rule.findOneAndUpdate(
      { type: 'privacy', for: targetFor },
      { content },
      { new: true }
    );
    const message = `Privacy & Policy for ${targetFor} updated successfully`;
    return { message, result };
  } else {
    // Create new if not exists
    const result = await Rule.create({
      ...payload,
      type: 'privacy',
      for: targetFor,
    });
    const message = `Privacy & Policy for ${targetFor} created successfully`;
    return { message, result };
  }
};

const getPrivacyPolicyFromDB = async (targetFor: 'user' | 'driver') => {
  const result = await Rule.findOne({ type: 'privacy', for: targetFor });
  if (!result) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Privacy policy for ${targetFor} doesn't exist!`
    );
  }
  return result;
};
//terms and conditions

const createTermsAndConditionToDB = async (payload: IRule) => {
  const { content, for: targetFor } = payload;

  // Check if terms and conditions exist for the target audience (driver/user)
  const isExistTerms = await Rule.findOne({
    type: 'terms',
    for: targetFor,
  });

  if (isExistTerms) {
    // Update if exists
    const result = await Rule.findOneAndUpdate(
      { type: 'terms', for: targetFor },
      { content },
      { new: true }
    );
    const message = `Terms and Conditions for ${targetFor} updated successfully`;
    return { message, result };
  } else {
    // Create new if not exists
    const result = await Rule.create({
      ...payload,
      type: 'terms',
      for: targetFor,
    });
    const message = `Terms and Conditions for ${targetFor} created successfully`;
    return { message, result };
  }
};

const getTermsAndConditionFromDB = async (targetFor: 'user' | 'driver') => {
  const result = await Rule.findOne({ type: 'terms', for: targetFor });
  if (!result) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Terms and conditions for ${targetFor} don't exist!`
    );
  }
  return result;
};

//privacy policy
const createAboutToDB = async (payload: IRule) => {
  const isExistAbout = await Rule.findOne({ type: 'about' });
  if (isExistAbout) {
    const result = await Rule.findOneAndUpdate(
      { type: 'about' },
      { content: payload?.content },
      { new: true }
    );
    const message = 'About Us Updated successfully';
    return { message, result };
  } else {
    const result = await Rule.create({ ...payload, type: 'about' });
    const message = 'About Us created successfully';
    return { message, result };
  }
};

const getAboutFromDB = async () => {
  const result = await Rule.findOne({ type: 'about' });
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "About doesn't exist!");
  }
  return result;
};

export const RuleService = {
  createPrivacyPolicyToDB,
  getPrivacyPolicyFromDB,
  createTermsAndConditionToDB,
  getTermsAndConditionFromDB,
  createAboutToDB,
  getAboutFromDB,
};

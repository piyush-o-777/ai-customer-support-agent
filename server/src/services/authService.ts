import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { AuthResponse, LoginInput, PublicUser, SignupInput } from '../types/auth.types';
import { HttpError } from '../utils/httpError';
import { signToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatUser = (user: IUser): PublicUser => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
});

export const signup = async (input: SignupInput = {}): Promise<AuthResponse> => {
  const { name, email, password } = input;
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    throw new HttpError(400, 'Name, email, and password are required');
  }
  const trimmedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (!trimmedName || !EMAIL_REGEX.test(normalizedEmail)) {
    throw new HttpError(400, 'Invalid name or email format');
  }
  if (password.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters long');
  }
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new HttpError(409, 'Email is already registered');
  }
  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name: trimmedName,
    email: normalizedEmail,
    passwordHash,
  });
  return {
    token: signToken(user._id.toString()),
    user: formatUser(user),
  };
};

export const login = async (input: LoginInput = {}): Promise<AuthResponse> => {
  const { email, password } = input;
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw new HttpError(400, 'Email and password are required');
  }
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.is_active) {
    throw new HttpError(401, 'Invalid email or password');
  }
  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new HttpError(401, 'Invalid email or password');
  }
  return {
    token: signToken(user._id.toString()),
    user: formatUser(user),
  };
};

export const getCurrentUser = async (userId: string): Promise<{ user: PublicUser }> => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new HttpError(404, 'User not found');
  }
  const user = await User.findById(userId);
  if (!user || !user.is_active) {
    throw new HttpError(404, 'User not found');
  }
  return {
    user: formatUser(user),
  };
};

import * as z from 'zod';

const otpField = z
  .string('Please enter a valid 6-digit OTP.')
  .regex(/^\d{6}$/, 'Please enter a valid 6-digit OTP.');

export const emailSchema = z.object({
  email: z.email('Please enter a valid email.'),
});

export const loginSchema = z.object({
  email: z.email('Please enter a valid email.'),
  password: z.string(),
});

export const registerSchema = loginSchema.extend({
  name: z
    .string('Please Enter a valid string')
    .min(3, 'Name should be at least 3 character long.')
    .max(100, 'Name can max 100 characters.')
    .trim(),
  otp: otpField,
});

export const otpSchema = z.object({
  email: z.email('Please enter a valid email.'),
  otp: otpField,
});

export const createDirectorySchema = z.object({
  dirname: z
    .string()
    .trim()
    .min(3, 'Directory name must be at least 3 characters long')
    .max(100, 'Directory name cannot exceed 100 characters')
    .regex(/^[^<>]*$/, 'Directory name cannot contain HTML tags'),
});

export const renameDirectorySchema = z.object({
  newDirName: z
    .string()
    .trim()
    .min(3, 'Directory name must be at least 3 characters long')
    .max(100, 'Directory name cannot exceed 100 characters')
    .regex(/^[^<>]*$/, 'Directory name cannot contain HTML tags'),
});

export const updateProfileSchema = z.object({
  name: z
    .string('Please Enter a valid string')
    .trim()
    .min(3, 'Name should be at least 3 character long.')
    .max(100, 'Name can max 100 characters.'),
});

const passwordFields = {
  newPassword: z
    .string('Please enter a valid password.')
    .min(4, 'Password must be at least 4 characters long.')
    .max(72, 'Password cannot exceed 72 characters.'),
  confirmPassword: z.string('Please confirm your password.'),
};
const passwordsMatch = (d) => d.newPassword === d.confirmPassword;
const mismatch = {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
};

export const setPasswordSchema = z
  .object(passwordFields)
  .refine(passwordsMatch, mismatch);

export const setPasswordWithOtpSchema = z
  .object({
    email: z.email('Please enter a valid email.'),
    otp: otpField,
    ...passwordFields,
  })
  .refine(passwordsMatch, mismatch);

export const changePasswordSchema = z
  .object({
    otp: otpField,
    ...passwordFields,
  })
  .refine(passwordsMatch, mismatch);
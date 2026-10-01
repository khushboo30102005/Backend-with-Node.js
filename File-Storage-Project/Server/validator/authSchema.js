import * as z from 'zod';

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
  otp: z
    .string('please enter a valid 4 digit otp String.')
    .regex(/^\d{4}$/, 'please enter a valid 4 digit otp.'),
});

export const otpSchema = z.object({
  email: z.email('Please enter a valid email.'),
  otp: z
    .string('please enter a valid 4 digit otp String.')
    .regex(/^\d{4}$/, 'please enter a valid 4 digit otp.'),
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

import * as z from 'zod';


export const emailSchema = z.object({
  email : z.email('Please enter a valid email.')
})

export const loginSchema = z.object({
  email: z.email('Please enter a valid email.'),
  password: z.string(),
});

export const registerSchema = loginSchema.extend({
  name: z
    .string('Please Enter a valid string')
    .min(3, 'Name should be at least 3 character long.')
    .max(100, 'Name can max 100 characters.'),
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



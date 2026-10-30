import * as z from 'zod';
import { MAX_LIFETIME_MS, MIN_LIFETIME_MS } from '../utils/workspaceAccess.js';

const noHtml = /^[^<>]*$/;

const name = z
  .string('Please enter a valid name')
  .trim()
  .min(3, 'Workspace name must be at least 3 characters long')
  .max(100, 'Workspace name cannot exceed 100 characters')
  .regex(noHtml, 'Workspace name cannot contain HTML tags');

const description = z
  .string()
  .trim()
  .max(500, 'Description cannot exceed 500 characters')
  .regex(noHtml, 'Description cannot contain HTML tags');

// Validated against the server clock at request time, never trusting the client.
const expiresAt = z.coerce
  .date('Please enter a valid expiry date and time')
  .refine(
    (d) => d.getTime() >= Date.now() + MIN_LIFETIME_MS,
    'Expiry must be at least 5 minutes from now',
  )
  .refine(
    (d) => d.getTime() <= Date.now() + MAX_LIFETIME_MS,
    `Expiry cannot be more than ${Math.round(MAX_LIFETIME_MS / 86400000)} days from now`,
  );

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');
const memberRole = z.enum(['editor', 'viewer']);

export const createWorkspaceSchema = z.object({
  name,
  description: description.default(''),
  expiresAt,
  cleanupPolicy: z.enum(['archive', 'delete']).default('delete'),
  members: z
    .array(z.object({ userId: objectId, role: memberRole }))
    .max(50, 'A workspace can have at most 50 members')
    .default([]),
});

export const updateWorkspaceSchema = z
  .object({
    name: name.optional(),
    description: description.optional(),
    expiresAt: expiresAt.optional(),
    cleanupPolicy: z.enum(['archive', 'delete']).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const addMemberSchema = z.object({ userId: objectId, role: memberRole });
export const updateMemberSchema = z.object({ role: memberRole });
export const transferSchema = z.object({ userId: objectId });
export const renameWorkspaceFileSchema = z.object({
  newFilename: z
    .string()
    .trim()
    .min(1, 'File name cannot be empty')
    .max(255, 'File name cannot exceed 255 characters')
    .regex(/^[^<>/\\]*$/, 'File name contains invalid characters'),
});

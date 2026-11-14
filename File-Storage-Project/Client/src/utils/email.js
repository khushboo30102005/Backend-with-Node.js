// The server only answers exact email lookups (audit M6: no prefix search,
// so registered users can't be listed letter by letter). Only ask once the
// input is a complete address, using the same rule as the server.
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

export const isCompleteEmail = (value) =>
  typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value.trim());

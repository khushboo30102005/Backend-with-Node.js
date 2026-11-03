// One error type for everything the AI layer can fail with. `code` is stable
// (the UI branches on it); `message` is safe to show to the user.
export class AiError extends Error {
  constructor(code, message, status = 500, extra = {}) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.status = status;
    this.extra = extra;
  }
}

export function sendAiError(res, err, next) {
  if (err instanceof AiError) {
    return res
      .status(err.status)
      .json({ error: err.message, code: err.code, ...err.extra });
  }
  return next(err);
}

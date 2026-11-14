// Multi-document transactions for file/folder operations (audit M8).
//
// Moves, trash/restore, permanent deletes and upload commits each touch
// several documents (the item, its descendants, Share rows, insights, and the
// size of every ancestor folder). Run one by one, a failure or crash half-way
// left the tree inconsistent: descendants with stale paths, folders half in
// Trash, file documents without storage charged, storage that was never given
// back. runInTransaction() makes those database steps all-or-nothing.
//
// With `transactionAsyncLocalStorage` Mongoose attaches the transaction's
// session to every operation started inside the callback, including the ones
// in shared helpers such as updateDirectorySize(), so they need no changes.
//
// Rules for callbacks:
//   - database work only: no B2 calls and no responses. MongoDB may retry the
//     callback on a transient error, so it must be safe to run more than once;
//     storage (B2) steps are ordered around the transaction by the caller.
//   - return a value describing the outcome; the caller responds after commit.
//
// MongoDB only supports transactions on a replica set or sharded cluster
// (Atlas always is). On a standalone server (some local setups) the first
// attempt fails with IllegalOperation; we then log once and run callbacks
// without a transaction, i.e. the previous behaviour.
import mongoose from 'mongoose';

mongoose.set('transactionAsyncLocalStorage', true);

let supported = null; // null = not known yet

const isUnsupported = (err) =>
  err?.code === 20 ||
  err?.codeName === 'IllegalOperation' ||
  /Transaction numbers are only allowed on a replica set|transactions are not supported/i.test(
    err?.message || '',
  );

export async function runInTransaction(fn, { connection = mongoose.connection } = {}) {
  if (supported === false) return fn();
  let result;
  try {
    await connection.transaction(async () => {
      result = await fn();
    });
  } catch (err) {
    if (supported !== true && isUnsupported(err)) {
      supported = false;
      console.warn(
        '[transaction] MongoDB does not support transactions here (standalone server); ' +
          'multi-step file operations will run without them. Use a replica set in production.',
      );
      return fn();
    }
    throw err;
  }
  supported = true;
  return result;
}

/** Test hook: forget what was learned about transaction support. */
export function resetTransactionSupport() {
  supported = null;
}

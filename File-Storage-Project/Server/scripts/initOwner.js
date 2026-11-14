// Initial Owner setup CLI (one time only). See services/ownerBootstrapService.js.
//
//   npm run owner:token              print a fresh setup token and its hash
//   npm run owner:init               create the first Owner (interactive)
//   npm run owner:init -- --promote-existing
//                                    make an already registered account the Owner
//
// Steps for the operator:
//   1. `npm run owner:token`; put the printed hash in .env as
//      OWNER_SETUP_TOKEN_HASH and keep the token itself somewhere safe.
//   2. `npm run owner:init`; enter the token, the Owner details and the OTP
//      emailed to the Owner address.
//   3. Remove OWNER_SETUP_TOKEN_HASH from .env. (Setup is permanently
//      disabled after it succeeds anyway.)
import os from 'node:os';
import readline from 'node:readline';
import { generateSetupToken } from '../utils/ownerSetupToken.js';

const args = new Set(process.argv.slice(2));

if (args.has('--generate-token')) {
  const { token, hash } = generateSetupToken();
  console.log('Setup token (give to the operator, do NOT store it in .env):');
  console.log(`  ${token}\n`);
  console.log('Add this line to the server .env:');
  console.log(`  OWNER_SETUP_TOKEN_HASH=${hash}`);
  process.exit(0);
}

for (const a of args) {
  if (a !== '--promote-existing') {
    console.error(`Unknown option: ${a}`);
    process.exit(2);
  }
}
const promoteExisting = args.has('--promote-existing');

if (!process.stdin.isTTY) {
  console.error('Owner setup must be run from an interactive terminal.');
  process.exit(2);
}

// ---------------------------------------------------------------- prompts

function ask(question, { hidden = false } = {}) {
  if (hidden) return askHidden(question);
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Reads a line in raw mode without echoing it (secrets never hit the screen
// or the terminal scrollback).
function askHidden(question) {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          stdout.write('\n');
          return resolve(value); // not trimmed: spaces may be part of a password
        }
        if (ch === '\u0003') {
          stdin.setRawMode(false);
          stdout.write('\n');
          process.exit(130); // Ctrl+C
        }
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else if (ch >= ' ') value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

// ---------------------------------------------------------------- main

// Database / Redis connections are only opened once we are actually running.
const { connectDB } = await import('../config/db.js');
const { default: mongoose } = await import('mongoose');
const { default: redisClient } = await import('../config/redis.js');
const svc = await import('../services/ownerBootstrapService.js');

const context = { source: 'cli', host: os.hostname(), osUser: safeUser() };
function safeUser() {
  try {
    return os.userInfo().username;
  } catch {
    return '';
  }
}

let exitCode = 0;
try {
  await connectDB();

  if (!svc.isSetupConfigured()) {
    throw new svc.OwnerSetupError(
      'SETUP_DISABLED',
      'OWNER_SETUP_TOKEN_HASH is not set. Run `npm run owner:token` first.',
    );
  }
  const status = await svc.getOwnerSetupStatus();
  if (!status.available) {
    throw new svc.OwnerSetupError(
      'ALREADY_INITIALIZED',
      'An Owner already exists. Initial Owner setup is permanently disabled.',
    );
  }

  console.log('\n=== StorageApp: initial Owner setup ===\n');
  const setupToken = (await ask('Setup token: ', { hidden: true })).trim();
  const email = await ask('Owner email: ');

  let name;
  let password;
  if (!promoteExisting) {
    name = await ask('Owner name: ');
    password = await ask('Password (min 12 chars, upper/lower/digit/symbol): ', { hidden: true });
    const confirm = await ask('Confirm password: ', { hidden: true });
    if (password !== confirm) {
      throw new svc.OwnerSetupError('INVALID_INPUT', 'Passwords do not match.');
    }
    svc.validateNewOwner({ name, email, password }); // fail fast before emailing
  }

  const { email: target } = await svc.requestOwnerVerification({ setupToken, email, context });
  console.log(`\nA verification code was sent to ${target}.`);
  const otp = await ask('Verification code: ');

  const result = await svc.initializeOwner({
    setupToken,
    name,
    email,
    password,
    otp,
    promoteExisting,
    context,
  });
  console.log(
    `\nOwner ${result.promoted ? 'promoted' : 'created'}: ${result.email} (${result.ownerId}).`,
  );
  console.log('Initial Owner setup is now permanently disabled.');
  console.log('Remove OWNER_SETUP_TOKEN_HASH from the server environment.');
} catch (err) {
  exitCode = 1;
  if (err instanceof svc.OwnerSetupError) {
    console.error(`\nOwner setup refused (${err.code}): ${err.message}`);
  } else {
    console.error('\nOwner setup failed:', err);
  }
} finally {
  await mongoose.disconnect().catch(() => {});
  await redisClient.quit().catch(() => {});
  process.exit(exitCode);
}

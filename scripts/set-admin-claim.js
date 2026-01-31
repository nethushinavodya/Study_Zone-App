#!/usr/bin/env node
/**
 * Set `admin` custom claim for a Firebase Authentication user by email.
 * Usage:
 *   node scripts/set-admin-claim.js --email user@example.com --key C:\path\to\serviceAccountKey.json
 *
 * Steps:
 *  - Ensure you have a service account JSON (Firebase Console -> Project settings -> Service accounts).
 *  - Install dependencies: npm install firebase-admin yargs
 */

const admin = require('firebase-admin');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('email', { type: 'string', description: 'Email of user to grant admin claim', demandOption: true })
  .option('key', { type: 'string', description: 'Path to service account JSON file', demandOption: true })
  .help()
  .argv;

async function main() {
  const { email, key } = argv;

  let serviceAccount;
  try {
    serviceAccount = require(key);
  } catch (err) {
    console.error(`Failed to read service account key at path: ${key}`);
    console.error(err && err.message ? err.message : err);
    process.exitCode = 1;
    return;
  }

  try {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch {
    // ignore if already initialized in the same process
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log(`Found user: uid=${user.uid} email=${user.email}`);

    // Set custom claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Set custom claim { admin: true } for ${email}`);

    // Revoke refresh tokens so clients will refresh and get the new claims
    await admin.auth().revokeRefreshTokens(user.uid);
    console.log('Revoked refresh tokens for user; ask the user to sign out and sign in again to obtain new token.');

    console.log('Done.');
  } catch (err) {
    console.error('Error while setting admin claim:', err && err.message ? err.message : err);
    process.exitCode = 1;
  }
}

main();

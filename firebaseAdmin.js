// lib/firebaseAdmin.js
//
// Shared Firebase Admin SDK initializer for the Mooffers serverless
// functions (api/mooffers/callback.js, api/mooffers/offers.js).
//
// This file lives OUTSIDE the /api folder on purpose — anything inside
// /api becomes a public route on Vercel, and this file must never be
// directly callable.
//
// Required environment variables (set these in Vercel → Settings →
// Environment Variables, not in this file, and not in index.html):
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY   (paste with real newlines; this file converts
//                            literal "\n" sequences back to newlines below,
//                            which is the standard workaround for how
//                            Vercel stores multi-line env vars)
//
// Get these three values from Firebase Console → Project settings →
// Service accounts → Generate new private key (downloads a JSON file with
// project_id / client_email / private_key fields — copy those three
// values into the env vars above; do not commit that JSON file anywhere).

const admin = require('firebase-admin');

function getAdminApp(){
  if(admin.apps.length) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if(!projectId || !clientEmail || !privateKey){
    throw new Error(
      'Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID, ' +
      'FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in Vercel Environment Variables.'
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });
}

function getDb(){
  getAdminApp();
  return admin.firestore();
}

module.exports = { admin, getAdminApp, getDb };

// api/mooffers/callback.js
//
// Mooffers Server-to-Server (S2S) postback endpoint:
//   https://apexify-com.vercel.app/api/mooffers/callback
//
// This is the ONLY place a Mooffers task/offer/survey turns into real BDT
// balance. It never trusts anything from the browser — only this server
// call, verified against MOOFFERS_POSTBACK_SECRET, can credit a user.
//
// Required environment variables:
//   MOOFFERS_POSTBACK_SECRET        — shared secret, see verification note below
//   MOOFFERS_USER_PAYOUT_PERCENT    — e.g. "80" (defaults to 80 if unset)
//   FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
//     (see lib/firebaseAdmin.js for how these are used)
//
// -----------------------------------------------------------------------
// IMPORTANT — please read before going live:
// I do not have Mooffers' official callback documentation (it's gated
// behind their account-manager pre-approval, same as most offerwall
// networks), so I can't state with certainty which exact query-parameter
// names or signature algorithm they use. Rather than invent a signature
// scheme and present it as verified, this endpoint implements the
// simplest, universally-supported verification method: you paste the
// secret directly into the Callback URL you configure in the Mooffers
// dashboard, e.g.
//
//   https://apexify-com.vercel.app/api/mooffers/callback?secret=YOUR_MOOFFERS_POSTBACK_SECRET
//
// and this file checks that the incoming `secret` (or `token`) query
// param matches MOOFFERS_POSTBACK_SECRET before crediting anything. This
// works with both GET and POST postbacks and needs no shared crypto
// scheme. If your Mooffers dashboard instead gives you an HMAC
// signature to verify, tell me the exact algorithm/fields and I'll wire
// real signature verification into the block marked below instead of the
// plain secret check.
//
// Parameter names: this file reads several common aliases for each field
// (uid/user_id/sub1, offer_id/offerid, amount/payout/reward/value, etc.)
// since the exact Mooffers field names weren't in any doc I could check.
// If a real postback arrives with different field names, only the
// `readParams()` function below needs updating.
// -----------------------------------------------------------------------

const { getDb, admin } = require('../../lib/firebaseAdmin');

function readParams(req){
  const src = { ...(req.query || {}), ...(req.body && typeof req.body === 'object' ? req.body : {}) };
  const pick = (...keys) => {
    for(const k of keys){ if(src[k] !== undefined && src[k] !== '') return src[k]; }
    return undefined;
  };
  return {
    secret: pick('secret', 'token', 'postback_secret'),
    uid: pick('uid', 'user_id', 'sub1', 'publisher_user_id'),
    offerId: pick('offer_id', 'offerid', 'campaign_id') || '',
    offerName: pick('offer_name', 'offername', 'title') || 'Mooffers offer',
    conversionId: pick('conversion_id', 'transaction_id', 'txn_id', 'click_id', 'clickid'),
    grossReward: Number(pick('amount', 'payout', 'reward', 'value', 'revenue') || 0),
    currency: pick('currency') || 'USD',
    sub1: pick('sub1') || '',
    sub2: pick('sub2') || ''
  };
}

module.exports = async function handler(req, res){
  if(req.method !== 'GET' && req.method !== 'POST'){
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).send('method_not_allowed');
  }

  const p = readParams(req);

  // ---- Verification (see note above) ----
  const expectedSecret = process.env.MOOFFERS_POSTBACK_SECRET;
  if(!expectedSecret){
    console.error('MOOFFERS_POSTBACK_SECRET is not set');
    return res.status(500).send('server_misconfigured');
  }
  if(!p.secret || p.secret !== expectedSecret){
    return res.status(401).send('invalid_secret');
  }

  if(!p.uid){
    return res.status(400).send('missing_uid');
  }
  if(!p.conversionId){
    return res.status(400).send('missing_conversion_id');
  }
  if(!(p.grossReward > 0)){
    return res.status(400).send('missing_or_zero_reward');
  }

  const payoutPercent = Number(process.env.MOOFFERS_USER_PAYOUT_PERCENT || 80);
  const exchangeRate = 80; // 1 USD = 80 BDT, per the integration brief

  // Mooffers reward amounts are assumed to be in USD unless `currency`
  // says otherwise. If Mooffers actually sends BDT (or points) directly,
  // adjust this conversion — see the brief's own note: "যদি Mooffers
  // callback amount USD না হয়ে অন্য unit হয়, official Mooffers
  // documentation অনুযায়ী সঠিক conversion করবে।"
  const grossBdt = p.currency.toUpperCase() === 'BDT' ? p.grossReward : p.grossReward * exchangeRate;
  const userRewardBdt = Math.round(grossBdt * (payoutPercent / 100) * 100) / 100;

  const db = getDb();
  const conversionRef = db.collection('mooffersConversions').doc(String(p.conversionId));
  const userRef = db.collection('users').doc(String(p.uid));

  try{
    const result = await db.runTransaction(async (tx)=>{
      const [conversionSnap, userSnap] = await Promise.all([tx.get(conversionRef), tx.get(userRef)]);

      // Duplicate protection: the conversion ID doc already exists → this
      // exact conversion was already credited, so do nothing and report
      // success (Mooffers may legitimately retry a postback).
      if(conversionSnap.exists){
        return { duplicate: true };
      }

      if(!userSnap.exists){
        throw new Error('user_not_found');
      }

      const userData = userSnap.data() || {};
      const newMainBalance = Number(userData.mainBalance || 0) + userRewardBdt;
      const newTotalRevenue = Number(userData.totalRevenue || 0) + userRewardBdt;

      tx.set(conversionRef, {
        uid: p.uid,
        provider: 'mooffers',
        offerId: p.offerId,
        offerName: p.offerName,
        conversionId: String(p.conversionId),
        grossReward: p.grossReward,
        userReward: userRewardBdt,
        currency: 'BDT',
        status: 'approved',
        source: p.sub1 || '',
        sub1: p.sub1,
        sub2: p.sub2,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      tx.update(userRef, {
        mainBalance: newMainBalance,
        totalRevenue: newTotalRevenue,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const txRef = db.collection('transactions').doc();
      tx.set(txRef, {
        uid: p.uid,
        type: 'task',
        title: `Mooffers offer — ${p.offerName}`,
        amount: userRewardBdt,
        source: 'mooffers',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const notifRef = userRef.collection('notifications').doc();
      tx.set(notifRef, {
        title: 'Task approved',
        body: `৳${userRewardBdt} has been added to your main balance`,
        type: 'task',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { duplicate: false, userRewardBdt };
    });

    if(result.duplicate){
      return res.status(200).send('duplicate_ignored');
    }
    return res.status(200).send('ok');
  }catch(e){
    console.error('Mooffers callback failed:', e);
    if(e.message === 'user_not_found'){
      return res.status(404).send('user_not_found');
    }
    return res.status(500).send('internal_error');
  }
};

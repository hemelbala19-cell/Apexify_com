// api/mooffers/offers.js
//
// GET /api/mooffers/offers?type=offers|surveys&uid=<firebase-uid>
//
// Server-side proxy for the Mooffers Offers API and Surveys API. The
// frontend (index.html) calls THIS endpoint — never mooffers.com directly —
// so that MOOFFERS_API_KEY never has to be exposed in browser JavaScript.
//
// Required environment variable:
//   MOOFFERS_API_KEY   (from the master prompt: key_05b7da9609784b972c5830da6332e59f)
//
// -----------------------------------------------------------------------
// IMPORTANT — please read before relying on this in production:
// Mooffers' exact request-authentication method (an Authorization header?
// a query-string api_key? a custom header name?) and the exact JSON shape
// of their /offers and /surveys responses are not in any document that was
// shared with me, and their integration docs are gated behind an
// account-manager pre-approval step (this is standard across offerwall
// networks — Mooffers is not unusual here). I could not verify these
// details against Mooffers' real docs.
//
// This file sends the API key as an `Authorization: Bearer` header, which
// is the most common convention, and defensively unwraps a few likely
// response shapes on the way back to the frontend. Once you (or your
// Mooffers account manager) confirm the real auth method and response
// shape, only the two spots marked "ADJUST THIS" below should need to
// change.
// -----------------------------------------------------------------------

const MOOFFERS_APP_ID = 'app_04b2365e10ff84db';

module.exports = async function handler(req, res){
  if(req.method !== 'GET'){
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const apiKey = process.env.MOOFFERS_API_KEY;
  if(!apiKey){
    return res.status(500).json({ error: 'server_misconfigured', message: 'MOOFFERS_API_KEY is not set' });
  }

  const type = (req.query.type === 'surveys') ? 'surveys' : 'offers';
  const uid = String(req.query.uid || '').trim();
  if(!uid){
    return res.status(400).json({ error: 'missing_uid' });
  }

  let url;
  if(type === 'surveys'){
    const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const clientUa = req.headers['user-agent'] || '';
    const params = new URLSearchParams({
      uid,
      client_ip: clientIp,
      client_useragent: clientUa,
      sdk: 'web',
      sub1: uid,
      sub2: '',
      sub3: ''
    });
    url = `https://api.mooffers.com/api/v1/surveys/${MOOFFERS_APP_ID}?${params.toString()}`;
  } else {
    url = `https://api.mooffers.com/api/v1/offers/${MOOFFERS_APP_ID}`;
  }

  try{
    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        // ADJUST THIS if Mooffers expects a different header/param for the key.
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if(!upstream.ok){
      const text = await upstream.text().catch(()=> '');
      return res.status(upstream.status).json({ error: 'upstream_error', status: upstream.status, body: text.slice(0, 500) });
    }

    const data = await upstream.json();

    // ADJUST THIS if the real response wraps the list under a different key.
    const list = Array.isArray(data) ? data : (data.offers || data.surveys || data.data || data.items || []);

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json({ [type]: list });
  }catch(e){
    console.error('Mooffers offers/surveys proxy failed:', e);
    return res.status(502).json({ error: 'fetch_failed' });
  }
};


import jwt from 'jsonwebtoken';
function parseCreds(src){ if(!src) return null; try { return JSON.parse(src); } catch(e){ return null; } }
function makeJWT(creds, scope){
  const now = Math.floor(Date.now()/1000);
  const payload = { iss: creds.client_email, scope, aud: creds.token_uri || 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 };
  return jwt.sign(payload, creds.private_key, { algorithm: 'RS256' });
}
export async function driveUpload(name, contentBase64){
  const creds = parseCreds(process.env.DRIVE_CREDENTIALS_JSON); if(!creds) return { ok:false, error:'No DRIVE_CREDENTIALS_JSON' };
  const assertion = makeJWT(creds, 'https://www.googleapis.com/auth/drive.file');
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({ grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  const token = await tokenRes.json(); if(!token.access_token) return { ok:false, error:'No access token', token };
  const meta = { name }; const boundary='BOUNDARY123';
  const body = [`--${boundary}`,'Content-Type: application/json; charset=UTF-8','',JSON.stringify(meta),
    `--${boundary}`,'Content-Type: application/octet-stream','Content-Transfer-Encoding: base64','',contentBase64,`--${boundary}--`].join('\r\n');
  const up = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method:'POST', headers:{ 'Authorization':`Bearer ${token.access_token}`, 'Content-Type':`multipart/related; boundary=${boundary}` }, body });
  const j = await up.json(); return { ok: up.ok, file: j };
}
export async function calendarPublish(events){
  const creds = parseCreds(process.env.CALENDAR_CREDENTIALS_JSON); if(!creds) return { ok:false, error:'No CALENDAR_CREDENTIALS_JSON' };
  return { ok:true, count: events?.length||0 };
}

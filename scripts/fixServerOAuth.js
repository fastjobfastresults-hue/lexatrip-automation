const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add business.manage scope to googleScopes in server.js
const oldScopes = `  const googleScopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/blogger'
  ].join(' ');`;

const newScopes = `  const googleScopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/blogger',
    'https://www.googleapis.com/auth/business.manage'
  ].join(' ');`;

code = code.replace(oldScopes, newScopes);

// 2. In /api/auth/youtube/callback, also update dest.channels.google_business
const oldDestSave = `      if (dest.channels?.blogger) {
        dest.channels.blogger.credentials = {
          ...dest.channels.blogger.credentials,
          accessToken: access_token,
          refreshToken: refresh_token || dest.channels.blogger.credentials?.refreshToken || dest.channels.youtube?.credentials?.refreshToken,
          clientId,
          clientSecret,
          tokenExpiry: new Date(Date.now() + (expires_in || 3600) * 1000).toISOString(),
          blogId: dest.channels.blogger.credentials?.blogId || '4024327205805487932',
          blogUrl: dest.channels.blogger.credentials?.blogUrl || 'https://lexatripjaisalmer.blogspot.com/',
          publishMethod: 'api',
          isLifetime: true
        };
      }`;

const newDestSave = `      if (dest.channels?.blogger) {
        dest.channels.blogger.credentials = {
          ...dest.channels.blogger.credentials,
          accessToken: access_token,
          refreshToken: refresh_token || dest.channels.blogger.credentials?.refreshToken || dest.channels.youtube?.credentials?.refreshToken,
          clientId,
          clientSecret,
          tokenExpiry: new Date(Date.now() + (expires_in || 3600) * 1000).toISOString(),
          blogId: dest.channels.blogger.credentials?.blogId || '4024327205805487932',
          blogUrl: dest.channels.blogger.credentials?.blogUrl || 'https://lexatripjaisalmer.blogspot.com/',
          publishMethod: 'api',
          isLifetime: true
        };
      }
      if (dest.channels?.google_business) {
        dest.channels.google_business.credentials = {
          ...dest.channels.google_business.credentials,
          accessToken: access_token,
          refreshToken: refresh_token || dest.channels.google_business.credentials?.refreshToken || dest.channels.youtube?.credentials?.refreshToken,
          clientId,
          clientSecret,
          isLifetime: true
        };
      }`;

code = code.replace(oldDestSave, newDestSave);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully enhanced server.js Google Multi-Cloud OAuth!');

const data = require('../database/data.json');

console.log('=== FULL CHANNELS AUDIT ===\n');
data.destinations.forEach((d, i) => {
  const fb = d.channels && d.channels.facebook;
  const ig = d.channels && d.channels.instagram;
  const yt = d.channels && d.channels.youtube;
  const li = d.channels && d.channels.linkedin;
  const gb = d.channels && d.channels.google_business;
  const bl = d.channels && d.channels.blogger;
  const th = d.channels && d.channels.threads;
  const pin = d.channels && d.channels.pinterest;

  console.log(`${i + 1}. [${d.id}] ${d.name}`);
  console.log(`   FB Page:    ${fb && fb.credentials && fb.credentials.pageId ? fb.credentials.pageId : '❌ NONE'} (Enabled: ${fb && fb.enabled})`);
  console.log(`   Instagram:  ${ig && ig.credentials && ig.credentials.instagramAccountId ? ig.credentials.instagramAccountId : '❌ NONE'} (Enabled: ${ig && ig.enabled})`);
  console.log(`   YouTube:    ${yt && yt.credentials && yt.credentials.channelId ? yt.credentials.channelId + ' (' + yt.handle + ')' : '❌ NONE'} (Enabled: ${yt && yt.enabled})`);
  console.log(`   LinkedIn:   ${li && li.credentials && li.credentials.organizationUrn ? li.credentials.organizationUrn : '❌ NONE'} (Enabled: ${li && li.enabled})`);
  console.log(`   GBP:        ${gb && gb.credentials && gb.credentials.storeCode ? gb.credentials.storeCode + ' (Profile: ' + gb.credentials.businessProfileId + ')' : '❌ NONE'} (Enabled: ${gb && gb.enabled})`);
  console.log(`   Blogger:    ${bl && bl.credentials && bl.credentials.blogId ? bl.credentials.blogId + ' (' + bl.credentials.blogUrl + ')' : '⚠️ NO BLOG ID (' + (bl && bl.credentials && bl.credentials.blogUrl ? bl.credentials.blogUrl : 'none') + ')'}`);
  console.log(`   Threads:    ${th && th.credentials && (th.credentials.threadsHandle || th.credentials.accessToken) ? (th.credentials.threadsHandle || 'Token active') : '❌ NONE'} (Enabled: ${th && th.enabled})`);
  console.log(`   Pinterest:  ${pin && pin.credentials && pin.credentials.accessToken ? 'Token Active' : '❌ NONE'} (Enabled: ${pin && pin.enabled})`);
  console.log('');
});

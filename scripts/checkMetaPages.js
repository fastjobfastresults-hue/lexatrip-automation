const axios = require('axios');
const path = require('path');
const data = require(path.join(__dirname, '../database/data.json'));

async function checkMetaPages() {
  const token = data.destinations[0].channels.facebook.credentials.pageAccessToken;
  console.log('Testing Meta Accounts endpoint with token...');
  try {
    const res = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: {
        access_token: token,
        fields: 'id,name,access_token,instagram_business_account{id,username}'
      }
    });
    console.log(`Found ${res.data.data.length} Pages:`);
    res.data.data.forEach(p => {
      console.log(`- Page: ${p.name} (ID: ${p.id}) | IG: ${p.instagram_business_account ? p.instagram_business_account.username + ' (' + p.instagram_business_account.id + ')' : 'None'}`);
    });
  } catch(e) {
    console.error('Error fetching Meta accounts:', e.response?.data || e.message);
  }
}

checkMetaPages();

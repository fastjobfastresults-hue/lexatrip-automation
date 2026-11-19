const axios = require('axios');
const path = require('path');
const fs = require('fs');

const token = '9283650493:AAEbHNXPtWnej_39TBrCQ3y8yXZUESR2D7E';
const baseUrl = `https://api.telegram.org/bot${token}`;

async function run() {
  const res = await axios.get(`${baseUrl}/getUpdates`);
  console.log('Total updates found:', res.data.result.length);
  res.data.result.forEach((u, i) => {
    const m = u.message || u.channel_post;
    console.log(`Update ${i + 1} (${u.update_id}):`, m?.chat?.title, m?.photo ? 'Photo' : 'Text', m?.caption?.slice(0, 50) || m?.text?.slice(0, 50));
  });
}

run().catch(console.error);

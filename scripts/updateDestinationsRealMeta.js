const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'database', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 1. Update Jaisalmer
const jaisalmer = data.destinations.find(d => d.id === 'dest_jaisalmer');
if (jaisalmer) {
  if (jaisalmer.channels.facebook) {
    jaisalmer.channels.facebook.name = 'Facebook Page (Lexatripjaisalmer)';
    jaisalmer.channels.facebook.handle = 'https://www.facebook.com/profile.php?id=61594513580628';
    jaisalmer.channels.facebook.credentials.pageId = '1190728550800516';
  }
  if (jaisalmer.channels.linkedin) {
    jaisalmer.channels.linkedin.handle = 'https://www.linkedin.com/company/144145872/';
    jaisalmer.channels.linkedin.credentials.organizationUrn = 'urn:li:organization:144145872';
  }
}

// 2. Update Tirupati
const tirupati = data.destinations.find(d => d.id === 'dest_tirupati');
if (tirupati && tirupati.channels.facebook) {
  tirupati.channels.facebook.name = 'Facebook Page (Lexatriptirupati)';
  tirupati.channels.facebook.handle = 'https://www.facebook.com/1385624654624388';
  tirupati.channels.facebook.credentials.pageId = '1385624654624388';
}

// 3. Update Mount Abu
const mountabu = data.destinations.find(d => d.id === 'dest_mountabu');
if (mountabu && mountabu.channels.facebook) {
  mountabu.channels.facebook.name = 'Facebook Page (Lexatripmountabu)';
  mountabu.channels.facebook.handle = 'https://www.facebook.com/profile.php?id=61594050853686';
  mountabu.channels.facebook.credentials.pageId = '1387953687723780';
}

// 4. Update Munnar
const munnar = data.destinations.find(d => d.id === 'dest_munnar');
if (munnar && munnar.channels.facebook) {
  munnar.channels.facebook.name = 'Facebook Page (Lexatripmunnar)';
  munnar.channels.facebook.handle = 'https://www.facebook.com/profile.php?id=61594170400993';
  munnar.channels.facebook.credentials.pageId = '1361009330428038';
}

// 5. Update Varanasi
const varanasi = data.destinations.find(d => d.id === 'dest_varanasi');
if (varanasi && varanasi.channels.facebook) {
  varanasi.channels.facebook.name = 'Facebook Page (Lexatripvaranasi)';
  varanasi.channels.facebook.handle = 'https://www.facebook.com/profile.php?id=61594116223402';
  varanasi.channels.facebook.credentials.pageId = '1387213014467886';
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Updated database/data.json with exact real Facebook and LinkedIn pages successfully!');

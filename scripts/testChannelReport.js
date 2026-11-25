function buildChannelShortSummary(text) {
  if (!text || typeof text !== 'string') return text;

  const lines = text.split('\n');
  const socialLinks = [];
  let header = '';
  let destination = '';
  let contentTitle = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip dashboard links and website URLs
    if (line.includes('onrender.com') || line.includes('लाइव डैशबोर्ड') || line.includes('लाइव वेब डैशबोर्ड') || line.includes('bookings.lexatrip.com')) {
      continue;
    }

    // Skip admin troubleshooting / advisory sections
    if (line.includes('अन्य चैनल्स स्थिति') || line.includes('विफल चैनल्स के क्रेडेंशियल्स') || line.includes('सीक्रेट API वॉल्ट')) {
      while (i + 1 < lines.length && (lines[i+1].trim().startsWith('• ⏸️') || lines[i+1].trim().startsWith('• ⏳') || lines[i+1].trim().startsWith('🛠️') || lines[i+1].trim().startsWith('⚠️'))) {
        i++;
      }
      continue;
    }

    // Capture header
    if (line.startsWith('✅') || line.startsWith('🎬') || line.startsWith('⚠️') || line.startsWith('🚨') || line.startsWith('🔄') || line.startsWith('📋')) {
      if (!header) header = line;
      continue;
    }

    // Capture destination
    if (line.includes('डेस्टिनेशन:')) {
      destination = line;
      continue;
    }

    // Capture content / title
    if (line.includes('पोस्ट:') || line.includes('कंटेंट:') || line.includes('टाइटल:') || line.includes('रील:')) {
      contentTitle = line;
      continue;
    }

    // Capture social media links
    if (line.includes('Live Post') || line.includes('Reel') || line.includes('Article') || line.includes('Profile') || line.match(/•\s*(?:✅\s*)?\[.+\]\(http.+\)/)) {
      socialLinks.push(line);
      continue;
    }
  }

  // Construct Clean Channel Short Summary
  const out = [];
  if (header) out.push(header);
  out.push('');
  if (destination) out.push(destination);
  if (contentTitle) out.push(contentTitle);

  if (socialLinks.length > 0) {
    out.push('🚀 *सोशल मीडिया:* ' + socialLinks.length + ' प्लेटफॉर्म्स पर लाइव\n');
    out.push('🔗 *सोशल मीडिया लिंक्स:*');
    socialLinks.forEach(l => out.push(l));
  } else {
    out.push('🚀 *सोशल मीडिया:* पब्लिशिंग प्रक्रिया जारी...');
  }

  return out.join('\n');
}

const samplePostMsg = `✅ *[लाइव पब्लिशिंग संपन्न]* 🐪\n\n` +
  `📍 *डेस्टिनेशन:* लेक्सा ट्रिप जैसलमेर (Lexa Trip Jaisalmer)\n` +
  `📝 *पोस्ट:* गोल्डन फोर्ट और कैमल सफारी (4:5 HD)\n` +
  `🕒 *समय:* 08:30 AM\n\n` +
  `🔗 *वेरिफाइड लाइव पोस्ट लिंक्स (सीधे क्लिक करें):*\n` +
  `• [📘 Facebook Page Live Post](https://www.facebook.com/1190728550800516/posts/123)\n` +
  `• [📸 Instagram Business Live Post](https://www.instagram.com/p/123)\n` +
  `• [📰 Google Blogger Live Article](https://lexatripjaisalmer.blogspot.com/2026/11/post.html)\n\n` +
  `📋 *अन्य चैनल्स स्थिति:*\n` +
  `• ⏳ 📌 Pinterest: नया ऐप रिव्यू में है\n\n` +
  `🌐 *लाइव डैशबोर्ड:* https://lexa-trip-automation.onrender.com`;

console.log('--- CHANNEL OUTPUT ---');
console.log(buildChannelShortSummary(samplePostMsg));

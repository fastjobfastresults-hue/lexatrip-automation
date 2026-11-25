const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'services', 'telegramBot.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Report warning for LinkedIn or other platforms if present
const oldReportLoop1 = `            if (postUrl) {
              reportMsg += \`• [\${icon} \${name} Live Post](\${postUrl})\\n\`;
            } else {
              const chanUrl = telegramNotifier.getChannelUrl(dest, r.platform);
              reportMsg += chanUrl ? \`• [\${icon} \${name} Profile](\${chanUrl})\\n\` : \`• \${icon} \${name}: लाइव पब्लिश संपन्न ✅\\n\`;
            }`;

const newReportLoop1 = `            if (postUrl) {
              reportMsg += \`• [\${icon} \${name} Live Post](\${postUrl})\\n\`;
            } else {
              const chanUrl = telegramNotifier.getChannelUrl(dest, r.platform);
              reportMsg += chanUrl ? \`• [\${icon} \${name} Profile](\${chanUrl})\\n\` : \`• \${icon} \${name}: लाइव पब्लिश संपन्न ✅\\n\`;
            }
            if (r.warning) {
              reportMsg += \`  ↳ ⚠️ \${r.warning}\\n\`;
            }`;

code = code.replace(oldReportLoop1, newReportLoop1);

// 2. Also for partial failure loop
const oldReportLoop2 = `            const postUrl = r.details?.postUrl || r.postUrl;
            reportMsg += postUrl ? \`• ✅ [\${icon} \${name} Live Post](\${postUrl})\\n\` : \`• ✅ \${icon} \${name}: लाइव पब्लिश संपन्न\\n\`;`;

const newReportLoop2 = `            const postUrl = r.details?.postUrl || r.postUrl;
            reportMsg += postUrl ? \`• ✅ [\${icon} \${name} Live Post](\${postUrl})\\n\` : \`• ✅ \${icon} \${name}: लाइव पब्लिश संपन्न\\n\`;
            if (r.warning) {
              reportMsg += \`  ↳ ⚠️ \${r.warning}\\n\`;
            }`;

code = code.replace(oldReportLoop2, newReportLoop2);

// 3. Improve background blog article error reporting
const oldBlogCatch = `          } catch (bErr) {
            console.warn('[TelegramBot Background Blog Warning]:', bErr.message);
          }`;

const newBlogCatch = `          } catch (bErr) {
            console.warn('[TelegramBot Background Blog Warning]:', bErr.message);
            try {
              await this.sendDualMessage(
                chatId,
                \`⚠️ *[Blogger ब्लॉग आर्टिकल सूचना]* 🐪\\n\\n\` +
                \`📍 *डेस्टिनेशन:* \${dest.name}\\n\` +
                \`📑 *टाइटल:* \${parsedSeo.title}\\n\` +
                \`ℹ️ *स्टेटस:* \`\${bErr.message}\`\\n\\n\` +
                \`💡 *समाधान:* Google Cloud OAuth टोकन में Blogger API परमिशन (scope) अपडेट करें या Mail2Blogger सीक्रेट ईमेल सक्षम करें।\`,
                { parse_mode: 'Markdown' }
              );
            } catch (notifyErr) {}
          }`;

code = code.replace(oldBlogCatch, newBlogCatch);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully enhanced telegramBot.js reporting!');

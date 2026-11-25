const fs = require('fs');

let xml = fs.readFileSync('public/theme/lexatrip_blogger_theme.xml', 'utf8');

// 1. Add <div id='lexaMainContent'></div> inside main-wrapper
xml = xml.replace("<div class='main-wrapper'>", "<div class='main-wrapper'>\n    <div id='lexaMainContent'></div>");

// 2. Add resilient client renderer in script
const clientRendererCode = `
    // -------------------------------------------------------------------------
    // RESILIENT POSTS & ARTICLE RENDERER (Dual Engine)
    // -------------------------------------------------------------------------
    async function loadLexaBlogContent() {
      // Check if native Blogger posts already rendered
      if (document.querySelector('.article-container') || document.querySelector('.post-card')) {
        return; // Native rendered successfully
      }

      const container = document.getElementById('lexaMainContent');
      if (!container) return;

      try {
        const res = await fetch('/feeds/posts/default?alt=json');
        const data = await res.json();
        const entries = (data.feed && data.feed.entry) ? data.feed.entry : [];

        const currentPath = window.location.pathname;
        const isSinglePost = currentPath.endsWith('.html');

        if (isSinglePost) {
          let post = entries.find(e => {
            const altLink = (e.link || []).find(l => l.rel === 'alternate');
            return altLink && altLink.href.includes(currentPath);
          }) || entries[0];

          if (post) {
            const title = post.title.$t;
            const content = post.content ? post.content.$t : (post.summary ? post.summary.$t : '');
            const pubDate = new Date(post.published.$t).toLocaleDateString('hi-IN', {
              year: 'numeric', month: 'long', day: 'numeric'
            });

            container.innerHTML = 
              '<article class="article-container">' +
                '<span class="article-category">जैसलमेर लक्ज़री ट्रैवल गाइड</span>' +
                '<h1 class="article-title">' + title + '</h1>' +
                '<div class="article-meta">' +
                  '<div class="author-badge">' +
                    '<div class="author-avatar">LT</div>' +
                    '<span>LexaTrip Editorial Specialist</span>' +
                  '</div>' +
                  '<span>•</span>' +
                  '<span>📅 ' + pubDate + '</span>' +
                  '<span>•</span>' +
                  '<span>★ 5.0 Verified Travel Guide</span>' +
                '</div>' +
                '<div class="in-article-cta">' +
                  '<div class="in-article-cta-title">🏨 जैसलमेर टूर व कैंप पैकेज 50% छूट पर बुक करें</div>' +
                  '<div class="in-article-cta-desc">सैम सैंड ड्यून्स लक्ज़री टेंट, कैमल सफारी, राजस्थानी डिनर व गाला नाइट के लिए सर्वोत्तम रेट गारंटी।</div>' +
                  '<div class="in-article-cta-actions">' +
                    '<a href="https://bookings.lexatrip.com/" target="_blank" class="btn-cta-book">🏨 ऑनलाइन बुक करें — 50% Off</a>' +
                    '<a href="https://wa.me/919079854982?text=' + encodeURIComponent('नमस्ते LexaTrip, मुझे ' + title + ' के बारे में जानकारी व बुकिंग चाहिए!') + '" target="_blank" class="btn-cta-wa">💬 WhatsApp पूछताछ</a>' +
                  '</div>' +
                '</div>' +
                '<div class="article-content">' + content + '</div>' +
                '<div class="share-bar">' +
                  '<span class="share-label">आर्टिकल शेयर करें:</span>' +
                  '<a href="https://api.whatsapp.com/send?text=' + encodeURIComponent(title + ' ' + window.location.href) + '" target="_blank" class="share-btn share-wa">WhatsApp</a>' +
                  '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href) + '" target="_blank" class="share-btn share-fb">Facebook</a>' +
                  '<a href="https://twitter.com/intent/tweet?url=' + encodeURIComponent(window.location.href) + '&text=' + encodeURIComponent(title) + '" target="_blank" class="share-btn share-tw">Twitter / X</a>' +
                '</div>' +
              '</article>';
            return;
          }
        }

        // Homepage Grid
        if (entries.length === 0) {
          container.innerHTML = '<div style="text-align:center; padding: 40px; color:#64748B;">जल्द ही नए आर्टिकल्स प्रकाशित किए जाएंगे।</div>';
          return;
        }

        let gridHtml = '<div class="posts-grid">';
        entries.forEach(entry => {
          const title = entry.title.$t;
          const altLink = (entry.link || []).find(l => l.rel === 'alternate');
          const url = altLink ? altLink.href : '#';
          const pubDate = new Date(entry.published.$t).toLocaleDateString('hi-IN', {
            year: 'numeric', month: 'short', day: 'numeric'
          });

          let imgUrl = '';
          if (entry.media$thumbnail) {
            imgUrl = entry.media$thumbnail.url.replace('/s72-c/', '/w640-h360-p-k-no-nu/');
          } else {
            const raw = (entry.content ? entry.content.$t : '') || '';
            const m = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (m) imgUrl = m[1];
          }

          let snippet = (entry.summary ? entry.summary.$t : (entry.content ? entry.content.$t : '')) || '';
          snippet = snippet.replace(/<[^>]*>/g, '').replace(/\\s+/g, ' ').trim().slice(0, 140) + '...';

          gridHtml += 
            '<div class="post-card">' +
              (imgUrl ? '<img class="card-media" src="' + imgUrl + '" alt="' + title.replace(/"/g, '&quot;') + '" />' : '<div class="card-media" style="background: linear-gradient(135deg, #1E293B, #0F172A); display: flex; align-items: center; justify-content: center; color: #FF6B00; font-size: 36px;">🐪</div>') +
              '<div class="card-body">' +
                '<span class="card-badge">Travel Guide</span>' +
                '<h2 class="card-title"><a href="' + url + '">' + title + '</a></h2>' +
                '<p class="card-excerpt">' + snippet + '</p>' +
                '<div class="card-footer">' +
                  '<span>📅 ' + pubDate + '</span>' +
                  '<a href="' + url + '" class="card-read-link">पूरा आर्टिकल पढ़ें →</a>' +
                '</div>' +
              '</div>' +
            '</div>';
        });
        gridHtml += '</div>';
        container.innerHTML = gridHtml;
      } catch (err) {
        console.error('LexaTrip Blog Content loading error:', err);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadLexaBlogContent);
    } else {
      loadLexaBlogContent();
    }
`;

xml = xml.replace("//]]>", clientRendererCode + "\n    //]]>");

// Sanitize XML comments again just in case
xml = xml.replace(/<!--[\s\S]*?-->/g, (match) => {
  const inner = match.slice(4, -3);
  const sanitized = inner.replace(/--+/g, '==');
  return '<!--' + sanitized + '-->';
});

fs.writeFileSync('public/theme/lexatrip_blogger_theme.xml', xml, 'utf8');
fs.writeFileSync('C:/Users/imran/.gemini/antigravity/brain/880516ee-b068-4c79-a8a9-da055918a37f/browser_sandbox/references/lexatrip_theme.xml', xml, 'utf8');
console.log('Successfully added resilient renderer to theme XML!');

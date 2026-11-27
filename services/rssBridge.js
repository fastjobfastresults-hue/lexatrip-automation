/**
 * Master RSS Feed Generator for Pinterest Auto-Publish & Global Syndication
 * Generates standards-compliant RSS 2.0 with media enclosures for Pinterest,
 * LinkedIn bridges, and 100+ Destination Social Syndication.
 */

const db = require('../database/db');
const tunnelService = require('./tunnelService');
const googleMasterAuth = require('./googleMasterAuth');
const axios = require('axios');

function escapeXml(unsafe) {
  if (!unsafe || typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

class RssBridge {
  constructor() {
    this._bloggerCache = null;
    this._bloggerCacheTime = 0;
  }

  async getBloggerPosts(blogId) {
    if (!blogId) return [];
    if (this._bloggerCache && (Date.now() - this._bloggerCacheTime < 10 * 60 * 1000)) {
      return this._bloggerCache;
    }
    try {
      const token = await googleMasterAuth.getBloggerAccessToken();
      const res = await axios.get(`https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { maxResults: 15 },
        timeout: 15000
      });
      if (res.data?.items) {
        this._bloggerCache = res.data.items;
        this._bloggerCacheTime = Date.now();
        return this._bloggerCache;
      }
      return [];
    } catch (err) {
      console.warn('[RssBridge] Could not fetch Blogger posts:', err.message);
      return this._bloggerCache || [];
    }
  }

  async generateFeed({ destinationId = null, baseUrl = 'https://lexa-trip-automation.onrender.com' }) {
    db.init();
    const destinations = destinationId 
      ? [db.getDestination(destinationId)].filter(Boolean) 
      : (typeof db.getDestinations === 'function' ? db.getDestinations() : (db.destinations || []));
    const primaryDest = destinations[0] || { name: 'LexaTrip Global', slug: 'global' };

    const feedTitle = destinationId 
      ? `LexaTrip ${primaryDest.name} — Luxury Stays, Camps & Travel Guides`
      : 'LexaTrip™ Official Travel Media — 100+ Verified Luxury Destinations';

    const masterClaimedBlogId = '7541042203565068285'; // lexatrip.blogspot.com (Claimed on Pinterest)
    const masterClaimedDomain = 'https://lexatrip.blogspot.com/';

    const feedLink = destinationId && primaryDest.channels?.blogger?.handle
      ? `https://${primaryDest.channels.blogger.handle}/`
      : masterClaimedDomain;

    const feedDesc = destinationId
      ? `Curated luxury experiential travel, desert camps, heritage hotels, and itinerary guides for ${primaryDest.name}.`
      : 'Automated experiential travel pins, 5-star hotel showcases, and authentic travel guides across 100+ destinations in India.';

    // Gather feed items from Queue (published items)
    const queue = db.getQueue() || [];
    const publishedQueueItems = queue
      .filter(item => item.status === 'published' && (!destinationId || item.destinationId === destinationId))
      .slice(-25)
      .reverse();

    // Gather Blogger posts from Claimed Master Blog (for master feed) or specific destination blog
    let bloggerPosts = [];
    const targetBlogId = destinationId 
      ? primaryDest?.channels?.blogger?.credentials?.blogId 
      : masterClaimedBlogId;

    if (targetBlogId) {
      bloggerPosts = await this.getBloggerPosts(targetBlogId);
    }

    const itemsXml = [];
    const seenGuids = new Set();

    // 1. Process Blogger Posts (High Priority for Pinterest & Syndication)
    for (const post of bloggerPosts) {
      if (!post.url || seenGuids.has(post.id)) continue;
      seenGuids.add(post.id);

      // Extract first image from HTML content if available
      let imgUrl = null;
      const imgMatch = post.content ? post.content.match(/<img[^>]+src=["'](https?:\/\/[^"'>]+)["']/i) : null;
      if (imgMatch && imgMatch[1]) {
        imgUrl = imgMatch[1];
      } else {
        imgUrl = 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80';
      }

      // Plaintext description snippet
      const cleanSnippet = (post.content || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300);

      const pubDate = post.published ? new Date(post.published).toUTCString() : new Date().toUTCString();

      itemsXml.push(`
    <item>
      <title>${escapeXml(post.title || 'LexaTrip Luxury Travel Guide')}</title>
      <link>${escapeXml(post.url)}</link>
      <guid isPermaLink="false">blogger_${escapeXml(post.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${cleanSnippet} ... Book luxury stays at bookings.lexatrip.com]]></description>
      <enclosure url="${escapeXml(imgUrl)}" type="image/jpeg" length="150000" />
      <source url="${escapeXml(feedLink)}">${escapeXml(feedTitle)}</source>
    </item>`);
    }

    // 2. Process Published Queue Items
    for (const qItem of publishedQueueItems) {
      if (seenGuids.has(qItem.id)) continue;
      seenGuids.add(qItem.id);

      let mediaUrl = null;
      if (qItem.mediaPath) {
        try {
          mediaUrl = tunnelService.resolvePublicMediaUrl(qItem.mediaPath);
        } catch (_) {}
      }
      if (!mediaUrl || !mediaUrl.startsWith('http')) {
        mediaUrl = 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80';
      }

      let itemLink = qItem.postUrl;
      if (!destinationId) {
        // Pinterest Master Feed requires all links to strictly match the claimed domain (lexatrip.blogspot.com)
        if (!itemLink || !itemLink.includes('lexatrip.blogspot.com')) {
          itemLink = masterClaimedDomain;
        }
      } else {
        if (!itemLink) {
          itemLink = primaryDest.channels?.blogger?.handle ? `https://${primaryDest.channels.blogger.handle}/` : 'https://bookings.lexatrip.com/';
        }
      }
      const pubDate = qItem.createdAt ? new Date(qItem.createdAt).toUTCString() : new Date().toUTCString();
      const snippet = (qItem.caption || qItem.title || 'Curated luxury travel experience by LexaTrip.').slice(0, 300);

      itemsXml.push(`
    <item>
      <title>${escapeXml(qItem.title || 'LexaTrip Travel Experience')}</title>
      <link>${escapeXml(itemLink)}</link>
      <guid isPermaLink="false">queue_${escapeXml(qItem.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${escapeXml(snippet)}]]></description>
      <enclosure url="${escapeXml(mediaUrl)}" type="image/jpeg" length="250000" />
      <source url="${escapeXml(feedLink)}">${escapeXml(feedTitle)}</source>
    </item>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${escapeXml(feedLink)}</link>
    <description>${escapeXml(feedDesc)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(baseUrl + (destinationId ? `/feeds/${destinationId}.rss` : '/feeds/pinterest-master.rss'))}" rel="self" type="application/rss+xml" />
    <image>
      <url>https://bookings.lexatrip.com/favicon.ico</url>
      <title>${escapeXml(feedTitle)}</title>
      <link>${escapeXml(feedLink)}</link>
    </image>${itemsXml.join('')}
  </channel>
</rss>`;

    return xml;
  }
}

module.exports = new RssBridge();

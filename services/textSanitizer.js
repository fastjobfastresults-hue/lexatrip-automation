/**
 * Universal Text & Entity Sanitizer for Social Media Posts & Blog Articles
 * Removes unparsed LLM/Meta/Graph entity tags like:
 * - 【entity-ST. REGIS|canonicalname=ST. REGIS】 -> ST. REGIS
 * - 【entity-XXXX】 -> XXXX
 * - [entity-XXXX|canonicalname=YYYY] -> YYYY
 * - Any stray brackets or internal metadata artifacts
 */

function sanitizePostText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  
  let text = raw;

  // 1. Replace 【entity-...|canonicalname=YYYY】 or [entity-...|canonicalname=YYYY] with YYYY
  text = text.replace(/[【\[]entity[-:][^|]+?\|canonicalname=([^】\]]+?)[】\]]/gi, '$1');

  // 2. Replace 【entity-...】 or [entity-...] with name
  text = text.replace(/[【\[]entity[-:]([^】\]]+?)[】\]]/gi, '$1');

  // 3. Replace any 【...canonicalname=YYYY...】 with YYYY
  text = text.replace(/[【\[][^】\]]*?canonicalname=([^】\]]+?)[】\]]/gi, '$1');

  // 4. Remove any remaining entity-style bracket artifacts 【...】
  text = text.replace(/【[^】]*?】/g, '');

  // 5. Replace bracket format [entity-XXXX|canonicalname=YYYY] with YYYY
  text = text.replace(/\[entity-[^|]+?\|canonicalname=([^\]]+?)\]/gi, '$1');

  // 6. Replace bracket format [entity-XXXX] with XXXX
  text = text.replace(/\[entity-([^\]]+?)\]/gi, '$1');

  // 7. Normalize redundant multiple spaces (keep newlines intact)
  text = text.replace(/[ \t]{2,}/g, ' ');

  // 8. Clean trailing spaces on individual lines
  text = text.split('\n').map(line => line.trimEnd()).join('\n').trim();

  return text;
}

module.exports = {
  sanitizePostText
};

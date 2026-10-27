// Option matching is shared by native selects, custom selects and radio groups.
(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase()
    .replace(/[\u064b-\u065f\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا')
    .replace(/[’']/g, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const negative = value => /(?:^|\s)(?:non|not|no|false|غير|ليس|لا)(?:\s|$)/u.test(value);
  const placeholders = /^(?:select(?: an?| your)?(?: option)?|choose(?: an? option)?|please select|اختر|اختيار|الرجاء الاختيار|--+)\s*$/i;
  function tokens(target, aliases = APP.SELECT_SYNONYMS || {}) {
    const normalized = normalize(target);
    const result = new Set([normalized]);
    // Never infer a synonym group through substring matches (m != female, it != citizenship).
    for (const [key, values] of Object.entries(aliases)) {
      const group = [key, ...values].map(normalize);
      if (group.includes(normalized)) group.forEach(value => result.add(value));
    }
    return result;
  }
  function rank(text, target, aliases) {
    const candidate = normalize(text);
    const wanted = normalize(target);
    if (!candidate || !wanted || placeholders.test(candidate)) return 0;
    if (candidate === wanted) return 100;
    if (negative(candidate) !== negative(wanted)) return 0;
    const approved = tokens(target, aliases);
    if (approved.has(candidate)) return 90;
    // Phrase boundaries only; short aliases are exact-only.
    for (const token of approved) {
      if (token.length < 4) continue;
      if ((' ' + candidate + ' ').includes(' ' + token + ' ')) return 60;
    }
    return 0;
  }
  function choose(options, target, { aliases, minimumScore = 90, text = option => option.textContent || '', value = option => option.value } = {}) {
    const ranked = options.filter(option => !option.disabled && option.getAttribute?.('aria-disabled') !== 'true')
      .map(option => ({ option, score: Math.max(rank(text(option), target, aliases), value(option) ? rank(value(option), target, aliases) : 0) }))
      .filter(item => item.score >= minimumScore).sort((a, b) => b.score - a.score);
    if (!ranked.length) return { status: 'blocked', code: 'OPTION_NOT_FOUND' };
    const best = ranked.filter(item => item.score === ranked[0].score);
    if (best.length > 1) return { status: 'blocked', code: 'AMBIGUOUS_OPTION' };
    return { status: 'matched', option: best[0].option, score: best[0].score };
  }
  APP.Matching = Object.freeze({ normalize, rank, choose, matches: (text, target) => rank(text, target) > 0 });
  if (typeof module !== 'undefined' && module.exports) module.exports = APP.Matching;
})();

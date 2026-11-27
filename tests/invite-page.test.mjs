// Checks the built invite page (run `npm test`: it builds first, then reads dist/). ADR 0080: pelepit.com/invite?c=<code>.
// The page's own built script runs here against a small stand-in for the browser DOM made from the built HTML, so the
// test sees the Google Play link exactly as a visitor's browser would get it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('dist/invite/index.html', root), 'utf8');
const PLAY = 'https://play.google.com/store/apps/details?id=com.pelepit.game';
const APP_STORE = 'https://apps.apple.com/app/id6830088624';
const CODE = '12345678';

const unescape = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const script = scripts.find((s) => s.includes('play.google.com'));

/** Runs the built script with `search` as location.search; returns the links, the data-when parts and the id'd nodes. */
function visit(search) {
  assert.ok(script, 'the built invite page has its script');
  const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => ({ href: unescape(m[1]) }));
  const parts = [...html.matchAll(/<[a-z0-9]+\b([^>]*)\bdata-when="([^"]*)"([^>]*)>/g)]
    .map((m) => ({ when: m[2], hidden: /(^|\s)hidden(\s|=|$)/.test(`${m[1]} ${m[3]}`) }));
  const byId = {};
  for (const m of html.matchAll(/\bid="([^"]*)"/g)) byId[m[1]] = { id: m[1], textContent: '', addEventListener() {} };
  const document = {
    querySelectorAll(selector) {
      let m = selector.match(/^a\[href\^="([^"]+)"\]$/);
      if (m) return links.filter((a) => a.href.startsWith(m[1]));
      m = selector.match(/^\[data-when="([^"]+)"\]$/);
      if (m) return parts.filter((p) => p.when === m[1]);
      throw new Error(`the test's DOM does not know the selector ${selector}`);
    },
    getElementById: (id) => byId[id] ?? null,
  };
  vm.runInNewContext(script, { document, location: { search }, URL, URLSearchParams, navigator: {}, window: {} });
  return { links, parts, byId, play: links.find((a) => a.href.startsWith('https://play.google.com/')) };
}

test('the built page has one Google Play and one App Store link, the code parts hidden', () => {
  const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => unescape(m[1]));
  assert.deepEqual(links.filter((h) => h.startsWith('https://play.google.com/')), [PLAY]);
  assert.deepEqual(links.filter((h) => h.startsWith('https://apps.apple.com/')), [APP_STORE]);
  const { parts } = visit('');
  assert.ok(parts.some((p) => p.when === 'code') && parts.some((p) => p.when === 'plain'), 'both kinds of parts');
  for (const p of parts) assert.equal(p.hidden, p.when === 'code', `a "${p.when}" part starts ${p.hidden ? 'hidden' : 'shown'}`);
});

// The app (parseReferralReferrer) takes the code only from pelepit_invite with utm_source=invite. Play hands the app
// the referrer parameter's whole value, so the three fields must be one URL-encoded value of `referrer`.
test('with a friend code the Google Play link carries it as pelepit_invite in one referrer value', () => {
  const { play } = visit(`?c=${CODE}`);
  const url = new URL(play.href);
  assert.equal(`${url.origin}${url.pathname}`, 'https://play.google.com/store/apps/details');
  assert.deepEqual([...url.searchParams.keys()], ['id', 'referrer'], play.href);
  assert.equal(url.searchParams.get('id'), 'com.pelepit.game');
  assert.equal(url.searchParams.get('referrer'), `utm_source=invite&utm_medium=friend&pelepit_invite=${CODE}`);
  assert.ok(play.href.includes(`&referrer=utm_source%3Dinvite%26utm_medium%3Dfriend%26pelepit_invite%3D${CODE}`), play.href);
});

// Firebase Analytics in the app reads the same install referrer and keeps utm_source..utm_content with the analytics
// user: the friend's code must be in none of them (Analytics sees only source invite / medium friend).
test('the friend code is in no utm_* field of the referrer', () => {
  const { play } = visit(`?c=${CODE}`);
  const referrer = new URLSearchParams(new URL(play.href).searchParams.get('referrer'));
  assert.deepEqual([...referrer.keys()], ['utm_source', 'utm_medium', 'pelepit_invite']);
  assert.equal(referrer.get('utm_source'), 'invite');
  assert.equal(referrer.get('utm_medium'), 'friend');
  for (const [key, value] of referrer) {
    if (key.startsWith('utm_')) assert.ok(!value.includes(CODE), `${key} must not carry the code`);
  }
  assert.ok(!play.href.includes('utm_content'), play.href);
});

test('with a friend code the page shows it 1234-5678 and leaves the other links alone', () => {
  const { links, parts, byId } = visit(`?c=${CODE}`);
  assert.equal(byId.code.textContent, '1234-5678');
  for (const p of parts) assert.equal(p.hidden, p.when === 'plain', `a "${p.when}" part is ${p.hidden ? 'hidden' : 'shown'}`);
  assert.deepEqual(links.filter((a) => a.href.startsWith('https://apps.apple.com/')).map((a) => a.href), [APP_STORE]);
  assert.ok(links.filter((a) => !a.href.startsWith('https://')).every((a) => /^(\/|mailto:)/.test(a.href)));
});

test('without a valid code the page keeps the plain text and the plain Google Play link', () => {
  for (const search of ['', '?c=', '?c=01234567', '?c=1234567', '?c=123456789', '?c=1234567a', '?c=1234-5678', '?c=١٢٣٤٥٦٧٨']) {
    const { play, parts, byId } = visit(search);
    assert.equal(play.href, PLAY, `${search || '(none)'}: Play link`);
    assert.equal(byId.code.textContent, '', `${search || '(none)'}: no code shown`);
    for (const p of parts) assert.equal(p.hidden, p.when === 'code', `${search || '(none)'}: "${p.when}" part`);
  }
});

test('the invite page is not indexed and not in the sitemap', () => {
  assert.ok(html.includes('<meta name="robots" content="noindex, nofollow, noarchive"'), 'robots noindex');
  assert.ok(html.includes('<meta name="referrer" content="no-referrer"'), 'no referrer to the stores');
  const sitemap = readFileSync(new URL('dist/sitemap.xml', root), 'utf8');
  assert.ok(!sitemap.includes('/invite'), 'sitemap has no /invite');
});

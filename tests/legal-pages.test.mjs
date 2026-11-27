// Checks the built legal pages (run `npm test`: it builds first, then reads dist/).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const legal = JSON.parse(readFileSync(new URL('src/data/legal.json', root), 'utf8'));
const page = (path) => readFileSync(new URL(`dist/${path}/index.html`, root), 'utf8');
const lastUpdated = (html) => html.match(/Last updated: ([^<]*)</)?.[1];
const section = (html, n) => html.match(new RegExp(`<section id="section-${n}">([\\s\\S]*?)</section>`))?.[1] ?? '';
const says = (text, facts, where) => {
  for (const fact of facts) assert.ok(text.includes(fact), `${where} says: ${fact}`);
};

const PAGES = { privacy: 'privacy', terms: 'terms', delete: 'delete-account' };
const DATE = /^\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/;

test('each legal page shows its own Last updated date from legal.json', () => {
  for (const [key, path] of Object.entries(PAGES)) {
    const date = legal.updated?.[key];
    assert.match(date ?? '', DATE, `legal.json updated.${key}`);
    assert.equal(lastUpdated(page(path)), date, `${path}: Last updated`);
  }
});

// A page whose text changed gets a new date; one that did not keeps its old one. ADR 0080 (invites) changed the
// privacy page and the delete-account page (what stays after a delete) on 27 November 2026; the terms did not change.
test('the Last updated dates match the last change of each page', () => {
  assert.equal(lastUpdated(page('privacy')), '27 November 2026', 'privacy');
  assert.equal(lastUpdated(page('delete-account')), '27 November 2026', 'delete-account');
  assert.equal(lastUpdated(page('terms')), '24 November 2026', 'terms');
});

// ADR 0080: who invited whom is kept on both accounts, each side deleted with its own account; after a delete only
// keyed hashes (HMAC, a secret key) stay of the sign-in and devices of a friend who reached the invite level (paid or,
// with 0 friend gold, not) or was held for review. The key is ours alone: on the server and in the encrypted backups.
test('privacy section 3 states what the invite feature keeps', () => {
  const s3 = section(page('privacy'), 3);
  assert.ok(s3.includes('داتای هەژمار و یاری'), 'section 3 is account and game data');
  says(s3, [
    'هەردوو هەژمار', // recorded on both accounts
    'لەگەڵ هەژماری خۆیدا دەسڕدرێتەوە', // each side deleted with its own account
    'بەبێ ناوی ئەو یاریزانەی هەژمارەکەی سڕاوەتەوە', // the other side keeps no name of the deleted player
    'دوو جار خەڵاتی بانگهێشت وەرنەگرێت', // so the same person is not rewarded twice
    'ئەگەر هاوڕێیەک گەیشتبێتە قۆناغی دیاریکراوی بانگهێشت', // if a friend reached the invite's set level
    '(چ سکەی پێ درابێت چ نا)', // whether or not coins were given
    'یان بۆ پشکنین ڕاگیرابێت', // or was held for review
    'دوای سڕینەوەی هەژمارەکەی', // kept after the account is deleted
    '(ئیمەیڵ، ژمارەی تەلەفۆن، Google یان Apple)', // of the sign-in
    'ناسێنەری ئامێرەکانی', // and the device ids
    'هاشێکی یەکلایەنەی کلیلدار', // a keyed one-way hash
    'HMAC', // keyed hash
    'کلیلێکی نهێنی', // a secret key
    'کە تەنها لای ئێمە هەڵگیراوە، لەسەر سێرڤەرەکەمان و لە بکاپە شفرەکراوەکانماندا', // kept only by us: server, encrypted backups
    'بەبێ ئەو کلیلە کەس ناتوانێت', // nobody without the key can reverse it
  ], 'privacy section 3');
});

// The hashes are recorded at the invite level whether or not gold was paid (the friend's gold can be set to 0), and the
// key is also in our encrypted backups: no page may tie the hashes to a rewarded friend only, or the key to the server only.
test('no legal page ties the invite hashes to a rewarded friend only or the key to the server only', () => {
  for (const path of Object.values(PAGES)) {
    const html = page(path);
    for (const claim of [
      'خەڵات بە هاوڕێیەک درابێت', // a reward was given to a friend
      'خەڵاتی بانگهێشتی وەرگرتووە', // received the invite reward
      'کە لەسەر سێرڤەرەکەمان هەڵگیراوە', // (a key) kept on our server
    ]) {
      assert.ok(!html.includes(claim), `${path} must not say: ${claim}`);
    }
  }
});

// The database records the time of every row, so a hash row can be matched to the inviter's record of that friend:
// the page must not promise "only the day of recording" or "no account identifier".
test('no legal page claims the invite hashes keep only the day or no account id', () => {
  for (const path of Object.values(PAGES)) {
    const html = page(path);
    for (const claim of ['ڕۆژی تۆمارکردن', 'بەبێ ناسێنەری هەژمار']) {
      assert.ok(!html.includes(claim), `${path} must not say: ${claim}`);
    }
  }
});

// What stays after a delete, from the invite feature: the keyed hashes (as long as the invite feature runs) and, on the
// other player's account, their record of the invite and of the reward's coins, without the deleted player's name.
const INVITE_STAYS = [
  'لە بانگهێشتی هاوڕێیاندا', // for friend invites:
  'تا ئەو کاتەی بەشی بانگهێشت لە یارییەکەدا کار دەکات', // kept as long as the invite feature runs
  'لە هەژماری یاریزانەکەی تر', // on the other player's account
  'ئەوەی هاوڕێیەک بە کۆدەکەی هاتووە', // the inviter's record that a friend joined
  'تۆماری سکەی خەڵاتەکەی', // and the record of the reward's coins
];

test('privacy section 11 lists the invite records that stay after a delete', () => {
  const s11 = section(page('privacy'), 11);
  assert.ok(s11.includes('ماوەی هەڵگرتن و سڕینەوە'), 'section 11 is retention and deletion');
  says(s11, [
    'تۆماری کڕین', // the purchase records stay listed
    'مێژووی یاریزانی بەرامبەر', // the opponent's match copy
    'ڕاپۆرتانەی دەربارەی یاریزانان', // reports about players
    'هاشە کلیلدارەکانی بڕگەی ٣', // the keyed hashes of section 3
    ...INVITE_STAYS,
    'بەبێ ناوی یاریزانە سڕاوەکە', // without the deleted player's name
  ], 'privacy section 11');
});

test('the delete-account page lists the invite records that stay after a delete', () => {
  const s3 = section(page('delete-account'), 3);
  assert.ok(s3.includes('چی دەسڕدرێتەوە؟'), 'section 3 is what is deleted (and what can stay)');
  says(s3, [
    'تۆماری کڕین',
    'مێژووی یاریزانی بەرامبەر',
    'ڕاپۆرتەکانی دەربارەی یاریزانان',
    'هاشی یەکلایەنەی کلیلداری چوونەژوورەوە و ئامێرەکانی', // keyed one-way hashes of the sign-in and devices
    'ئەو هاوڕێیەی گەیشتووەتە قۆناغی دیاریکراوی بانگهێشت (چ سکەی پێ درابێت چ نا) یان بۆ پشکنین ڕاگیراوە', // of a friend
    // who reached the invite's set level (whether or not coins were given) or was held for review
    '<a href="/privacy#section-3">', // points to the privacy page's explanation
    ...INVITE_STAYS,
    'بەبێ ناوی یاریزانە سڕاوەکە', // without the deleted player's name
  ], 'delete-account section 3');
});

// On Android the app reads the Play install referrer once and keeps only a friend's invite code from it. The app's
// Firebase Analytics reads the same referrer and keeps its utm_* fields: it sees source "invite", never the code (the
// invite page puts the code in pelepit_invite, not in a utm_* field).
test('privacy section 4 says what the app and its Analytics read from the Play install referrer', () => {
  const s4 = section(page('privacy'), 4);
  assert.ok(s4.includes('ئاڤاتار و مۆڵەتەکان'), 'section 4 is what the app takes from the device');
  says(s4, [
    'لە ئەندرۆید', // on Android
    'Google Play', // Google Play's
    'Install Referrer', // install referrer
    'یەک جار', // once
    'کۆدی بانگهێشت', // the invite code
    'بەستەری بانگهێشتی هاوڕێیەک', // when installed through a friend's invite link
    'بۆ بەستنەوەی هەژمارەکەت بە هەژماری ئەو هاوڕێیەی بانگهێشتی کردوویت', // to connect the two accounts
    'یارییەکە خۆی هیچ شتێکی تری لێ بەکار ناهێنێت', // the game itself uses nothing else from it
    'Firebase Analytics', // the app's Analytics
    'لە بەستەری بانگهێشتەوە هاتووە (سەرچاوەی «invite»)', // also sees the install came from an invite link (source "invite")
    'بەڵام کۆدی بانگهێشت نابینێت', // but not the code
  ], 'privacy section 4');
  // Analytics reads the referrer too, so "nothing else from it is used" (said of everyone) is not true.
  assert.ok(!s4.includes('هیچ شتێکی تری لێ بەکار ناهێنرێت'), 'section 4 must not say nothing else from it is used');
});

test('privacy section 6 says Analytics gets the install source, not the invite code', () => {
  const s6 = section(page('privacy'), 6);
  assert.ok(s6.includes('شیکردنەوە و ڕاپۆرتی هەڵە'), 'section 6 is analytics and crash reports');
  says(s6, [
    'Firebase Analytics', // Analytics
    'سەرچاوەی دامەزراندن', // the install source
    'Google Play', // from Google Play
    '«invite»', // "invite" for a friend's invite link
    'نەک کۆدی بانگهێشت', // not the invite code
  ], 'privacy section 6');
});

// ADR 0079 (live): on Android the app asks Play Integrity at sign-in, before a duel and before a league; the server keeps
// the latest verdict and the last 10 with the account (never the token); a fast-play review record also notes the
// verdict (pruned after 90 days); nothing changes in the game except that an invite reward can be held (ADR 0080).
test('privacy section 5 says what Play Integrity checks and keeps', () => {
  const s5 = section(page('privacy'), 5);
  assert.ok(s5.includes('پشتیوانی، ڕاپۆرت و زانیاریی تەکنیکی'), 'section 5 is support, reports and technical data');
  says(s5, [
    'لە ئەندرۆید', // on Android
    'Google Play Integrity', // asks Google Play Integrity
    'لە کاتی چوونەژوورەوە، پێش یاریی دوو کەسی و پێش لیگی ڕاستەوخۆ', // at sign-in, before a duel and before a league
    'ئایا ئامێرەکە و یارییەکە ڕەسەنن', // whether the device and the game are genuine
    'وەڵامێک (verdict)', // Google answers with a verdict
    'دوایین وەڵام و ١٠ ئەنجامی کۆتایی', // the latest verdict and the last 10 results
    'لەگەڵ هەژمارەکەدا دەسڕدرێنەوە', // deleted with the account
    'توکنەکە خۆی هەڵناگیرێت', // the token itself is never stored
    'تەنها بۆ دۆزینەوەی فێڵ', // only to find cheating
    'ئیمولەیتەر', // emulators
    'ئەپی دەستکاریکراو', // modified apps
    'نزیکەی ٩٠ ڕۆژ', // the review record of fast play stays about 90 days
    'هیچ شتێک لە یارییەکەدا بۆ کەس ناگۆڕێت', // nothing in the game changes for anyone
    'خەڵاتی بانگهێشتی هاوڕێیەک', // except a friend's invite reward
    'بۆ پشکنینی دەستی ڕادەگیرێت', // is held for a manual check
    'نەبوونی Google Play', // (also when the phone has no Google Play)
    'شاشە تۆمار بکات', // the app access risk part of the verdict (other apps that capture or control the screen)
  ], 'privacy section 5');
});

test('privacy section 9 names Play Integrity among the Google services', () => {
  const s9 = section(page('privacy'), 9);
  assert.ok(s9.includes('هاوبەشکردن و دەرەوەی وڵات'), 'section 9 is sharing');
  says(s9, ['Play Integrity'], 'privacy section 9');
});

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseMediaUrl,
  parseSpotifyUrl,
  parseYouTubeTime,
  parseYouTubeUrl
} from '../js/links.js';

test('YouTube watch links parse IDs and ignore tracking parameters', () => {
  const media = parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=tracking&start=90');

  assert.equal(media.provider, 'youtube');
  assert.equal(media.type, 'video');
  assert.equal(media.id, 'dQw4w9WgXcQ');
  assert.equal(media.start, 90);
  assert.equal(media.embedUrl, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&start=90');
});

test('YouTube short, live, embed, music and youtu.be forms are supported', () => {
  const urls = [
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/live/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://music.youtube.com/watch?v=dQw4w9WgXcQ'
  ];

  for (const url of urls) {
    const media = parseYouTubeUrl(url);
    assert.equal(media?.provider, 'youtube');
    assert.equal(media?.id, 'dQw4w9WgXcQ');
  }
});

test('YouTube playlist links use the videoseries embed', () => {
  const media = parseYouTubeUrl('https://www.youtube.com/playlist?list=PLabcdef123456');

  assert.equal(media.type, 'playlist');
  assert.equal(media.embedUrl, 'https://www.youtube-nocookie.com/embed/videoseries?list=PLabcdef123456&autoplay=1');
});

test('YouTube timestamps accept seconds and h/m/s formats', () => {
  assert.equal(parseYouTubeTime('90'), 90);
  assert.equal(parseYouTubeTime('90s'), 90);
  assert.equal(parseYouTubeTime('1m30s'), 90);
  assert.equal(parseYouTubeTime('1h2m3s'), 3723);
  assert.equal(parseYouTubeTime('abc'), null);
});

test('YouTube t parameter accepts compact durations', () => {
  const media = parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ?t=1m30s');

  assert.equal(media.start, 90);
  assert.equal(media.embedUrl, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&start=90');
});

test('Spotify recognizes types and language-prefixed paths', () => {
  const media = parseSpotifyUrl('https://open.spotify.com/intl-es/album/1234567890abcd');

  assert.equal(media.provider, 'spotify');
  assert.equal(media.type, 'album');
  assert.equal(media.id, '1234567890abcd');
  assert.equal(media.height, 352);
  assert.equal(media.embedUrl, 'https://open.spotify.com/embed/album/1234567890abcd');
});

test('Spotify track and episode heights are type-specific', () => {
  assert.equal(parseMediaUrl('https://open.spotify.com/track/1234567890abcd').height, 152);
  assert.equal(parseMediaUrl('https://open.spotify.com/episode/1234567890abcd').height, 232);
});

test('unsupported and malformed links return null', () => {
  assert.equal(parseMediaUrl('https://example.com/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(parseMediaUrl('javascript:alert(1)'), null);
  assert.equal(parseYouTubeUrl('https://www.youtube.com/watch?v=bad'), null);
  assert.equal(parseSpotifyUrl('https://open.spotify.com/unknown/1234567890abcd'), null);
});

/**
 * Parser puro de enlaces multimedia admitidos por WebMili.
 * No usa DOM ni APIs externas para que pueda probarse de forma aislada.
 */

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be'
]);

const SPOTIFY_TYPES = new Set([
  'track',
  'album',
  'playlist',
  'episode',
  'show',
  'artist'
]);

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,}$/;
const SPOTIFY_ID = /^[A-Za-z0-9]{6,}$/;

export function parseYouTubeTime(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const raw = String(value).trim().toLowerCase();

  if (!raw) {
    return null;
  }

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  if (/^\d+s$/.test(raw)) {
    return Number(raw.slice(0, -1));
  }

  if (!/^(?=\d*[hms])(?:\d+h)?(?:\d+m)?(?:\d+s)?$/.test(raw)) {
    return null;
  }

  const hours = raw.match(/(\d+)h/);
  const minutes = raw.match(/(\d+m)/);
  const seconds = raw.match(/(\d+)s/);
  const total =
    (hours ? Number(hours[1]) * 3600 : 0) +
    (minutes ? Number(minutes[1].slice(0, -1)) * 60 : 0) +
    (seconds ? Number(seconds[1]) : 0);

  return total > 0 ? total : null;
}

export function parseYouTubeUrl(value) {
  let url;

  try {
    url = new URL(String(value), 'https://webmili.local/');
  } catch (error) {
    return null;
  }

  if (url.protocol !== 'https:' || !YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  let id = null;
  let type = null;
  const hostname = url.hostname.toLowerCase();

  if (hostname === 'youtu.be') {
    id = url.pathname.split('/').filter(Boolean)[0] || null;
    type = id ? 'video' : null;
  } else if (url.pathname === '/watch') {
    id = url.searchParams.get('v');
    type = id ? 'video' : null;
  } else if (url.pathname.startsWith('/playlist')) {
    id = url.searchParams.get('list');
    type = id ? 'playlist' : null;
  } else {
    const segments = url.pathname.split('/').filter(Boolean);
    const kind = segments[0];

    if (['shorts', 'live', 'embed'].includes(kind) && segments[1]) {
      id = segments[1];
      type = 'video';
    }
  }

  if (!id) {
    return null;
  }

  if (type === 'playlist') {
    if (!/^[A-Za-z0-9_-]{4,}$/.test(id)) {
      return null;
    }
  } else if (!YOUTUBE_ID.test(id)) {
    return null;
  }

  const startValue = url.searchParams.get('start') || url.searchParams.get('t');
  const start = parseYouTubeTime(startValue);
  const embedUrl =
    type === 'playlist'
      ? `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(id)}&autoplay=1`
      : `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1${start ? `&start=${start}` : ''}`;

  return {
    provider: 'youtube',
    type,
    id,
    start,
    href: url.href,
    embedUrl,
    height: null
  };
}

export function parseSpotifyUrl(value) {
  let url;

  try {
    url = new URL(String(value), 'https://webmili.local/');
  } catch (error) {
    return null;
  }

  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'open.spotify.com') {
    return null;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const typeIndex = segments.findIndex((segment) => SPOTIFY_TYPES.has(segment));

  if (typeIndex < 0) {
    return null;
  }

  const type = segments[typeIndex];
  const id = segments[typeIndex + 1];

  if (!id || !SPOTIFY_ID.test(id)) {
    return null;
  }

  const heights = {
    track: 152,
    episode: 232,
    album: 352,
    playlist: 352,
    show: 352,
    artist: 352
  };

  return {
    provider: 'spotify',
    type,
    id,
    start: null,
    href: url.href,
    embedUrl: `https://open.spotify.com/embed/${type}/${encodeURIComponent(id)}`,
    height: heights[type]
  };
}

export function parseMediaUrl(value) {
  return parseYouTubeUrl(value) || parseSpotifyUrl(value);
}

export function parseMediaTimeLabel(media) {
  if (!media || media.provider !== 'youtube' || !media.start) {
    return '';
  }

  const hours = Math.floor(media.start / 3600);
  const minutes = Math.floor((media.start % 3600) / 60);
  const seconds = media.start % 60;

  if (hours) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

import { FEATURES } from './features.mjs';
const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
};
export class ShellSound {
  constructor() {
    this.enabled = read('chenne-effects', 'true') === 'true';
    this.context = null;
  }
  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new (window.AudioContext || window.webkitAudioContext)();
      void this.context.resume();
    } catch {
      this.enabled = false;
    }
  }
  setEnabled(value) {
    this.enabled = value;
    save('chenne-effects', value);
    if (value) this.unlock();
  }
  impact(capture = false) {
    if (!this.enabled || !this.context) return;
    const ctx = this.context,
      t = ctx.currentTime;
    const strike = (offset, weight) => {
      const duration = 0.06,
        buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * Math.exp((-i / data.length) * 12);
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2700 + Math.random() * 900;
      filter.Q.value = 0.9;
      const gain = ctx.createGain();
      gain.gain.value = 0.2 * weight;
      noise.connect(filter).connect(gain).connect(ctx.destination);
      noise.start(t + offset);
      for (const frequency of [430, 920]) {
        const osc = ctx.createOscillator(),
          g = ctx.createGain();
        osc.frequency.setValueAtTime(frequency + Math.random() * 50, t + offset);
        g.gain.setValueAtTime(0.032 * weight, t + offset);
        g.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.08);
        osc.connect(g).connect(ctx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + 0.09);
      }
    };
    strike(0, 1);
    if (capture) {
      strike(0.06, 0.7);
      strike(0.12, 0.5);
    }
  }
}
export async function setupMusic(root) {
  if (!FEATURES.music) return { duck() {}, tracks: [], choose: async () => false, pause() {} };
  let tracks = [];
  try {
    const response = await fetch('/assets/music/music-manifest.json');
    if (!response.ok) throw new Error('Music list unavailable');
    tracks = await response.json();
  } catch {
    root.querySelector('.music-status').textContent = 'Music unavailable. Refresh to try again.';
    return { duck() {}, tracks: [], choose: async () => false, pause() {} };
  }
  const select = root.querySelector('#music-track'),
    play = root.querySelector('#music-play'),
    volume = root.querySelector('#music-volume'),
    status = root.querySelector('.music-status'),
    credit = root.querySelector('#music-credit'),
    notes = document.querySelector('#music-notes');
  for (const track of tracks) {
    const option = document.createElement('option');
    option.value = track.id;
    option.textContent = track.label;
    select.append(option);
  }
  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'none';
  let current = null,
    request = 0,
    ducked = false,
    pausedForVisibility = false;
  let level = Number(read('chenne-volume', '.25'));
  if (!Number.isFinite(level)) level = 0.25;
  level = Math.max(0, Math.min(1, level));
  volume.value = String(Math.round(level * 100));
  const gain = () => {
    audio.volume = level * (ducked ? 0.58 : 1);
  };
  gain();
  const paint = () => {
    const playing = current && !audio.paused;
    play.textContent = playing ? 'Ⅱ' : '▶';
    play.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    play.disabled = !current;
  };
  const credits = () => {
    notes.replaceChildren();
    if (!current) {
      notes.textContent = 'Choose a recording to meet the artists behind it.';
      return;
    }
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = current.label;
    p.append(
      strong,
      document.createElement('br'),
      `${current.artist} · Recording: ${current.author}`,
    );
    notes.append(p);
    const description = document.createElement('p');
    description.textContent = current.description;
    notes.append(description);
    const detail = document.createElement('p');
    detail.textContent = current.changes;
    notes.append(detail);
    for (const [label, url] of [
      ['Original recording', current.sourceUrl],
      [current.license, current.licenseUrl],
    ]) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = label;
      notes.append(a, document.createTextNode(' · '));
    }
    const download = document.createElement('a');
    download.href = `/assets/music/${current.id}.mp3`;
    download.textContent = 'Audio file';
    notes.append(download);
  };
  const start = async () => {
    if (!current) return;
    const token = ++request;
    status.textContent = 'Loading recording…';
    try {
      gain();
      if (audio.error) audio.load();
      await audio.play();
      if (token !== request) return false;
      status.textContent = `${current.displaySubtitle || current.label} · playing`;
      paint();
      return true;
    } catch {
      if (token !== request) return;
      status.textContent = 'Tap play to start the recording.';
    }
    paint();
    return false;
  };
  const choose = async (id) => {
    request++;
    pausedForVisibility = false;
    audio.pause();
    current = tracks.find((t) => t.id === id) || null;
    select.value = current?.id || '';
    save('chenne-track', select.value);
    if (current) audio.src = `/assets/music/${current.id}.mp3`;
    else {
      audio.removeAttribute('src');
      audio.load();
      status.textContent = 'Choose a coastal recording.';
    }
    credits();
    paint();
    return current ? start() : false;
  };
  select.addEventListener('change', () => {
    void choose(select.value);
  });
  play.addEventListener('click', () => {
    pausedForVisibility = false;
    if (audio.paused) void start();
    else {
      request++;
      audio.pause();
      status.textContent = 'Music paused.';
      paint();
    }
  });
  volume.addEventListener('input', () => {
    level = Number(volume.value) / 100;
    gain();
    save('chenne-volume', level);
  });
  credit.addEventListener('click', () => {
    notes.hidden = !notes.hidden;
    credit.setAttribute('aria-expanded', String(!notes.hidden));
  });
  audio.addEventListener('pause', () => {
    if (current) status.textContent = 'Music paused.';
    paint();
  });
  audio.addEventListener('error', () => {
    status.textContent = 'Could not load this recording. Choose another or tap play to retry.';
    paint();
  });
  audio.addEventListener('waiting', () => {
    if (current && !audio.paused) status.textContent = 'Buffering recording…';
  });
  audio.addEventListener('playing', () => {
    status.textContent = current
      ? `${current.displaySubtitle || current.label} · playing`
      : 'Music off.';
    paint();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pausedForVisibility = !audio.paused;
      audio.pause();
      paint();
    } else if (pausedForVisibility) {
      pausedForVisibility = false;
      void start();
    }
  });
  window.addEventListener('pagehide', () => {
    request++;
    audio.pause();
  });
  const selected = tracks.find((t) => t.id === read('chenne-track', ''));
  if (selected) {
    current = selected;
    select.value = selected.id;
    audio.src = `/assets/music/${selected.id}.mp3`;
    status.textContent = 'Tap play to start the recording.';
  }
  credits();
  paint();
  return {
    tracks,
    choose,
    pause() {
      request++;
      pausedForVisibility = false;
      audio.pause();
      paint();
    },
    duck(value) {
      ducked = value;
      gain();
    },
  };
}

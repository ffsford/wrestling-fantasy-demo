// Wrestling Fantasy — Public Demo (no real league data, no Supabase)
const DEFAULT_SCORING = [
  { action: 'Lose a match / No Contest', tv: 1, ppv: 2 },
  { action: 'Draw / DQ Win', tv: 2, ppv: 4 },
  { action: 'Win a match', tv: 3, ppv: 6 },
  { action: 'Lose midcard title match', tv: 4, ppv: 8 },
  { action: 'Defend midcard title', tv: 5, ppv: 10 },
  { action: 'Win midcard title', tv: 6, ppv: 12 },
  { action: 'Lose world title match', tv: 7, ppv: 14 },
  { action: 'Defend world title', tv: 8, ppv: 16 },
  { action: 'Win world title', tv: 9, ppv: 18 },
];

const DEFAULT_WHEEL = [
  { label: '+20', color: '#3b82f6' },
  { label: '+30', color: '#8b5cf6' },
  { label: '+40', color: '#ec4899' },
  { label: '+50', color: '#ef4444' },
  { label: 'Add an Extra Roster Spot', color: '#10b981' },
  { label: 'Steal 5', color: '#f59e0b' },
];

const MASTER = [
  'Apex Rivera', 'Blade Quinn', 'Cobalt King', 'Dagger Voss', 'Echo Marlowe',
  'Frost Hale', 'Ghost Navarro', 'Hex Calder', 'Iron Vex', 'Jade Orion',
  'Knox Sterling', 'Luna Pryce', 'Maverick Cole', 'Nova Drake', 'Onyx Vale',
  'Phoenix Ash', 'Quill Mercer', 'Raven Cross', 'Storm Kade', 'Titan Brooks',
  'Umbra Finn', 'Viper Shaw', 'Wraith Kane', 'Xander Blaze', 'Yara Sol',
  'Zephyr Quinn', 'Atlas Crow', 'Briar Knox', 'Cipher Lane', 'Drift Solace'
];

const WRESTLER_PTS = {};
MASTER.forEach((n, i) => { WRESTLER_PTS[n.toLowerCase()] = Math.max(0, 45 - i * 1.5 + (i % 3) * 4) | 0; });

function seedUsers() {
  return {
    alpha: {
      name: 'ALPHA', division: 'east', isCommissioner: false, maxRoster: 8, lastDelta: 5,
      roster: ['Apex Rivera', 'Blade Quinn', 'Cobalt King', 'Dagger Voss', 'Echo Marlowe', 'Frost Hale', 'Ghost Navarro', 'Hex Calder']
    },
    bravo: {
      name: 'BRAVO', division: 'east', isCommissioner: false, maxRoster: 8, lastDelta: 0,
      roster: ['Iron Vex', 'Jade Orion', 'Knox Sterling', 'Luna Pryce', 'Maverick Cole', 'Nova Drake', 'Onyx Vale', 'Phoenix Ash']
    },
    charlie: {
      name: 'CHARLIE', division: 'east', isCommissioner: false, maxRoster: 8, lastDelta: 12,
      roster: ['Quill Mercer', 'Raven Cross', 'Storm Kade', 'Titan Brooks', 'Umbra Finn', 'Viper Shaw', 'Wraith Kane', 'Xander Blaze']
    },
    delta: {
      name: 'DELTA', division: 'west', isCommissioner: false, maxRoster: 8, lastDelta: 3,
      roster: ['Yara Sol', 'Zephyr Quinn', 'Atlas Crow', 'Briar Knox', 'Cipher Lane', 'Drift Solace', 'Apex Rivera', 'Nova Drake'].slice(0, 8)
    },
    echo: {
      name: 'ECHO', division: 'west', isCommissioner: false, maxRoster: 9, lastDelta: 0,
      roster: ['Blade Quinn', 'Echo Marlowe', 'Jade Orion', 'Luna Pryce', 'Onyx Vale', 'Raven Cross', 'Titan Brooks', 'Viper Shaw', 'Yara Sol']
    },
    foxtrot: {
      name: 'FOXTROT', division: 'west', isCommissioner: false, maxRoster: 8, lastDelta: 8,
      roster: ['Cobalt King', 'Frost Hale', 'Knox Sterling', 'Maverick Cole', 'Phoenix Ash', 'Storm Kade', 'Umbra Finn', 'Xander Blaze']
    },
    commish: {
      name: 'COMMISH', division: null, isCommissioner: true, maxRoster: 8, lastDelta: null, roster: []
    }
  };
}

const POINTS = {
  alpha: 186, bravo: 172, charlie: 201,
  delta: 194, echo: 168, foxtrot: 155
};

const FOREIGN_OBJECTS = [
  {
    name: 'Wheel Of Boom (immediate use)',
    desc: 'You will spin the Wheel Of Boom and receive an immediate effect. (Additional points +20/+30/+40/+50, Add an Extra Roster Spot, or Steal 5 points from every other player in that region.)'
  },
  {
    name: 'Forced Trade (can bank)',
    desc: 'You will nominate 1 wrestler from your roster to trade. You will then select 1 player (in your region) to force a random trade with from their roster.'
  },
  {
    name: 'Waiver In The Bank (can bank)',
    desc: 'You may drop and add 1 wrestler at any point in time, outside of Waiver Wires (even during a live show).'
  },
  {
    name: 'PPV Week (can bank)',
    desc: 'Ahead of any week with Dynamite and Collision, you may cash this in and receive PPV points for both shows.'
  },
  {
    name: 'Waiver Disrupter (can bank)',
    desc: 'You may cash this in ahead of any Waiver Wire due date and force every other player in your region to fail their first waiver wire attempt.'
  }
];

let data = {
  users: seedUsers(),
  points: { ...POINTS },
  masterRoster: MASTER.slice(),
  wrestlerPoints: { ...WRESTLER_PTS },
  fantasyChampion: 'charlie',
  branding: null,
  scoring: DEFAULT_SCORING.map(r => ({ ...r })),
  wheel: DEFAULT_WHEEL.map(s => ({ ...s })),
  wheelEnabled: true,
  coinFlipEnabled: true,
  foEnabled: true
};

// ---------- League branding (demo: localStorage) ----------
const BRAND_KEY = 'wf_demo_branding';

function defaultBranding() {
  return {
    leagueName: 'Wrestling Fantasy',
    divA: 'Division A',
    divB: 'Division B',
    colorPrimary: '#e10600',
    colorAccent: '#f5c518',
    leagueLogo: null, // data URL
    teamLogos: {}, // pin -> data URL
    teamNames: {}  // pin -> display name
  };
}

function loadBranding() {
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (!raw) return defaultBranding();
    return { ...defaultBranding(), ...JSON.parse(raw) };
  } catch (e) {
    return defaultBranding();
  }
}

function saveBranding(b) {
  localStorage.setItem(BRAND_KEY, JSON.stringify(b));
  data.branding = b;
  applyBranding();
}

// ---------- Scoring + Wheel config (localStorage) ----------
const SCORING_KEY = 'wf_demo_scoring';
const WHEEL_KEY = 'wf_demo_wheel';

function loadScoring() {
  try {
    const raw = localStorage.getItem(SCORING_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr.map(r => ({ action: r.action || '', tv: +r.tv || 0, ppv: +r.ppv || 0 }));
    }
  } catch (e) {}
  return DEFAULT_SCORING.map(r => ({ ...r }));
}

function saveScoring(arr) {
  localStorage.setItem(SCORING_KEY, JSON.stringify(arr));
  data.scoring = arr;
}

function loadWheelConfig() {
  try {
    const raw = localStorage.getItem(WHEEL_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      return {
        enabled: obj.enabled !== false,
        segments: Array.isArray(obj.segments) && obj.segments.length
          ? obj.segments.map(s => ({ label: s.label || '', color: s.color || '#666' }))
          : DEFAULT_WHEEL.map(s => ({ ...s })),
        coinFlipEnabled: obj.coinFlipEnabled !== false,
        foEnabled: obj.foEnabled !== false
      };
    }
  } catch (e) {}
  return {
    enabled: true,
    segments: DEFAULT_WHEEL.map(s => ({ ...s })),
    coinFlipEnabled: true,
    foEnabled: true
  };
}

function saveWheelConfig(cfg) {
  localStorage.setItem(WHEEL_KEY, JSON.stringify(cfg));
  data.wheelEnabled = cfg.enabled;
  data.wheel = cfg.segments;
  if (cfg.coinFlipEnabled !== undefined) data.coinFlipEnabled = cfg.coinFlipEnabled;
  if (cfg.foEnabled !== undefined) data.foEnabled = cfg.foEnabled;
}

function fileToDataUrl(file, maxDim, maxBytes) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (file.size > maxBytes) {
      reject(new Error('Image too large (max ' + Math.round(maxBytes / 1024) + ' KB)'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Could not read image'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

function applyBranding() {
  const b = data.branding || defaultBranding();
  const name = b.leagueName || 'Wrestling Fantasy';

  // CSS variables for accent
  document.documentElement.style.setProperty('--wf-primary', b.colorPrimary || '#e10600');
  document.documentElement.style.setProperty('--wf-accent', b.colorAccent || '#f5c518');

  // Login
  const loginName = document.getElementById('login-league-name');
  if (loginName) {
    loginName.innerHTML = escapeHtml(name);
    loginName.style.color = b.colorPrimary || '#e10600';
  }
  const loginLogo = document.getElementById('login-logo');
  if (loginLogo) {
    if (b.leagueLogo) {
      loginLogo.src = b.leagueLogo;
      loginLogo.classList.remove('hidden');
    } else {
      loginLogo.classList.add('hidden');
      loginLogo.removeAttribute('src');
    }
  }

  // Header
  const headerName = document.getElementById('header-league-name');
  if (headerName) {
    headerName.textContent = name;
    headerName.style.color = '#fff';
  }
  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) {
    if (b.leagueLogo) {
      headerLogo.src = b.leagueLogo;
      headerLogo.classList.remove('hidden');
    } else {
      headerLogo.classList.add('hidden');
    }
  }

  // Division titles
  const da = document.getElementById('div-a-title');
  const db = document.getElementById('div-b-title');
  if (da) {
    da.textContent = b.divA || 'Division A';
    da.style.color = b.colorPrimary || '#3b82f6';
  }
  if (db) {
    db.textContent = b.divB || 'Division B';
    db.style.color = b.colorAccent || '#f97316';
  }

  // Title
  document.title = name + ' — Demo';
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function teamLogoHtml(pin) {
  const url = data.branding?.teamLogos?.[pin];
  if (!url) return '';
  return `<img src="${url}" alt="" class="h-6 w-6 rounded object-cover flex-shrink-0" />`;
}

function renderLeagueSetupForm() {
  const b = data.branding || defaultBranding();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('setup-league-name', b.leagueName);
  set('setup-div-a', b.divA);
  set('setup-div-b', b.divB);
  const cp = document.getElementById('setup-color-primary');
  const ca = document.getElementById('setup-color-accent');
  if (cp) cp.value = b.colorPrimary || '#e10600';
  if (ca) ca.value = b.colorAccent || '#f5c518';

  const prev = document.getElementById('setup-league-logo-preview');
  const clearBtn = document.getElementById('setup-clear-league-logo');
  if (prev) {
    if (b.leagueLogo) {
      prev.src = b.leagueLogo;
      prev.classList.remove('hidden');
      if (clearBtn) clearBtn.classList.remove('hidden');
    } else {
      prev.classList.add('hidden');
      if (clearBtn) clearBtn.classList.add('hidden');
    }
  }
}

function renderMyTeamLogoCard() {
  const card = document.getElementById('my-team-logo-card');
  if (!card) return;
  const u = data.users[currentUser];
  // Only team owners (have a division), not pure commissioner-only accounts
  if (!u || !u.division) {
    card.classList.add('hidden');
    return;
  }
  card.classList.remove('hidden');
  const url = data.branding?.teamLogos?.[currentUser];
  const prev = document.getElementById('my-team-logo-preview');
  const ph = document.getElementById('my-team-logo-placeholder');
  if (url && prev) {
    prev.src = url;
    prev.classList.remove('hidden');
    if (ph) ph.classList.add('hidden');
  } else {
    if (prev) prev.classList.add('hidden');
    if (ph) ph.classList.remove('hidden');
  }
}

async function saveMyTeamLogo() {
  const input = document.getElementById('my-team-logo-input');
  const msg = document.getElementById('my-team-logo-msg');
  const file = input?.files?.[0];
  if (!file) {
    if (msg) { msg.textContent = 'Choose an image first'; msg.className = 'text-sm mt-2 text-red-400'; }
    return;
  }
  try {
    const url = await fileToDataUrl(file, 256, 500 * 1024);
    data.branding = data.branding || defaultBranding();
    data.branding.teamLogos = data.branding.teamLogos || {};
    data.branding.teamLogos[currentUser] = url;
    saveBranding(data.branding);
    renderMyTeamLogoCard();
    renderStandings();
    renderMyTeam();
    if (msg) { msg.textContent = 'Team logo saved'; msg.className = 'text-sm mt-2 text-emerald-400'; }
    if (input) input.value = '';
  } catch (e) {
    if (msg) { msg.textContent = e.message || 'Upload failed'; msg.className = 'text-sm mt-2 text-red-400'; }
  }
}

function clearMyTeamLogo() {
  if (!data.branding?.teamLogos) return;
  delete data.branding.teamLogos[currentUser];
  saveBranding(data.branding);
  renderMyTeamLogoCard();
  renderStandings();
  renderMyTeam();
  const msg = document.getElementById('my-team-logo-msg');
  if (msg) { msg.textContent = 'Logo removed'; msg.className = 'text-sm mt-2 text-gray-400'; }
  const input = document.getElementById('my-team-logo-input');
  if (input) input.value = '';
}


async function saveLeagueSetupUI() {
  const b = { ...(data.branding || defaultBranding()) };
  b.leagueName = (document.getElementById('setup-league-name')?.value || '').trim() || 'Wrestling Fantasy';
  b.divA = (document.getElementById('setup-div-a')?.value || '').trim() || 'Division A';
  b.divB = (document.getElementById('setup-div-b')?.value || '').trim() || 'Division B';
  b.colorPrimary = document.getElementById('setup-color-primary')?.value || '#e10600';
  b.colorAccent = document.getElementById('setup-color-accent')?.value || '#f5c518';
  // team logos already on data.branding from file pickers
  b.teamLogos = { ...(data.branding?.teamLogos || {}) };
  saveBranding(b);
  const msg = document.getElementById('setup-msg');
  if (msg) {
    msg.textContent = 'League setup saved';
    msg.className = 'text-sm mt-2 text-emerald-400';
  }
  renderStandings();
  renderMyTeam();
}



// ---------- Wrestler pool + portraits (demo localStorage) ----------
const POOL_KEY = 'wf_demo_pool';
const PORTRAIT_KEY = 'wf_demo_portraits';

function loadPool() {
  try {
    const raw = localStorage.getItem(POOL_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch (e) {}
  return null; // use default MASTER
}

function savePool(names) {
  const cleaned = [...new Set(names.map(n => n.trim()).filter(Boolean))];
  cleaned.sort((a, b) => a.localeCompare(b));
  localStorage.setItem(POOL_KEY, JSON.stringify(cleaned));
  data.masterRoster = cleaned;
  // ensure points map has entries
  cleaned.forEach(n => {
    const k = n.toLowerCase();
    if (data.wrestlerPoints[k] === undefined) data.wrestlerPoints[k] = 0;
  });
}

function loadPortraits() {
  try {
    const raw = localStorage.getItem(PORTRAIT_KEY);
    if (raw) return JSON.parse(raw) || {};
  } catch (e) {}
  return {};
}

function savePortraits(map) {
  localStorage.setItem(PORTRAIT_KEY, JSON.stringify(map));
  data.portraits = map;
}

function portraitFor(name) {
  if (!name) return null;
  const map = data.portraits || {};
  const key = name.toLowerCase().trim();
  if (map[key]) return map[key];
  // fuzzy: strip punctuation
  const soft = key.replace(/[^a-z0-9]+/g, ' ').trim();
  for (const [k, v] of Object.entries(map)) {
    if (k.replace(/[^a-z0-9]+/g, ' ').trim() === soft) return v;
  }
  return null;
}

function portraitHtml(name, sizeClass) {
  const url = portraitFor(name);
  const sz = sizeClass || 'h-24 w-24';
  if (url) {
    return `<img src="${url}" alt="" class="${sz} rounded object-cover flex-shrink-0 border border-gray-700" />`;
  }
  // initials placeholder
  const initials = (name || '?').split(/\s+/).map(p => p[0] || '').join('').slice(0, 2).toUpperCase();
  return `<div class="${sz} rounded bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 border border-gray-700">${initials}</div>`;
}

function normalizeImageBasename(filename) {
  // "Jeff Jarrett.png" -> "jeff jarrett"
  return filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().toLowerCase();
}

function findPoolNameForBasename(base) {
  const pool = data.masterRoster || [];
  const exact = pool.find(n => n.toLowerCase() === base);
  if (exact) return exact;
  const soft = base.replace(/[^a-z0-9]+/g, ' ').trim();
  return pool.find(n => n.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === soft) || null;
}

function renderPoolEditor() {
  const ta = document.getElementById('pool-paste');
  const count = document.getElementById('pool-count');
  if (ta) ta.value = (data.masterRoster || []).join('\n');
  if (count) {
    const withImg = (data.masterRoster || []).filter(n => portraitFor(n)).length;
    count.textContent = `${(data.masterRoster || []).length} wrestlers in pool · ${withImg} with portraits`;
  }
}

let currentUser = null;
let claimRanked = [];

function pts(name) {
  return data.wrestlerPoints[name.toLowerCase()] || 0;
}

function champCrown(pin) {
  return pin === data.fantasyChampion ? ' 👑' : '';
}

function login(pin) {
  pin = (pin || '').trim().toLowerCase();
  // 5–10 alphanumeric only (letters or numbers, no specials/spaces)
  if (!/^[a-z0-9]{5,10}$/.test(pin)) {
    return { ok: false, error: 'PIN must be 5–10 letters or numbers (no spaces or symbols)' };
  }
  if (!data.users[pin]) return { ok: false, error: 'Unknown PIN. Try: commish (or alpha / bravo)' };
  currentUser = pin;
  return { ok: true };
}

function showTab(id) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + id)?.classList.remove('hidden');
  document.querySelector(`[data-tab="${id}"]`)?.classList.add('active');
  if (id === 'standings') renderStandings();
  if (id === 'myteam') { renderMyTeam(); renderMyTeamLogoCard(); }
  if (id === 'transactions') renderWaiver();
  if (id === 'draft') renderDraft();
  if (id === 'rules') renderScoring();
  if (id === 'commissioner') renderCommissioner();
}

function renderStandings() {
  const list = (div) => Object.entries(data.users)
    .filter(([_, u]) => u.division === div)
    .map(([pin, u]) => ({ pin, name: u.name, points: data.points[pin] || 0, maxRoster: u.maxRoster, lastDelta: u.lastDelta }))
    .sort((a, b) => b.points - a.points);

  const paint = (arr, elId) => {
    const el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = arr.map((t, i) => {
      let deltaHtml = '';
      if (t.lastDelta === 0) deltaHtml = `<span class="text-red-400 text-sm font-semibold ml-2">0</span>`;
      else if (typeof t.lastDelta === 'number' && t.lastDelta > 0) deltaHtml = `<span class="text-emerald-400 text-sm font-semibold ml-2">+${t.lastDelta}</span>`;
      return `<div class="standing-row ${t.pin === currentUser ? 'me' : ''}">
        <div class="flex items-center gap-3">
          <span class="text-gray-500 w-5 text-right">${i + 1}</span>
          ${teamLogoHtml(t.pin)}
          <span class="font-semibold">${t.name}${champCrown(t.pin)}</span>
          ${t.maxRoster > 8 ? '<span class="text-xs bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded">9</span>' : ''}
        </div>
        <div class="flex items-center"><span class="font-bold text-lg">${t.points}</span>${deltaHtml}</div>
      </div>`;
    }).join('');
  };
  paint(list('east'), 'east-standings');
  paint(list('west'), 'west-standings');
}

function renderMyTeam() {
  const u = data.users[currentUser];
  const el = document.getElementById('my-team-content');
  if (!u || u.isCommissioner) {
    el.innerHTML = `<p class="text-gray-500 py-8 text-center">Commissioner view — open Standings or Commissioner tools.</p>`;
    return;
  }
  const roster = (u.roster || []).slice().sort((a, b) => pts(b) - pts(a));
  el.innerHTML = `
    <div class="flex justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold flex items-center gap-2">${teamLogoHtml(currentUser)}<span>${u.name}${champCrown(currentUser)}</span></h2>
        <p class="text-gray-400 text-sm">${u.division === 'east' ? (data.branding?.divA || 'Division A') : (data.branding?.divB || 'Division B')} · ${roster.length}/${u.maxRoster}</p>
      </div>
      <div class="text-right">
        <div class="text-3xl font-black text-aew-gold">${data.points[currentUser] || 0}</div>
        <div class="text-xs text-gray-500">Total Points</div>
      </div>
    </div>
    <div class="bg-aew-card rounded-xl border border-gray-800 p-4">
      <h3 class="font-semibold mb-3">Roster (by points)</h3>
      <div class="grid sm:grid-cols-2 gap-2">
        ${roster.map(w => `<div class="bg-black/50 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
          ${portraitHtml(w, 'h-28 w-28')}
          <span class="flex-1 truncate">${w}</span>
          <span class="text-gray-400 font-mono text-xs">${pts(w)}</span>
        </div>`).join('')}
      </div>
    </div>`;
}

function getAvailable() {
  const div = data.users[currentUser]?.division;
  const taken = new Set();
  Object.values(data.users).forEach(u => {
    if (u.division === div) (u.roster || []).forEach(w => taken.add(w.toLowerCase()));
  });
  return data.masterRoster
    .filter(w => !taken.has(w.toLowerCase()))
    .sort((a, b) => pts(b) - pts(a));
}

function renderWaiver() {
  const box = document.getElementById('available-wrestlers');
  const avail = getAvailable();
  box.innerHTML = avail.map(w => `
    <div class="wrestler-chip px-2 py-2 rounded-lg text-sm flex items-center gap-2 cursor-pointer hover:border-gray-600 border border-transparent" data-name="${w}">
      ${portraitHtml(w, 'h-24 w-24')}
      <span class="flex-1 truncate">${w}</span>
      <span class="text-gray-500 font-mono text-xs">${pts(w)}</span>
    </div>`).join('') || '<p class="text-gray-500 text-sm p-3">None available</p>';
  box.querySelectorAll('.wrestler-chip').forEach(el => {
    el.onclick = () => {
      const n = el.dataset.name;
      if (!claimRanked.includes(n)) { claimRanked.push(n); renderClaimList(); }
    };
  });
  renderClaimList();
  renderLeagueRosters();
}

function renderClaimList() {
  const el = document.getElementById('claim-list');
  if (!claimRanked.length) {
    el.innerHTML = '<p class="text-sm text-gray-500 text-center py-6">Click wrestlers to rank a claim</p>';
    return;
  }
  el.innerHTML = claimRanked.map((w, i) => `
    <div class="flex items-center justify-between gap-2 py-1.5 text-sm">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-gray-500 text-xs w-4">${i + 1}.</span>
        ${portraitHtml(w, 'h-20 w-20')}
        <span class="truncate">${w}</span>
      </div>
      <button class="text-red-400 text-xs flex-shrink-0" data-i="${i}">✕</button>
    </div>`).join('');
  el.querySelectorAll('button').forEach(b => {
    b.onclick = () => { claimRanked.splice(+b.dataset.i, 1); renderClaimList(); };
  });
}

function renderLeagueRosters() {
  const el = document.getElementById('league-rosters-view');
  if (!el) return;
  const div = data.users[currentUser]?.division;
  const teams = Object.entries(data.users)
    .filter(([_, u]) => u.division === div)
    .sort((a, b) => (data.points[b[0]] || 0) - (data.points[a[0]] || 0));
  el.innerHTML = teams.map(([pin, u]) => {
    const roster = (u.roster || []).slice().sort((a, b) => pts(b) - pts(a));
    return `<div class="bg-aew-card rounded-xl border border-gray-800 p-4">
      <div class="flex justify-between mb-2">
        <span class="font-semibold">${u.name}${pin === currentUser ? ' (you)' : ''}${champCrown(pin)}</span>
        <span class="text-sm text-gray-400">${roster.length}/${u.maxRoster} · ${data.points[pin] || 0} pts</span>
      </div>
      <div class="flex flex-wrap gap-1.5">
        ${roster.map(w => `<span class="text-xs bg-black/60 border border-gray-700 rounded pl-1 pr-2 py-1 inline-flex items-center gap-1.5">
          ${portraitHtml(w, 'h-20 w-20')}
          <span>${w}</span>
          <span class="text-gray-500">${pts(w)}</span>
        </span>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function renderScoring() {
  const tbody = document.getElementById('scoring-table');
  if (!tbody) return;
  const rows = data.scoring || DEFAULT_SCORING;
  tbody.innerHTML = rows.map(r => `
    <tr class="border-b border-gray-800/50">
      <td class="py-2">${escapeHtml(r.action)}</td>
      <td class="text-center font-mono">${r.tv}</td>
      <td class="text-center font-mono">${r.ppv}</td>
    </tr>`).join('');
}

function renderCommissioner() {
  renderLeagueSetupForm();
  renderPoolEditor();
  renderTeamsInvite();
  renderScoringEditor();
  renderWheelEditor();
  renderCoinFlip();
  renderForeignObjects();
  const el = document.getElementById('score-inputs');
  const teams = Object.entries(data.users).filter(([_, u]) => u.division)
    .sort((a, b) => a[1].division.localeCompare(b[1].division) || a[1].name.localeCompare(b[1].name));
  el.innerHTML = teams.map(([pin, u]) => `
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-xs text-gray-500 w-10">${u.division === 'east' ? 'A' : 'B'}</span>
      <span class="text-sm w-20 font-medium">${u.name}</span>
      <span class="text-xs text-gray-500">Now: <span class="text-white font-mono">${data.points[pin] || 0}</span></span>
      <input type="number" data-pin="${pin}" class="score-add-input w-24 bg-black border border-gray-700 rounded-lg px-2 py-1.5 text-sm" placeholder="New total" />
    </div>`).join('');
  drawWheel();
}

function renderTeamsInvite() {
  const el = document.getElementById('teams-invite-list');
  if (!el) return;
  const teams = Object.entries(data.users).filter(([_, u]) => u.division)
    .sort((a, b) => a[1].division.localeCompare(b[1].division) || a[1].name.localeCompare(b[1].name));
  el.innerHTML = teams.map(([pin, u]) => `
    <div class="flex flex-wrap items-center gap-2 bg-black/40 rounded-lg px-3 py-2">
      <span class="text-xs text-gray-500 w-8">${u.division === 'east' ? 'A' : 'B'}</span>
      <input type="text" data-pin="${pin}" class="team-name-input flex-1 min-w-[8rem] bg-black border border-gray-700 rounded-lg px-2 py-1.5 text-sm" value="${escapeHtml(u.name)}" maxlength="20" />
      <code class="text-xs bg-gray-900 border border-gray-700 px-2 py-1 rounded select-all">${pin}</code>
      <button type="button" class="copy-pin-btn text-xs text-gray-400 hover:text-white" data-pin="${pin}">Copy</button>
    </div>`).join('');
  el.querySelectorAll('.team-name-input').forEach(inp => {
    inp.onchange = () => {
      const pin = inp.dataset.pin;
      const name = (inp.value || '').trim() || pin.toUpperCase();
      if (data.users[pin]) data.users[pin].name = name;
      data.branding = data.branding || defaultBranding();
      data.branding.teamNames = data.branding.teamNames || {};
      data.branding.teamNames[pin] = name;
      saveBranding(data.branding);
      renderStandings();
      renderMyTeam();
    };
  });
  el.querySelectorAll('.copy-pin-btn').forEach(btn => {
    btn.onclick = () => {
      navigator.clipboard?.writeText(btn.dataset.pin).then(() => {
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1200);
      }).catch(() => {});
    };
  });
}

function renderScoringEditor() {
  const tbody = document.getElementById('scoring-editor-body');
  if (!tbody) return;
  const rows = data.scoring || DEFAULT_SCORING;
  tbody.innerHTML = rows.map((r, i) => `
    <tr class="border-b border-gray-800/50" data-i="${i}">
      <td class="py-1.5 pr-2"><input type="text" class="score-action w-full bg-black border border-gray-700 rounded px-2 py-1 text-sm" value="${escapeHtml(r.action)}" /></td>
      <td class="py-1.5 text-center"><input type="number" class="score-tv w-16 bg-black border border-gray-700 rounded px-1 py-1 text-sm text-center" value="${r.tv}" /></td>
      <td class="py-1.5 text-center"><input type="number" class="score-ppv w-16 bg-black border border-gray-700 rounded px-1 py-1 text-sm text-center" value="${r.ppv}" /></td>
      <td class="py-1.5 text-center"><button type="button" class="score-del text-red-400 text-xs hover:text-red-300" data-i="${i}">✕</button></td>
    </tr>`).join('');
  tbody.querySelectorAll('.score-del').forEach(btn => {
    btn.onclick = () => {
      const i = +btn.dataset.i;
      data.scoring.splice(i, 1);
      renderScoringEditor();
    };
  });
}

function renderWheelEditor() {
  const enabledEl = document.getElementById('wheel-enabled');
  const body = document.getElementById('wheel-module-body');
  const note = document.getElementById('wheel-disabled-note');
  const segsEl = document.getElementById('wheel-segments-editor');
  if (enabledEl) enabledEl.checked = !!data.wheelEnabled;
  if (body) body.classList.toggle('hidden', !data.wheelEnabled);
  if (note) note.classList.toggle('hidden', !!data.wheelEnabled);
  if (!segsEl) return;
  const segs = data.wheel || DEFAULT_WHEEL;
  segsEl.innerHTML = segs.map((s, i) => `
    <div class="flex items-center gap-2" data-i="${i}">
      <input type="text" class="wheel-label flex-1 bg-black border border-gray-700 rounded px-2 py-1 text-sm" value="${escapeHtml(s.label)}" placeholder="Label" />
      <input type="color" class="wheel-color w-10 h-8 bg-black border border-gray-700 rounded cursor-pointer" value="${s.color || '#666'}" />
      <button type="button" class="wheel-del text-red-400 text-xs" data-i="${i}">✕</button>
    </div>`).join('');
  segsEl.querySelectorAll('.wheel-del').forEach(btn => {
    btn.onclick = () => {
      data.wheel.splice(+btn.dataset.i, 1);
      renderWheelEditor();
      drawWheel();
    };
  });
  drawWheel();
}

function renderCoinFlip() {
  const enabledEl = document.getElementById('coinflip-enabled');
  const body = document.getElementById('coinflip-body');
  if (enabledEl) enabledEl.checked = data.coinFlipEnabled !== false;
  if (body) body.classList.toggle('opacity-40', data.coinFlipEnabled === false);
}

function renderForeignObjects() {
  const enabledEl = document.getElementById('fo-enabled');
  const list = document.getElementById('fo-list');
  if (enabledEl) enabledEl.checked = data.foEnabled !== false;
  if (!list) return;
  if (data.foEnabled === false) {
    list.innerHTML = '<p class="text-gray-500 text-sm">Foreign Objects are currently disabled for this league.</p>';
    return;
  }
  list.innerHTML = FOREIGN_OBJECTS.map(fo => `
    <div class="bg-black/40 rounded-lg p-3 border border-gray-800">
      <div class="font-semibold text-sm mb-1">${escapeHtml(fo.name)}</div>
      <div class="text-xs text-gray-400 leading-snug">${escapeHtml(fo.desc)}</div>
    </div>`).join('');
}

function drawWheel() {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const segs = (data.wheel && data.wheel.length) ? data.wheel : DEFAULT_WHEEL;
  const c = 100, r = 90, seg = (2 * Math.PI) / Math.max(segs.length, 1);
  ctx.clearRect(0, 0, 200, 200);
  segs.forEach((s, i) => {
    const a0 = i * seg - Math.PI / 2, a1 = a0 + seg;
    ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, r, a0, a1); ctx.closePath();
    ctx.fillStyle = s.color || '#444'; ctx.fill();
    ctx.save(); ctx.translate(c, c); ctx.rotate(a0 + seg / 2);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText((s.label || '').slice(0, 10), r * 0.55, 4); ctx.restore();
  });
}

function enterApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  const u = data.users[currentUser];
  document.getElementById('user-badge').textContent = u.name + (u.isCommissioner ? ' · Commish' : '');
  document.getElementById('commish-nav').classList.toggle('hidden', !u.isCommissioner);
  showTab('standings');
}


// ---------- Demo draft ----------
let demoDraft = {
  status: 'active',
  order: ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot'],
  currentPick: 0,
  picks: []
};

function getDraftAvailable() {
  const taken = new Set(demoDraft.picks.map(p => p.wrestler.toLowerCase()));
  // also exclude anyone on current team rosters for realism? For demo, only drafted names taken
  return (data.masterRoster || []).filter(w => !taken.has(w.toLowerCase()))
    .sort((a, b) => pts(b) - pts(a) || a.localeCompare(b));
}

function snakePin(order, pickIndex) {
  const n = order.length;
  if (!n) return null;
  const round = Math.floor(pickIndex / n);
  const pos = pickIndex % n;
  return round % 2 === 0 ? order[pos] : order[n - 1 - pos];
}

function renderDraft() {
  const statusEl = document.getElementById('draft-status-bar');
  const pickArea = document.getElementById('draft-pick-area');
  const boardEl = document.getElementById('draft-board');
  if (!statusEl || !pickArea) return;

  const order = demoDraft.order;
  const pin = snakePin(order, demoDraft.currentPick);
  const onClock = data.users[pin]?.name || pin;
  const isMyTurn = pin === currentUser;
  const isCommish = data.users[currentUser]?.isCommissioner;

  statusEl.innerHTML = `
    <div class="flex flex-wrap justify-between gap-2">
      <div><span class="font-bold">Demo Draft</span>
        <span class="ml-2 text-xs px-2 py-0.5 rounded bg-emerald-900 text-emerald-300">${demoDraft.status}</span>
      </div>
      <div class="text-gray-400">Pick ${demoDraft.currentPick + 1}</div>
    </div>
    <div class="text-xs text-gray-500 mt-1">Order: ${order.map(p => data.users[p]?.name || p).join(' → ')}</div>
  `;

  if (demoDraft.status !== 'active') {
    pickArea.innerHTML = '<div class="text-center text-emerald-400 py-4">Draft complete (demo)</div>';
  } else {
    const available = getDraftAvailable();
    pickArea.innerHTML = `
      <div class="text-center mb-4">
        <div class="text-sm text-gray-400">On the clock</div>
        <div class="text-2xl font-bold ${isMyTurn ? 'text-aew-gold' : ''}">${onClock}${isMyTurn ? ' (you)' : ''}</div>
      </div>
      ${(isMyTurn || isCommish) ? `
        <div class="max-h-96 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${available.slice(0, 80).map(w => `
            <button class="draft-pick-btn text-left px-2 py-2 rounded bg-black/50 hover:bg-gray-800 border border-gray-800 flex items-center gap-2" data-name="${w}">
              ${portraitHtml(w, 'h-14 w-14')}
              <span class="flex-1 truncate text-sm">${w}</span>
              <span class="text-gray-500 font-mono text-xs">${pts(w)}</span>
            </button>
          `).join('')}
        </div>
      ` : `<p class="text-center text-gray-500 text-sm py-6">Waiting for ${onClock} to pick...</p>`}
    `;
    pickArea.querySelectorAll('.draft-pick-btn').forEach(btn => {
      btn.onclick = () => {
        const w = btn.dataset.name;
        if (!confirm('Draft ' + w + '?')) return;
        demoDraft.picks.push({
          pick_number: demoDraft.picks.length + 1,
          pin,
          wrestler: w
        });
        // add to that team's roster in demo memory if room
        const u = data.users[pin];
        if (u && (u.roster || []).length < (u.maxRoster || 8) && !(u.roster || []).includes(w)) {
          u.roster = [...(u.roster || []), w];
        }
        demoDraft.currentPick++;
        if (demoDraft.currentPick >= order.length * 8) demoDraft.status = 'complete';
        renderDraft();
        renderStandings();
      };
    });
  }

  if (boardEl) {
    if (!demoDraft.picks.length) {
      boardEl.innerHTML = '<p class="text-gray-500">No picks yet — make a pick above</p>';
    } else {
      boardEl.innerHTML = demoDraft.picks.map(p => `
        <div class="flex gap-3 items-center bg-black/40 rounded-lg px-3 py-2">
          <span class="text-gray-500 w-8">#${p.pick_number}</span>
          <span class="font-medium w-20 truncate">${data.users[p.pin]?.name || p.pin}</span>
          ${portraitHtml(p.wrestler, 'h-12 w-12')}
          <span class="truncate">${p.wrestler}</span>
        </div>
      `).join('');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  data.branding = loadBranding();
  applyBranding();
  // apply saved team display names
  if (data.branding?.teamNames) {
    Object.entries(data.branding.teamNames).forEach(([pin, name]) => {
      if (data.users[pin] && name) data.users[pin].name = name;
    });
  }
  data.portraits = loadPortraits();
  const savedPool = loadPool();
  if (savedPool) data.masterRoster = savedPool;
  data.scoring = loadScoring();
  const wcfg = loadWheelConfig();
  data.wheelEnabled = wcfg.enabled;
  data.wheel = wcfg.segments;
  data.coinFlipEnabled = wcfg.coinFlipEnabled !== false;
  data.foEnabled = wcfg.foEnabled !== false;

  document.getElementById('login-btn').onclick = () => {
    const res = login(document.getElementById('pin-input').value);
    if (res.ok) enterApp();
    else {
      const e = document.getElementById('login-error');
      e.textContent = res.error; e.classList.remove('hidden');
    }
  };
  const pinInput = document.getElementById('pin-input');
  if (pinInput) {
    // Live filter: only letters + numbers, max 10
    pinInput.addEventListener('input', () => {
      const cleaned = pinInput.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
      if (pinInput.value !== cleaned) pinInput.value = cleaned;
    });
    pinInput.onkeydown = e => {
      if (e.key === 'Enter') document.getElementById('login-btn').click();
    };
  }
  document.getElementById('logout-btn').onclick = () => {
    currentUser = null;
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
  };
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.onclick = () => showTab(b.dataset.tab);
  });
  document.getElementById('tx-tab-waivers').onclick = () => {
    document.getElementById('tx-waivers-panel').classList.remove('hidden');
    document.getElementById('tx-rosters-panel').classList.add('hidden');
    document.getElementById('tx-tab-waivers').className = 'px-4 py-2 rounded-lg text-sm font-medium bg-aew-red text-white';
    document.getElementById('tx-tab-rosters').className = 'px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300';
  };
  document.getElementById('tx-tab-rosters').onclick = () => {
    document.getElementById('tx-waivers-panel').classList.add('hidden');
    document.getElementById('tx-rosters-panel').classList.remove('hidden');
    document.getElementById('tx-tab-rosters').className = 'px-4 py-2 rounded-lg text-sm font-medium bg-aew-red text-white';
    document.getElementById('tx-tab-waivers').className = 'px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300';
    renderLeagueRosters();
  };
  document.getElementById('save-scores').onclick = () => {
    document.querySelectorAll('.score-add-input').forEach(input => {
      const raw = (input.value || '').trim();
      if (raw === '') return;
      const pin = input.dataset.pin;
      const newTotal = parseInt(raw, 10);
      if (isNaN(newTotal)) return;
      const cur = data.points[pin] || 0;
      data.points[pin] = newTotal;
      data.users[pin].lastDelta = newTotal - cur;
      input.value = '';
    });
    renderCommissioner();
    renderStandings();
    alert('Demo scores updated (in this browser only).');
  };

  document.getElementById('setup-save')?.addEventListener('click', saveLeagueSetupUI);

  document.getElementById('pool-save')?.addEventListener('click', () => {
    const text = document.getElementById('pool-paste')?.value || '';
    const names = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    savePool(names);
    renderPoolEditor();
    alert('Saved ' + names.length + ' wrestlers to the pool.');
  });
  document.getElementById('pool-add-btn')?.addEventListener('click', () => {
    const input = document.getElementById('pool-add-name');
    const msg = document.getElementById('pool-add-msg');
    const name = (input?.value || '').trim();
    if (!name) {
      if (msg) { msg.textContent = 'Enter a name'; msg.className = 'text-sm text-red-400'; }
      return;
    }
    if (data.masterRoster.some(w => w.toLowerCase() === name.toLowerCase())) {
      if (msg) { msg.textContent = 'Already in pool'; msg.className = 'text-sm text-yellow-400'; }
      return;
    }
    savePool([...data.masterRoster, name]);
    if (input) input.value = '';
    renderPoolEditor();
    if (msg) { msg.textContent = 'Added "' + name + '"'; msg.className = 'text-sm text-emerald-400'; }
  });
  document.getElementById('pool-csv')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const names = text.split(/\r?\n/)
      .map(line => line.split(',')[0].replace(/^"|"$/g, '').trim())
      .filter(n => n && n.toLowerCase() !== 'name' && n.toLowerCase() !== 'wrestler');
    document.getElementById('pool-paste').value = names.join('\n');
    savePool(names);
    renderPoolEditor();
    alert('Loaded ' + names.length + ' names from file.');
  });
  document.getElementById('pool-image-pack')?.addEventListener('change', async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    const msg = document.getElementById('pool-image-msg');
    if (msg) { msg.textContent = 'Processing ' + files.length + ' images...'; msg.className = 'text-sm text-yellow-400'; }
    let matched = 0, skipped = 0;
    const map = { ...(data.portraits || {}) };
    for (const file of files) {
      const base = normalizeImageBasename(file.name);
      const wrestler = findPoolNameForBasename(base);
      if (!wrestler) { skipped++; continue; }
      try {
        const url = await fileToDataUrl(file, 256, 600 * 1024);
        map[wrestler.toLowerCase()] = url;
        matched++;
      } catch (err) {
        skipped++;
      }
    }
    savePortraits(map);
    renderPoolEditor();
    if (msg) {
      msg.textContent = 'Matched ' + matched + ' portrait(s). ' + (skipped ? skipped + ' skipped (no name match or error).' : '');
      msg.className = 'text-sm text-emerald-400';
    }
    // refresh visible roster UIs if open
    if (currentUser) {
      renderWaiver();
      renderMyTeam();
    }
  });

  document.getElementById('my-team-logo-save')?.addEventListener('click', saveMyTeamLogo);
  document.getElementById('my-team-logo-clear')?.addEventListener('click', clearMyTeamLogo);
  document.getElementById('setup-league-logo')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataUrl(file, 800, 1024 * 1024);
      data.branding = data.branding || defaultBranding();
      data.branding.leagueLogo = url;
      const prev = document.getElementById('setup-league-logo-preview');
      if (prev) { prev.src = url; prev.classList.remove('hidden'); }
      document.getElementById('setup-clear-league-logo')?.classList.remove('hidden');
    } catch (err) {
      alert(err.message || 'Upload failed');
    }
  });
  document.getElementById('setup-clear-league-logo')?.addEventListener('click', () => {
    if (data.branding) data.branding.leagueLogo = null;
    const prev = document.getElementById('setup-league-logo-preview');
    if (prev) { prev.classList.add('hidden'); prev.removeAttribute('src'); }
    document.getElementById('setup-clear-league-logo')?.classList.add('hidden');
    const inp = document.getElementById('setup-league-logo');
    if (inp) inp.value = '';
  });

  document.getElementById('spin-wheel').onclick = () => {
    const segs = data.wheel || DEFAULT_WHEEL;
    if (!segs.length) return;
    const i = Math.floor(Math.random() * segs.length);
    document.getElementById('wheel-result').textContent = segs[i].label;
  };

  // Scoring editor
  document.getElementById('scoring-load-aew')?.addEventListener('click', () => {
    data.scoring = DEFAULT_SCORING.map(r => ({ ...r }));
    renderScoringEditor();
    const msg = document.getElementById('scoring-editor-msg');
    if (msg) { msg.textContent = 'AEW preset loaded (not saved yet)'; msg.className = 'text-sm mt-2 text-yellow-400'; }
  });
  document.getElementById('scoring-add-row')?.addEventListener('click', () => {
    data.scoring = data.scoring || [];
    data.scoring.push({ action: 'New action', tv: 0, ppv: 0 });
    renderScoringEditor();
  });
  document.getElementById('scoring-save')?.addEventListener('click', () => {
    const tbody = document.getElementById('scoring-editor-body');
    if (!tbody) return;
    const rows = [];
    tbody.querySelectorAll('tr').forEach(tr => {
      const action = tr.querySelector('.score-action')?.value?.trim() || '';
      const tv = parseInt(tr.querySelector('.score-tv')?.value, 10) || 0;
      const ppv = parseInt(tr.querySelector('.score-ppv')?.value, 10) || 0;
      if (action) rows.push({ action, tv, ppv });
    });
    if (!rows.length) {
      const msg = document.getElementById('scoring-editor-msg');
      if (msg) { msg.textContent = 'Need at least one row'; msg.className = 'text-sm mt-2 text-red-400'; }
      return;
    }
    saveScoring(rows);
    renderScoring();
    const msg = document.getElementById('scoring-editor-msg');
    if (msg) { msg.textContent = 'Scoring saved'; msg.className = 'text-sm mt-2 text-emerald-400'; }
  });

  // Wheel editor
  document.getElementById('wheel-enabled')?.addEventListener('change', (e) => {
    data.wheelEnabled = e.target.checked;
    saveWheelConfig({
      enabled: data.wheelEnabled,
      segments: data.wheel || DEFAULT_WHEEL,
      coinFlipEnabled: data.coinFlipEnabled,
      foEnabled: data.foEnabled
    });
    renderWheelEditor();
  });
  document.getElementById('wheel-add-seg')?.addEventListener('click', () => {
    data.wheel = data.wheel || [];
    data.wheel.push({ label: 'New', color: '#666666' });
    renderWheelEditor();
  });
  document.getElementById('wheel-save')?.addEventListener('click', () => {
    const segsEl = document.getElementById('wheel-segments-editor');
    if (!segsEl) return;
    const segs = [];
    segsEl.querySelectorAll('[data-i]').forEach(row => {
      const label = row.querySelector('.wheel-label')?.value?.trim() || '';
      const color = row.querySelector('.wheel-color')?.value || '#666';
      if (label) segs.push({ label, color });
    });
    if (!segs.length) {
      const msg = document.getElementById('wheel-editor-msg');
      if (msg) { msg.textContent = 'Need at least one segment'; msg.className = 'text-sm mt-2 text-red-400'; }
      return;
    }
    data.wheel = segs;
    saveWheelConfig({
      enabled: data.wheelEnabled,
      segments: segs,
      coinFlipEnabled: data.coinFlipEnabled,
      foEnabled: data.foEnabled
    });
    drawWheel();
    const msg = document.getElementById('wheel-editor-msg');
    if (msg) { msg.textContent = 'Wheel saved'; msg.className = 'text-sm mt-2 text-emerald-400'; }
  });

  // Coin Flip
  document.getElementById('coinflip-enabled')?.addEventListener('change', (e) => {
    data.coinFlipEnabled = e.target.checked;
    saveWheelConfig({
      enabled: data.wheelEnabled,
      segments: data.wheel || DEFAULT_WHEEL,
      coinFlipEnabled: data.coinFlipEnabled,
      foEnabled: data.foEnabled
    });
    renderCoinFlip();
  });
  document.getElementById('coinflip-btn')?.addEventListener('click', () => {
    if (data.coinFlipEnabled === false) return;
    const result = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
    const el = document.getElementById('coinflip-result');
    if (el) {
      el.textContent = result;
      el.className = 'mt-3 text-2xl font-black min-h-10 ' + (result === 'HEADS' ? 'text-emerald-400' : 'text-aew-gold');
    }
  });

  // Foreign Objects
  document.getElementById('fo-enabled')?.addEventListener('change', (e) => {
    data.foEnabled = e.target.checked;
    saveWheelConfig({
      enabled: data.wheelEnabled,
      segments: data.wheel || DEFAULT_WHEEL,
      coinFlipEnabled: data.coinFlipEnabled,
      foEnabled: data.foEnabled
    });
    renderForeignObjects();
  });
});

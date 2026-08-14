// Wrestling Fantasy — Public Demo (no real league data, no Supabase)
const SCORING = [
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

const WHEEL = [
  { label: '+20', color: '#3b82f6' },
  { label: '+30', color: '#8b5cf6' },
  { label: '+40', color: '#ec4899' },
  { label: '+50', color: '#ef4444' },
  { label: 'Roster 9', color: '#10b981' },
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

let data = {
  users: seedUsers(),
  points: { ...POINTS },
  masterRoster: MASTER.slice(),
  wrestlerPoints: { ...WRESTLER_PTS },
  fantasyChampion: 'charlie',
  branding: null
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
    teamLogos: {} // pin -> data URL
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
  return String(s).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"');
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
  if (!data.users[pin]) return { ok: false, error: 'Try: alpha, bravo, or commish' };
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
  tbody.innerHTML = SCORING.map(r => `
    <tr class="border-b border-gray-800/50">
      <td class="py-2">${r.action}</td>
      <td class="text-center font-mono">${r.tv}</td>
      <td class="text-center font-mono">${r.ppv}</td>
    </tr>`).join('');
}

function renderCommissioner() {
  renderLeagueSetupForm();
  renderPoolEditor();
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

function drawWheel() {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const c = 100, r = 90, seg = (2 * Math.PI) / WHEEL.length;
  ctx.clearRect(0, 0, 200, 200);
  WHEEL.forEach((s, i) => {
    const a0 = i * seg - Math.PI / 2, a1 = a0 + seg;
    ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, r, a0, a1); ctx.closePath();
    ctx.fillStyle = s.color; ctx.fill();
    ctx.save(); ctx.translate(c, c); ctx.rotate(a0 + seg / 2);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(s.label, r * 0.55, 4); ctx.restore();
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

document.addEventListener('DOMContentLoaded', () => {
  data.branding = loadBranding();
  applyBranding();
  data.portraits = loadPortraits();
  const savedPool = loadPool();
  if (savedPool) data.masterRoster = savedPool;


  document.getElementById('login-btn').onclick = () => {
    const res = login(document.getElementById('pin-input').value);
    if (res.ok) enterApp();
    else {
      const e = document.getElementById('login-error');
      e.textContent = res.error; e.classList.remove('hidden');
    }
  };
  document.getElementById('pin-input').onkeydown = e => {
    if (e.key === 'Enter') document.getElementById('login-btn').click();
  };
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
    const i = Math.floor(Math.random() * WHEEL.length);
    document.getElementById('wheel-result').textContent = WHEEL[i].label;
  };
});

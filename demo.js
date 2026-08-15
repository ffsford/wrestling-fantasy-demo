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

const DEFAULT_CALENDAR = [
  { name: 'AEW Dynamite', type: 'Weekly TV', howOften: 'Weekly', day: 'Wednesday', date: '', notes: '' },
  { name: 'AEW Collision', type: 'Weekly TV', howOften: 'Weekly', day: 'Saturday', date: '', notes: '' },
  { name: 'WWE Raw', type: 'Weekly TV', howOften: 'Weekly', day: 'Monday', date: '', notes: '' },
  { name: 'WWE SmackDown', type: 'Weekly TV', howOften: 'Weekly', day: 'Friday', date: '', notes: '' }
];
const EVENT_TYPES = ['Weekly TV', 'Special TV', 'PPV/PLE', 'Foreign Object', 'Draft', 'Other'];
const HOW_OFTEN = ['Weekly', 'Monthly', 'Quarterly', 'One-time'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SEASON_KEY = 'wf_demo_season';
function defaultSeason() {
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 6);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

const DEFAULT_TRADE_RULES = `You may trade at any point (except when a show is live). Both rosters must end at 8 wrestlers after the trade (or 9 if a player has the Foreign Object roster expansion).
Trades are locked in the last 30 days of the season and can be subject to veto.`;

const DEFAULT_BONUS = [
  {
    title: 'Tag Team Bonus Points',
    applies: 'applied to player',
    rows: [
      { label: 'Having 2 members drafted for a tag team match', pts: 2 },
      { label: 'Having 3 members drafted for a tag team match', pts: 3 },
      { label: 'Having 4 members drafted for a tag team match', pts: 4 },
      { label: 'Having 5 members drafted for a tag team match', pts: 5 }
    ]
  },
  {
    title: 'Rivalry Bonus Points',
    applies: 'applied to player',
    rows: [
      { label: 'Having 2 members drafted as opponents', pts: 2 },
      { label: 'Having 3 members drafted as opponents', pts: 3 },
      { label: 'Having 4 members drafted as opponents', pts: 4 },
      { label: 'Having 5 members drafted as opponents', pts: 5 }
    ]
  },
  {
    title: 'Ending Multi-Person Match',
    applies: 'applied to wrestler',
    rows: [
      { label: 'Ending a multi-person match', pts: 1 }
    ]
  },
  {
    title: 'Tournament Bonus Points',
    applies: 'applied to wrestler',
    rows: [
      { label: 'Winning opening round match', pts: 1 },
      { label: 'Winning additional match(es)', pts: 2 },
      { label: 'Winning tournament finals', pts: 3 }
    ]
  }
];

const RULES_KEY = 'wf_demo_league_rules';

function defaultLeagueRules() {
  return {
    tradeEnabled: true,
    tradeText: DEFAULT_TRADE_RULES,
    bonusEnabled: true,
    bonus: DEFAULT_BONUS.map(c => ({
      title: c.title,
      applies: c.applies,
      rows: c.rows.map(r => ({ ...r }))
    }))
  };
}

function loadLeagueRules() {
  try {
    const raw = localStorage.getItem(RULES_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      return {
        tradeEnabled: obj.tradeEnabled !== false,
        tradeText: obj.tradeText != null ? obj.tradeText : DEFAULT_TRADE_RULES,
        bonusEnabled: obj.bonusEnabled !== false,
        bonus: Array.isArray(obj.bonus) && obj.bonus.length
          ? obj.bonus.map(c => ({
              title: c.title || '',
              applies: c.applies || '',
              rows: Array.isArray(c.rows) ? c.rows.map(r => ({ label: r.label || '', pts: +r.pts || 0 })) : []
            }))
          : defaultLeagueRules().bonus
      };
    }
  } catch (e) {}
  return defaultLeagueRules();
}

function saveLeagueRules(rules) {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  data.leagueRules = rules;
}

const DEFAULT_FOREIGN_OBJECTS = [
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
    desc: 'Ahead of any week with multiple TV shows, you may cash this in and receive PPV points for both shows.'
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
  calendar: DEFAULT_CALENDAR.map(s => ({ ...s })),
  season: defaultSeason(),
  wheel: DEFAULT_WHEEL.map(s => ({ ...s })),
  wheelName: 'The Wheel of Boom',
  wheelEnabled: true,
  coinFlipEnabled: true,
  foEnabled: true,
  foreignObjects: DEFAULT_FOREIGN_OBJECTS.map(f => ({ ...f })),
  leagueRules: defaultLeagueRules()
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

const CALENDAR_KEY = 'wf_demo_calendar';

function loadCalendar() {
  try {
    const raw = localStorage.getItem(CALENDAR_KEY) || localStorage.getItem('wf_demo_schedule');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr.map(s => ({
          name: s.name || '',
          type: s.type || 'Weekly TV',
          howOften: s.howOften || 'Weekly',
          day: s.day || '',
          date: s.date || '',
          notes: s.notes || ''
        }));
      }
    }
  } catch (e) {}
  return DEFAULT_CALENDAR.map(s => ({ ...s }));
}

function saveCalendar(arr) {
  localStorage.setItem(CALENDAR_KEY, JSON.stringify(arr));
  data.calendar = arr;
}

function loadSeason() {
  try {
    const raw = localStorage.getItem(SEASON_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && obj.start) return { start: obj.start, end: obj.end || '' };
    }
  } catch (e) {}
  return defaultSeason();
}

function saveSeason(obj) {
  localStorage.setItem(SEASON_KEY, JSON.stringify(obj));
  data.season = obj;
}

function addSixMonths(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T12:00:00');
  if (isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().slice(0, 10);
}

function formatSeasonDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch (e) {
    return iso;
  }
}

function loadWheelConfig() {
  try {
    const raw = localStorage.getItem(WHEEL_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      return {
        enabled: obj.enabled !== false,
        name: obj.name || 'The Wheel of Boom',
        segments: Array.isArray(obj.segments) && obj.segments.length
          ? obj.segments.map(s => ({ label: s.label || '', color: s.color || '#666' }))
          : DEFAULT_WHEEL.map(s => ({ ...s })),
        coinFlipEnabled: obj.coinFlipEnabled !== false,
        foEnabled: obj.foEnabled !== false,
        foreignObjects: Array.isArray(obj.foreignObjects) && obj.foreignObjects.length
          ? obj.foreignObjects.map(f => ({ name: f.name || '', desc: f.desc || '' }))
          : DEFAULT_FOREIGN_OBJECTS.map(f => ({ ...f }))
      };
    }
  } catch (e) {}
  return {
    enabled: true,
    name: 'The Wheel of Boom',
    segments: DEFAULT_WHEEL.map(s => ({ ...s })),
    coinFlipEnabled: true,
    foEnabled: true,
    foreignObjects: DEFAULT_FOREIGN_OBJECTS.map(f => ({ ...f }))
  };
}

function saveWheelConfig(cfg) {
  localStorage.setItem(WHEEL_KEY, JSON.stringify(cfg));
  data.wheelEnabled = cfg.enabled;
  data.wheel = cfg.segments;
  if (cfg.name !== undefined) data.wheelName = cfg.name;
  if (cfg.coinFlipEnabled !== undefined) data.coinFlipEnabled = cfg.coinFlipEnabled;
  if (cfg.foEnabled !== undefined) data.foEnabled = cfg.foEnabled;
  if (cfg.foreignObjects !== undefined) data.foreignObjects = cfg.foreignObjects;
}

function currentWheelConfig() {
  return {
    enabled: data.wheelEnabled,
    name: data.wheelName || 'The Wheel of Boom',
    segments: data.wheel || DEFAULT_WHEEL,
    coinFlipEnabled: data.coinFlipEnabled !== false,
    foEnabled: data.foEnabled !== false,
    foreignObjects: data.foreignObjects || DEFAULT_FOREIGN_OBJECTS.map(f => ({ ...f }))
  };
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
let activeTab = 'standings';

const SESSION_KEY = 'wf_demo_session';

function saveSession() {
  if (!currentUser) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ pin: currentUser, tab: activeTab || 'standings' }));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && obj.pin && data.users[obj.pin]) {
      return { pin: obj.pin, tab: obj.tab || 'standings' };
    }
  } catch (e) {}
  return null;
}

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
  saveSession();
  return { ok: true };
}

function showTab(id) {
  activeTab = id;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + id)?.classList.remove('hidden');
  document.querySelector(`[data-tab="${id}"]`)?.classList.add('active');
  if (id === 'standings') renderStandings();
  if (id === 'calendar') renderCalendarView();
  if (id === 'myteam') { renderMyTeam(); renderMyTeamLogoCard(); }
  if (id === 'transactions') renderWaiver();
  if (id === 'draft') renderDraft();
  if (id === 'rules') renderScoring();
  if (id === 'commissioner') renderCommissioner();
  saveSession();
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
  if (tbody) {
    const rows = data.scoring || DEFAULT_SCORING;
    tbody.innerHTML = rows.map(r => `
      <tr class="border-b border-gray-800/50">
        <td class="py-2">${escapeHtml(r.action)}</td>
        <td class="text-center font-mono">${r.tv}</td>
        <td class="text-center font-mono">${r.ppv}</td>
      </tr>`).join('');
  }
  renderPublicRules();
}

function renderPublicRules() {
  const rules = data.leagueRules || defaultLeagueRules();
  const tradeBlock = document.getElementById('rules-trade-block');
  const tradeBody = document.getElementById('rules-trade-body');
  const bonusBlock = document.getElementById('rules-bonus-block');
  const bonusBody = document.getElementById('rules-bonus-body');

  if (tradeBlock && tradeBody) {
    if (rules.tradeEnabled && rules.tradeText) {
      tradeBlock.classList.remove('hidden');
      tradeBody.textContent = rules.tradeText;
    } else {
      tradeBlock.classList.add('hidden');
    }
  }
  if (bonusBlock && bonusBody) {
    if (rules.bonusEnabled && rules.bonus?.length) {
      bonusBlock.classList.remove('hidden');
      bonusBody.innerHTML = rules.bonus.map(cat => `
        <div>
          <div class="font-semibold">${escapeHtml(cat.title)}
            ${cat.applies ? `<span class="text-gray-500 font-normal text-xs"> (${escapeHtml(cat.applies)})</span>` : ''}
          </div>
          <ul class="mt-1 space-y-0.5 text-gray-300">
            ${(cat.rows || []).map(r => `
              <li class="flex justify-between gap-4">
                <span>${escapeHtml(r.label)}</span>
                <span class="text-aew-gold font-semibold whitespace-nowrap">+${r.pts}</span>
              </li>`).join('')}
          </ul>
        </div>`).join('');
    } else {
      bonusBlock.classList.add('hidden');
    }
  }
}

function renderTradeRulesEditor() {
  const rules = data.leagueRules || defaultLeagueRules();
  const en = document.getElementById('trade-rules-enabled');
  const ta = document.getElementById('trade-rules-text');
  if (en) en.checked = rules.tradeEnabled !== false;
  if (ta) ta.value = rules.tradeText || '';
}

function renderBonusEditor() {
  const rules = data.leagueRules || defaultLeagueRules();
  const en = document.getElementById('bonus-enabled');
  const list = document.getElementById('bonus-editor-list');
  if (en) en.checked = rules.bonusEnabled !== false;
  if (!list) return;
  const cats = rules.bonus || [];
  list.innerHTML = cats.map((cat, ci) => `
    <div class="bg-black/40 rounded-lg p-3 border border-gray-800 space-y-2" data-ci="${ci}">
      <div class="flex flex-wrap items-center gap-2">
        <input type="text" class="bonus-title flex-1 min-w-[8rem] bg-black border border-gray-700 rounded px-2 py-1.5 text-sm font-semibold" value="${escapeHtml(cat.title)}" placeholder="Category title" />
        <input type="text" class="bonus-applies w-40 bg-black border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-400" value="${escapeHtml(cat.applies || '')}" placeholder="applied to..." />
        <button type="button" class="bonus-del-cat text-red-400 text-xs" data-ci="${ci}">✕</button>
      </div>
      <div class="space-y-1 pl-1">
        ${(cat.rows || []).map((r, ri) => `
          <div class="flex items-center gap-2" data-ri="${ri}">
            <input type="text" class="bonus-label flex-1 bg-black border border-gray-700 rounded px-2 py-1 text-sm" value="${escapeHtml(r.label)}" placeholder="Bonus description" />
            <input type="number" class="bonus-pts w-16 bg-black border border-gray-700 rounded px-2 py-1 text-sm text-center" value="${r.pts}" />
            <button type="button" class="bonus-del-row text-red-400 text-xs" data-ci="${ci}" data-ri="${ri}">✕</button>
          </div>`).join('')}
      </div>
      <button type="button" class="bonus-add-row text-xs text-gray-400 hover:text-white" data-ci="${ci}">+ Row</button>
    </div>`).join('') || '<p class="text-gray-500 text-sm">No bonus categories. Add one or Reset to defaults.</p>';

  list.querySelectorAll('.bonus-del-cat').forEach(btn => {
    btn.onclick = () => {
      data.leagueRules.bonus.splice(+btn.dataset.ci, 1);
      renderBonusEditor();
    };
  });
  list.querySelectorAll('.bonus-del-row').forEach(btn => {
    btn.onclick = () => {
      data.leagueRules.bonus[+btn.dataset.ci]?.rows?.splice(+btn.dataset.ri, 1);
      renderBonusEditor();
    };
  });
  list.querySelectorAll('.bonus-add-row').forEach(btn => {
    btn.onclick = () => {
      const cat = data.leagueRules.bonus[+btn.dataset.ci];
      if (!cat.rows) cat.rows = [];
      cat.rows.push({ label: 'New bonus', pts: 1 });
      renderBonusEditor();
    };
  });
}

function typeBadge(type) {
  if (type === 'PPV/PLE') return 'bg-red-900/60 text-red-300';
  if (type === 'Special TV') return 'bg-purple-900/60 text-purple-300';
  if (type === 'Foreign Object') return 'bg-amber-900/60 text-amber-300';
  if (type === 'Draft') return 'bg-emerald-900/60 text-emerald-300';
  if (type === 'Other') return 'bg-gray-700 text-gray-300';
  return 'bg-blue-900/60 text-blue-300';
}

function renderSeasonBanner() {
  const el = document.getElementById('season-banner');
  if (!el) return;
  const s = data.season || defaultSeason();
  el.innerHTML = `
    <div class="bg-aew-card rounded-xl border border-gray-800 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1">
      <div><span class="text-gray-500">Season:</span> <strong>${formatSeasonDate(s.start)}</strong> → <strong>${formatSeasonDate(s.end)}</strong></div>
      <div class="text-gray-500 text-xs self-center">6-month season · then redraft</div>
    </div>`;
}

function renderCalendarView() {
  const el = document.getElementById('calendar-view');
  if (!el) return;
  renderSeasonBanner();
  const events = data.calendar || [];
  if (!events.length) {
    el.innerHTML = '<p class="text-gray-500 text-sm py-8 text-center">No events yet. Commissioner can add them under Commissioner tools.</p>';
    return;
  }
  const weekly = events.filter(e => e.howOften === 'Weekly' || e.type === 'Weekly TV');
  const dated = events.filter(e => e.date).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const other = events.filter(e => e.howOften !== 'Weekly' && e.type !== 'Weekly TV' && !e.date);

  let html = '';
  if (weekly.length) {
    html += `<div class="mb-6"><h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Weekly shows</h3>
      <div class="space-y-2">${weekly.map(eventCard).join('')}</div></div>`;
  }
  if (dated.length) {
    html += `<div class="mb-6"><h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Upcoming / dated</h3>
      <div class="space-y-2">${dated.map(eventCard).join('')}</div></div>`;
  }
  if (other.length) {
    html += `<div class="mb-6"><h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Other</h3>
      <div class="space-y-2">${other.map(eventCard).join('')}</div></div>`;
  }
  el.innerHTML = html || '<p class="text-gray-500 text-sm py-4 text-center">No events to show.</p>';
}

function eventCard(s) {
  const when = s.howOften === 'Weekly' && s.day
    ? `Every ${escapeHtml(s.day)}`
    : (s.date ? formatSeasonDate(s.date) : escapeHtml(s.howOften || ''));
  return `
    <div class="bg-aew-card rounded-xl border border-gray-800 p-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <div class="font-bold text-lg">${escapeHtml(s.name)}</div>
        <div class="text-sm text-gray-400 mt-0.5">${when}</div>
        ${s.notes ? `<div class="text-xs text-gray-500 mt-1">${escapeHtml(s.notes)}</div>` : ''}
      </div>
      <span class="text-xs px-2 py-1 rounded ${typeBadge(s.type)}">${escapeHtml(s.type)}</span>
    </div>`;
}

function renderSeasonForm() {
  const s = data.season || defaultSeason();
  const startEl = document.getElementById('season-start');
  const endEl = document.getElementById('season-end');
  if (startEl) startEl.value = s.start || '';
  if (endEl) endEl.value = s.end || '';
}

function renderCalendarEditor() {
  const el = document.getElementById('calendar-editor-list');
  if (!el) return;
  const events = data.calendar || [];
  el.innerHTML = events.map((s, i) => `
    <div class="bg-black/40 rounded-lg p-3 border border-gray-800 space-y-2" data-i="${i}">
      <div class="flex flex-wrap items-center gap-2">
        <input type="text" class="cal-name flex-1 min-w-[10rem] bg-black border border-gray-700 rounded px-2 py-1.5 text-sm font-semibold" value="${escapeHtml(s.name)}" placeholder="Event name (e.g. Dynamite, All In, FO Night)" />
        <button type="button" class="cal-del text-red-400 text-xs hover:text-red-300 px-1" data-i="${i}">✕</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label class="block text-[10px] text-gray-500 mb-0.5">Type</label>
          <select class="cal-type w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-sm">
            ${EVENT_TYPES.map(t => `<option value="${t}" ${s.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-[10px] text-gray-500 mb-0.5">How often</label>
          <select class="cal-often w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-sm">
            ${HOW_OFTEN.map(t => `<option value="${t}" ${s.howOften === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-[10px] text-gray-500 mb-0.5">Day (if weekly)</label>
          <select class="cal-day w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-sm">
            <option value="">—</option>
            ${DAYS.map(d => `<option value="${d}" ${s.day === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-[10px] text-gray-500 mb-0.5">Date (one-time / next)</label>
          <input type="date" class="cal-date w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-sm" value="${escapeHtml(s.date || '')}" />
        </div>
      </div>
      <input type="text" class="cal-notes w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300" value="${escapeHtml(s.notes || '')}" placeholder="Notes (optional)" />
    </div>
  `).join('') || '<p class="text-gray-500 text-sm">No events yet. Click + Add event.</p>';
  el.querySelectorAll('.cal-del').forEach(btn => {
    btn.onclick = () => {
      data.calendar.splice(+btn.dataset.i, 1);
      renderCalendarEditor();
    };
  });
}

function renderCommissioner() {
  renderLeagueSetupForm();
  renderPoolEditor();
  renderTeamsInvite();
  renderDraftSetupForm();
  renderSeasonForm();
  renderCalendarEditor();
  renderScoringEditor();
  renderTradeRulesEditor();
  renderBonusEditor();
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
  const nameEl = document.getElementById('wheel-name');
  if (enabledEl) enabledEl.checked = !!data.wheelEnabled;
  if (nameEl) nameEl.value = data.wheelName || 'The Wheel of Boom';
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
  const fos = data.foreignObjects || DEFAULT_FOREIGN_OBJECTS;
  list.innerHTML = fos.map((fo, i) => `
    <div class="bg-black/40 rounded-lg p-3 border border-gray-800 space-y-2" data-i="${i}">
      <div class="flex items-center gap-2">
        <input type="text" class="fo-name flex-1 bg-black border border-gray-700 rounded px-2 py-1.5 text-sm font-semibold" value="${escapeHtml(fo.name)}" placeholder="Foreign Object name" />
        <button type="button" class="fo-del text-red-400 text-xs hover:text-red-300 px-1" data-i="${i}">✕</button>
      </div>
      <textarea class="fo-desc w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 min-h-[4rem]" placeholder="Description">${escapeHtml(fo.desc)}</textarea>
    </div>`).join('');
  list.querySelectorAll('.fo-del').forEach(btn => {
    btn.onclick = () => {
      data.foreignObjects.splice(+btn.dataset.i, 1);
      renderForeignObjects();
    };
  });
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

function enterApp(preferredTab) {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  const u = data.users[currentUser];
  document.getElementById('user-badge').textContent = u.name + (u.isCommissioner ? ' · Commish' : '');
  document.getElementById('commish-nav').classList.toggle('hidden', !u.isCommissioner);
  // Only show commissioner tab if they are commish
  const tab = preferredTab || activeTab || 'standings';
  const safeTab = (tab === 'commissioner' && !u.isCommissioner) ? 'standings' : tab;
  showTab(safeTab);
}


// ---------- Demo draft ----------
const DRAFT_KEY = 'wf_demo_draft';

function defaultDraftConfig() {
  return {
    type: 'snake',           // snake | auction
    scheduledAt: '',
    salaryCap: 200,
    minBid: 1,
    status: 'setup',         // setup | active | complete
    order: ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot'],
    currentPick: 0,
    picks: [],
    budgets: {},             // pin -> remaining $
    nomination: null,        // { wrestler, highBid, highBidder, nominator }
    nominatorIndex: 0
  };
}

let demoDraft = defaultDraftConfig();

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      return { ...defaultDraftConfig(), ...obj };
    }
  } catch (e) {}
  return defaultDraftConfig();
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(demoDraft));
}

function getDraftAvailable() {
  const taken = new Set(demoDraft.picks.map(p => p.wrestler.toLowerCase()));
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

function initAuctionBudgets() {
  const cap = +demoDraft.salaryCap || 200;
  demoDraft.budgets = {};
  (demoDraft.order || []).forEach(pin => { demoDraft.budgets[pin] = cap; });
}

function formatDraftWhen() {
  if (!demoDraft.scheduledAt) return 'Not scheduled';
  try {
    const d = new Date(demoDraft.scheduledAt);
    if (isNaN(d.getTime())) return demoDraft.scheduledAt;
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) {
    return demoDraft.scheduledAt;
  }
}

function renderDraftSetupForm() {
  const typeEl = document.getElementById('draft-type');
  const dtEl = document.getElementById('draft-datetime');
  const capEl = document.getElementById('draft-salary-cap');
  const minEl = document.getElementById('draft-min-bid');
  const auctionBox = document.getElementById('draft-auction-settings');
  if (typeEl) typeEl.value = demoDraft.type || 'snake';
  if (dtEl) dtEl.value = demoDraft.scheduledAt || '';
  if (capEl) capEl.value = demoDraft.salaryCap || 200;
  if (minEl) minEl.value = demoDraft.minBid || 1;
  if (auctionBox) auctionBox.classList.toggle('hidden', (demoDraft.type || 'snake') !== 'auction');
}

function renderDraftBudgets() {
  const el = document.getElementById('draft-budgets');
  if (!el) return;
  if (demoDraft.type !== 'auction' || demoDraft.status === 'setup') {
    el.classList.add('hidden');
    el.innerHTML = '';
    return;
  }
  el.classList.remove('hidden');
  const order = demoDraft.order || [];
  el.innerHTML = `
    <div class="bg-aew-card rounded-xl border border-gray-800 p-3">
      <div class="text-xs text-gray-500 mb-2">Remaining budget (cap $${demoDraft.salaryCap})</div>
      <div class="flex flex-wrap gap-2">
        ${order.map(pin => {
          const left = demoDraft.budgets?.[pin] ?? demoDraft.salaryCap;
          return `<span class="text-xs px-2 py-1 rounded bg-black/50 border border-gray-800">
            ${escapeHtml(data.users[pin]?.name || pin)}: <strong class="text-aew-gold">$${left}</strong>
          </span>`;
        }).join('')}
      </div>
    </div>`;
}

function renderDraft() {
  const statusEl = document.getElementById('draft-status-bar');
  const pickArea = document.getElementById('draft-pick-area');
  const boardEl = document.getElementById('draft-board');
  if (!statusEl || !pickArea) return;

  const order = demoDraft.order || [];
  const isCommish = data.users[currentUser]?.isCommissioner;
  const typeLabel = demoDraft.type === 'auction' ? 'Auction' : 'Snake';
  const statusClass = demoDraft.status === 'active' ? 'bg-emerald-900 text-emerald-300'
    : demoDraft.status === 'complete' ? 'bg-gray-700 text-gray-300'
    : 'bg-yellow-900/60 text-yellow-300';

  statusEl.innerHTML = `
    <div class="flex flex-wrap justify-between gap-2">
      <div>
        <span class="font-bold">${typeLabel} Draft</span>
        <span class="ml-2 text-xs px-2 py-0.5 rounded ${statusClass}">${demoDraft.status}</span>
      </div>
      <div class="text-gray-400">${formatDraftWhen()}</div>
    </div>
    <div class="text-xs text-gray-500 mt-1">
      ${demoDraft.type === 'auction'
        ? `Salary cap $${demoDraft.salaryCap} · Min bid $${demoDraft.minBid}`
        : `Order: ${order.map(p => data.users[p]?.name || p).join(' → ')}`}
      ${demoDraft.status === 'active' && demoDraft.type === 'snake' ? ` · Pick ${demoDraft.currentPick + 1}` : ''}
    </div>
  `;

  renderDraftBudgets();

  if (demoDraft.status === 'setup') {
    pickArea.innerHTML = `
      <div class="text-center py-8 text-gray-400">
        <p class="mb-1">Draft not started yet.</p>
        <p class="text-sm">${demoDraft.scheduledAt ? 'Scheduled: ' + formatDraftWhen() : 'Commissioner has not set a date/time.'}</p>
        <p class="text-xs mt-3 text-gray-500">Commissioner: open Commissioner tab → Draft Setup → Start Draft</p>
      </div>`;
  } else if (demoDraft.status === 'complete') {
    pickArea.innerHTML = '<div class="text-center text-emerald-400 py-4">Draft complete</div>';
  } else if (demoDraft.type === 'auction') {
    renderAuctionPickArea(pickArea, isCommish);
  } else {
    renderSnakePickArea(pickArea, isCommish);
  }

  if (boardEl) {
    if (!demoDraft.picks.length) {
      boardEl.innerHTML = '<p class="text-gray-500">No picks yet</p>';
    } else {
      boardEl.innerHTML = demoDraft.picks.slice().reverse().map(p => `
        <div class="flex gap-3 items-center bg-black/40 rounded-lg px-3 py-2">
          <span class="text-gray-500 w-8">#${p.pick_number}</span>
          <span class="font-medium w-24 truncate">${data.users[p.pin]?.name || p.pin}</span>
          ${portraitHtml(p.wrestler, 'h-12 w-12')}
          <span class="truncate flex-1">${escapeHtml(p.wrestler)}</span>
          ${p.amount != null ? `<span class="text-aew-gold font-mono text-sm">$${p.amount}</span>` : ''}
        </div>
      `).join('');
    }
  }
}

function renderSnakePickArea(pickArea, isCommish) {
  const order = demoDraft.order || [];
  const pin = snakePin(order, demoDraft.currentPick);
  const onClock = data.users[pin]?.name || pin;
  const isMyTurn = pin === currentUser;
  const available = getDraftAvailable();

  pickArea.innerHTML = `
    <div class="text-center mb-4">
      <div class="text-sm text-gray-400">On the clock</div>
      <div class="text-2xl font-bold ${isMyTurn ? 'text-aew-gold' : ''}">${escapeHtml(onClock)}${isMyTurn ? ' (you)' : ''}</div>
    </div>
    ${(isMyTurn || isCommish) ? `
      <div class="max-h-96 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${available.slice(0, 80).map(w => `
          <button class="draft-pick-btn text-left px-2 py-2 rounded bg-black/50 hover:bg-gray-800 border border-gray-800 flex items-center gap-2" data-name="${escapeHtml(w)}">
            ${portraitHtml(w, 'h-14 w-14')}
            <span class="flex-1 truncate text-sm">${escapeHtml(w)}</span>
            <span class="text-gray-500 font-mono text-xs">${pts(w)}</span>
          </button>
        `).join('')}
      </div>
    ` : `<p class="text-center text-gray-500 text-sm py-6">Waiting for ${escapeHtml(onClock)} to pick...</p>`}
  `;
  pickArea.querySelectorAll('.draft-pick-btn').forEach(btn => {
    btn.onclick = () => {
      const w = btn.dataset.name;
      if (!confirm('Draft ' + w + '?')) return;
      makeSnakePick(pin, w);
    };
  });
}

function makeSnakePick(pin, wrestler) {
  demoDraft.picks.push({
    pick_number: demoDraft.picks.length + 1,
    pin,
    wrestler,
    amount: null
  });
  const u = data.users[pin];
  if (u && (u.roster || []).length < (u.maxRoster || 8) && !(u.roster || []).includes(wrestler)) {
    u.roster = [...(u.roster || []), wrestler];
  }
  demoDraft.currentPick++;
  if (demoDraft.currentPick >= (demoDraft.order || []).length * 8) demoDraft.status = 'complete';
  saveDraft();
  renderDraft();
  renderStandings();
}

function renderAuctionPickArea(pickArea, isCommish) {
  const order = demoDraft.order || [];
  const nom = demoDraft.nomination;
  const available = getDraftAvailable();
  const myBudget = demoDraft.budgets?.[currentUser] ?? 0;
  const canAct = isCommish || order.includes(currentUser);

  if (!nom) {
    // Nomination phase
    const nomPin = order[demoDraft.nominatorIndex % order.length];
    const nomName = data.users[nomPin]?.name || nomPin;
    const isNominator = nomPin === currentUser || isCommish;
    pickArea.innerHTML = `
      <div class="text-center mb-4">
        <div class="text-sm text-gray-400">Nomination</div>
        <div class="text-xl font-bold">${escapeHtml(nomName)} nominates</div>
        <div class="text-xs text-gray-500 mt-1">Min bid $${demoDraft.minBid} · Your budget: $${demoDraft.budgets?.[currentUser] ?? '—'}</div>
      </div>
      ${isNominator ? `
        <div class="max-h-80 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${available.slice(0, 60).map(w => `
            <button class="auction-nom-btn text-left px-2 py-2 rounded bg-black/50 hover:bg-gray-800 border border-gray-800 flex items-center gap-2" data-name="${escapeHtml(w)}">
              ${portraitHtml(w, 'h-14 w-14')}
              <span class="flex-1 truncate text-sm">${escapeHtml(w)}</span>
              <span class="text-gray-500 font-mono text-xs">${pts(w)}</span>
            </button>
          `).join('')}
        </div>
      ` : `<p class="text-center text-gray-500 text-sm py-6">Waiting for ${escapeHtml(nomName)} to nominate...</p>`}
    `;
    pickArea.querySelectorAll('.auction-nom-btn').forEach(btn => {
      btn.onclick = () => {
        const w = btn.dataset.name;
        const min = +demoDraft.minBid || 1;
        demoDraft.nomination = {
          wrestler: w,
          highBid: min,
          highBidder: nomPin,
          nominator: nomPin
        };
        saveDraft();
        renderDraft();
      };
    });
    return;
  }

  // Bidding phase
  const highName = data.users[nom.highBidder]?.name || nom.highBidder;
  pickArea.innerHTML = `
    <div class="text-center mb-4">
      <div class="text-sm text-gray-400">Bidding on</div>
      <div class="flex items-center justify-center gap-3 mb-2">
        ${portraitHtml(nom.wrestler, 'h-16 w-16')}
        <div class="text-2xl font-bold">${escapeHtml(nom.wrestler)}</div>
      </div>
      <div class="text-lg">High bid: <span class="text-aew-gold font-black">$${nom.highBid}</span> — ${escapeHtml(highName)}</div>
      <div class="text-xs text-gray-500 mt-1">Your budget: $${myBudget}</div>
    </div>
    ${canAct ? `
      <div class="flex flex-wrap items-end justify-center gap-2 mb-3">
        <div>
          <label class="block text-[10px] text-gray-500 mb-0.5">Your bid ($)</label>
          <input type="number" id="auction-bid-input" min="${nom.highBid + 1}" value="${nom.highBid + 1}" class="w-28 bg-black border border-gray-700 rounded px-2 py-1.5 text-sm" />
        </div>
        <button id="auction-bid-btn" class="bg-aew-gold text-black font-bold px-4 py-1.5 rounded-lg text-sm">Place Bid</button>
        <button id="auction-award-btn" class="bg-emerald-700 hover:bg-emerald-600 px-4 py-1.5 rounded-lg text-sm font-medium">Award to high bidder</button>
      </div>
      <p class="text-center text-[11px] text-gray-500">Commish or any owner can place a bid. Award ends the auction for this wrestler.</p>
    ` : `<p class="text-center text-gray-500 text-sm py-4">Bidding in progress...</p>`}
  `;

  document.getElementById('auction-bid-btn')?.addEventListener('click', () => {
    const input = document.getElementById('auction-bid-input');
    const bid = Math.floor(+input?.value || 0);
    const bidder = isCommish && !order.includes(currentUser) ? nom.highBidder : currentUser;
    if (!order.includes(bidder) && !isCommish) return;
    const budget = demoDraft.budgets?.[bidder] ?? 0;
    if (bid <= nom.highBid) {
      alert('Bid must be higher than $' + nom.highBid);
      return;
    }
    if (bid > budget) {
      alert('Bid exceeds remaining budget ($' + budget + ')');
      return;
    }
    demoDraft.nomination.highBid = bid;
    demoDraft.nomination.highBidder = bidder;
    saveDraft();
    renderDraft();
  });

  document.getElementById('auction-award-btn')?.addEventListener('click', () => {
    if (!isCommish && currentUser !== nom.highBidder && currentUser !== nom.nominator) {
      // allow any participant for demo simplicity, or restrict — allow for demo
    }
    awardAuctionNomination();
  });
}

function awardAuctionNomination() {
  const nom = demoDraft.nomination;
  if (!nom) return;
  const pin = nom.highBidder;
  const amount = nom.highBid;
  const budget = demoDraft.budgets?.[pin] ?? 0;
  if (amount > budget) {
    alert('High bidder cannot afford $' + amount);
    return;
  }
  demoDraft.budgets[pin] = budget - amount;
  demoDraft.picks.push({
    pick_number: demoDraft.picks.length + 1,
    pin,
    wrestler: nom.wrestler,
    amount
  });
  const u = data.users[pin];
  if (u && (u.roster || []).length < (u.maxRoster || 8) && !(u.roster || []).includes(nom.wrestler)) {
    u.roster = [...(u.roster || []), nom.wrestler];
  }
  demoDraft.nomination = null;
  demoDraft.nominatorIndex = (demoDraft.nominatorIndex + 1) % (demoDraft.order || [1]).length;

  // End when all teams full or pool empty
  const order = demoDraft.order || [];
  const allFull = order.every(p => (data.users[p]?.roster || []).length >= (data.users[p]?.maxRoster || 8));
  if (allFull || getDraftAvailable().length === 0) demoDraft.status = 'complete';

  saveDraft();
  renderDraft();
  renderStandings();
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
  data.calendar = loadCalendar();
  data.season = loadSeason();
  data.leagueRules = loadLeagueRules();
  demoDraft = loadDraft();
  const wcfg = loadWheelConfig();
  data.wheelEnabled = wcfg.enabled;
  data.wheelName = wcfg.name || 'The Wheel of Boom';
  data.wheel = wcfg.segments;
  data.coinFlipEnabled = wcfg.coinFlipEnabled !== false;
  data.foEnabled = wcfg.foEnabled !== false;
  data.foreignObjects = wcfg.foreignObjects || DEFAULT_FOREIGN_OBJECTS.map(f => ({ ...f }));

  // Restore last session so refresh stays on the same view
  const session = loadSession();
  if (session) {
    currentUser = session.pin;
    activeTab = session.tab || 'standings';
    enterApp(activeTab);
  }

  document.getElementById('login-btn').onclick = () => {
    const res = login(document.getElementById('pin-input').value);
    if (res.ok) enterApp(activeTab);
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
    activeTab = 'standings';
    localStorage.removeItem(SESSION_KEY);
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
    saveWheelConfig(currentWheelConfig());
    renderWheelEditor();
  });
  document.getElementById('wheel-name')?.addEventListener('change', (e) => {
    data.wheelName = (e.target.value || '').trim() || 'The Wheel of Boom';
    saveWheelConfig(currentWheelConfig());
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
    const nameEl = document.getElementById('wheel-name');
    if (nameEl) data.wheelName = (nameEl.value || '').trim() || 'The Wheel of Boom';
    data.wheel = segs;
    saveWheelConfig(currentWheelConfig());
    drawWheel();
    const msg = document.getElementById('wheel-editor-msg');
    if (msg) { msg.textContent = 'Wheel saved'; msg.className = 'text-sm mt-2 text-emerald-400'; }
  });

  // Coin Flip
  document.getElementById('coinflip-enabled')?.addEventListener('change', (e) => {
    data.coinFlipEnabled = e.target.checked;
    saveWheelConfig(currentWheelConfig());
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

  // Draft setup
  document.getElementById('draft-type')?.addEventListener('change', (e) => {
    const box = document.getElementById('draft-auction-settings');
    if (box) box.classList.toggle('hidden', e.target.value !== 'auction');
  });
  document.getElementById('draft-save-setup')?.addEventListener('click', () => {
    demoDraft.type = document.getElementById('draft-type')?.value || 'snake';
    demoDraft.scheduledAt = document.getElementById('draft-datetime')?.value || '';
    demoDraft.salaryCap = Math.max(1, +document.getElementById('draft-salary-cap')?.value || 200);
    demoDraft.minBid = Math.max(1, +document.getElementById('draft-min-bid')?.value || 1);
    saveDraft();
    const msg = document.getElementById('draft-setup-msg');
    if (msg) {
      msg.textContent = `Saved: ${demoDraft.type === 'auction' ? 'Auction' : 'Snake'}${demoDraft.scheduledAt ? ' · ' + formatDraftWhen() : ''}`;
      msg.className = 'text-sm mt-2 text-emerald-400';
    }
    if (activeTab === 'draft') renderDraft();
  });
  document.getElementById('draft-start')?.addEventListener('click', () => {
    demoDraft.type = document.getElementById('draft-type')?.value || demoDraft.type || 'snake';
    demoDraft.scheduledAt = document.getElementById('draft-datetime')?.value || demoDraft.scheduledAt;
    demoDraft.salaryCap = Math.max(1, +document.getElementById('draft-salary-cap')?.value || demoDraft.salaryCap || 200);
    demoDraft.minBid = Math.max(1, +document.getElementById('draft-min-bid')?.value || demoDraft.minBid || 1);
    demoDraft.status = 'active';
    demoDraft.currentPick = 0;
    demoDraft.picks = [];
    demoDraft.nomination = null;
    demoDraft.nominatorIndex = 0;
    if (demoDraft.type === 'auction') initAuctionBudgets();
    else demoDraft.budgets = {};
    saveDraft();
    const msg = document.getElementById('draft-setup-msg');
    if (msg) {
      msg.textContent = (demoDraft.type === 'auction' ? 'Auction' : 'Snake') + ' draft started';
      msg.className = 'text-sm mt-2 text-emerald-400';
    }
    if (activeTab === 'draft') renderDraft();
  });
  document.getElementById('draft-reset')?.addEventListener('click', () => {
    if (!confirm('Reset draft? All picks will be cleared.')) return;
    const keepType = demoDraft.type;
    const keepWhen = demoDraft.scheduledAt;
    const keepCap = demoDraft.salaryCap;
    const keepMin = demoDraft.minBid;
    demoDraft = defaultDraftConfig();
    demoDraft.type = keepType;
    demoDraft.scheduledAt = keepWhen;
    demoDraft.salaryCap = keepCap;
    demoDraft.minBid = keepMin;
    demoDraft.status = 'setup';
    saveDraft();
    renderDraftSetupForm();
    const msg = document.getElementById('draft-setup-msg');
    if (msg) {
      msg.textContent = 'Draft reset to setup';
      msg.className = 'text-sm mt-2 text-emerald-400';
    }
    if (activeTab === 'draft') renderDraft();
  });

  // Season
  document.getElementById('season-save')?.addEventListener('click', () => {
    let start = document.getElementById('season-start')?.value || '';
    let end = document.getElementById('season-end')?.value || '';
    if (start && !end) end = addSixMonths(start);
    if (!start) {
      const d = defaultSeason();
      start = d.start;
      end = d.end;
    }
    saveSeason({ start, end });
    renderSeasonForm();
    const msg = document.getElementById('season-msg');
    if (msg) {
      msg.textContent = `Season: ${formatSeasonDate(start)} → ${formatSeasonDate(end)} (then redraft)`;
      msg.className = 'text-sm mt-2 text-emerald-400';
    }
    if (activeTab === 'calendar') renderCalendarView();
  });
  document.getElementById('season-start')?.addEventListener('change', (e) => {
    const endEl = document.getElementById('season-end');
    if (endEl && e.target.value && !endEl.value) {
      endEl.value = addSixMonths(e.target.value);
    }
  });

  // Calendar editor
  document.getElementById('calendar-add')?.addEventListener('click', () => {
    data.calendar = data.calendar || [];
    data.calendar.push({ name: 'New event', type: 'Weekly TV', howOften: 'Weekly', day: 'Wednesday', date: '', notes: '' });
    renderCalendarEditor();
  });
  document.getElementById('calendar-reset')?.addEventListener('click', () => {
    data.calendar = DEFAULT_CALENDAR.map(s => ({ ...s }));
    saveCalendar(data.calendar);
    renderCalendarEditor();
    if (activeTab === 'calendar') renderCalendarView();
    const msg = document.getElementById('calendar-msg');
    if (msg) {
      msg.textContent = 'Reset to sample shows (Dynamite, Collision, Raw, SmackDown)';
      msg.className = 'text-sm mt-2 text-emerald-400';
    }
  });
  document.getElementById('calendar-save')?.addEventListener('click', () => {
    const list = document.getElementById('calendar-editor-list');
    if (!list) return;
    const events = [];
    list.querySelectorAll('[data-i]').forEach(row => {
      const name = row.querySelector('.cal-name')?.value?.trim() || '';
      if (!name) return;
      events.push({
        name,
        type: row.querySelector('.cal-type')?.value || 'Weekly TV',
        howOften: row.querySelector('.cal-often')?.value || 'Weekly',
        day: row.querySelector('.cal-day')?.value || '',
        date: row.querySelector('.cal-date')?.value || '',
        notes: row.querySelector('.cal-notes')?.value?.trim() || ''
      });
    });
    saveCalendar(events);
    const msg = document.getElementById('calendar-msg');
    if (msg) {
      msg.textContent = events.length ? `Saved ${events.length} event(s)` : 'Calendar cleared';
      msg.className = 'text-sm mt-2 text-emerald-400';
    }
    renderCalendarEditor();
    if (activeTab === 'calendar') renderCalendarView();
  });

  // Trade rules
  document.getElementById('trade-rules-save')?.addEventListener('click', () => {
    const rules = data.leagueRules || defaultLeagueRules();
    rules.tradeEnabled = document.getElementById('trade-rules-enabled')?.checked !== false;
    rules.tradeText = document.getElementById('trade-rules-text')?.value || '';
    data.leagueRules = rules;
    saveLeagueRules(rules);
    const msg = document.getElementById('trade-rules-msg');
    if (msg) {
      msg.textContent = 'Trade rules saved';
      msg.className = 'text-sm mt-2 text-emerald-400';
    }
    if (activeTab === 'rules') renderScoring();
  });
  document.getElementById('trade-rules-enabled')?.addEventListener('change', (e) => {
    const rules = data.leagueRules || defaultLeagueRules();
    rules.tradeEnabled = e.target.checked;
    data.leagueRules = rules;
    saveLeagueRules(rules);
  });

  // Bonus points
  document.getElementById('bonus-enabled')?.addEventListener('change', (e) => {
    const rules = data.leagueRules || defaultLeagueRules();
    rules.bonusEnabled = e.target.checked;
    data.leagueRules = rules;
    saveLeagueRules(rules);
  });
  document.getElementById('bonus-add-cat')?.addEventListener('click', () => {
    const rules = data.leagueRules || defaultLeagueRules();
    if (!rules.bonus) rules.bonus = [];
    rules.bonus.push({ title: 'New category', applies: 'applied to player', rows: [{ label: 'New bonus', pts: 1 }] });
    data.leagueRules = rules;
    renderBonusEditor();
  });
  document.getElementById('bonus-reset')?.addEventListener('click', () => {
    data.leagueRules = data.leagueRules || defaultLeagueRules();
    data.leagueRules.bonus = defaultLeagueRules().bonus;
    saveLeagueRules(data.leagueRules);
    renderBonusEditor();
    const msg = document.getElementById('bonus-msg');
    if (msg) {
      msg.textContent = 'Reset to default bonus points';
      msg.className = 'text-sm mt-2 text-emerald-400';
    }
  });
  document.getElementById('bonus-save')?.addEventListener('click', () => {
    const list = document.getElementById('bonus-editor-list');
    if (!list) return;
    const rules = data.leagueRules || defaultLeagueRules();
    rules.bonusEnabled = document.getElementById('bonus-enabled')?.checked !== false;
    const cats = [];
    list.querySelectorAll(':scope > [data-ci]').forEach(block => {
      const title = block.querySelector('.bonus-title')?.value?.trim() || '';
      if (!title) return;
      const applies = block.querySelector('.bonus-applies')?.value?.trim() || '';
      const rows = [];
      block.querySelectorAll('[data-ri]').forEach(row => {
        const label = row.querySelector('.bonus-label')?.value?.trim() || '';
        const pts = +row.querySelector('.bonus-pts')?.value || 0;
        if (label) rows.push({ label, pts });
      });
      cats.push({ title, applies, rows });
    });
    rules.bonus = cats;
    data.leagueRules = rules;
    saveLeagueRules(rules);
    const msg = document.getElementById('bonus-msg');
    if (msg) {
      msg.textContent = 'Bonus points saved';
      msg.className = 'text-sm mt-2 text-emerald-400';
    }
    renderBonusEditor();
    if (activeTab === 'rules') renderScoring();
  });

  // Foreign Objects editor
  document.getElementById('fo-enabled')?.addEventListener('change', (e) => {
    data.foEnabled = e.target.checked;
    saveWheelConfig(currentWheelConfig());
    renderForeignObjects();
  });
  document.getElementById('fo-add')?.addEventListener('click', () => {
    data.foreignObjects = data.foreignObjects || [];
    data.foreignObjects.push({ name: 'New Foreign Object', desc: '' });
    renderForeignObjects();
  });
  document.getElementById('fo-save')?.addEventListener('click', () => {
    const list = document.getElementById('fo-list');
    if (!list) return;
    const fos = [];
    list.querySelectorAll('[data-i]').forEach(row => {
      const name = row.querySelector('.fo-name')?.value?.trim() || '';
      const desc = row.querySelector('.fo-desc')?.value?.trim() || '';
      if (name) fos.push({ name, desc });
    });
    data.foreignObjects = fos;
    saveWheelConfig(currentWheelConfig());
    const msg = document.getElementById('fo-msg');
    if (msg) {
      msg.textContent = fos.length ? 'Foreign Objects saved' : 'List cleared';
      msg.className = 'text-sm mt-2 text-emerald-400';
    }
    renderForeignObjects();
  });
});

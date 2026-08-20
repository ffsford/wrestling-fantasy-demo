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
      name: 'ALPHA', division: 'east', isCommissioner: false, extraRosterSpots: 0, lastDelta: 5,
      roster: ['Apex Rivera', 'Blade Quinn', 'Cobalt King', 'Dagger Voss', 'Echo Marlowe', 'Frost Hale', 'Ghost Navarro', 'Hex Calder']
    },
    bravo: {
      name: 'BRAVO', division: 'east', isCommissioner: false, extraRosterSpots: 0, lastDelta: 0,
      roster: ['Iron Vex', 'Jade Orion', 'Knox Sterling', 'Luna Pryce', 'Maverick Cole', 'Nova Drake', 'Onyx Vale', 'Phoenix Ash']
    },
    charlie: {
      name: 'CHARLIE', division: 'east', isCommissioner: false, extraRosterSpots: 0, lastDelta: 12,
      roster: ['Quill Mercer', 'Raven Cross', 'Storm Kade', 'Titan Brooks', 'Umbra Finn', 'Viper Shaw', 'Wraith Kane', 'Xander Blaze']
    },
    delta: {
      name: 'DELTA', division: 'west', isCommissioner: false, extraRosterSpots: 0, lastDelta: 3,
      roster: ['Yara Sol', 'Zephyr Quinn', 'Atlas Crow', 'Briar Knox', 'Cipher Lane', 'Drift Solace', 'Apex Rivera', 'Nova Drake'].slice(0, 8)
    },
    echo: {
      name: 'ECHO', division: 'west', isCommissioner: false, extraRosterSpots: 1, lastDelta: 0,
      roster: ['Blade Quinn', 'Echo Marlowe', 'Jade Orion', 'Luna Pryce', 'Onyx Vale', 'Raven Cross', 'Titan Brooks', 'Viper Shaw', 'Yara Sol']
    },
    foxtrot: {
      name: 'FOXTROT', division: 'west', isCommissioner: false, extraRosterSpots: 0, lastDelta: 8,
      roster: ['Cobalt King', 'Frost Hale', 'Knox Sterling', 'Maverick Cole', 'Phoenix Ash', 'Storm Kade', 'Umbra Finn', 'Xander Blaze']
    },
    commish: {
      name: 'COMMISH', division: null, isCommissioner: true, extraRosterSpots: 0, lastDelta: null, roster: []
    }
  };
}

const POINTS = {
  alpha: 186, bravo: 172, charlie: 201,
  delta: 194, echo: 168, foxtrot: 155
};

const SCORES_KEY = 'wf_demo_scores';

function loadScores() {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return null;
    return obj; // { points: {pin:n}, deltas: {pin:n} }
  } catch (e) {
    return null;
  }
}

function saveScores() {
  const points = { ...data.points };
  const deltas = {};
  Object.entries(data.users).forEach(([pin, u]) => {
    if (typeof u.lastDelta === 'number') deltas[pin] = u.lastDelta;
  });
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify({ points, deltas }));
  } catch (e) {}
}

function applyLoadedScores() {
  const saved = loadScores();
  if (!saved) return;
  if (saved.points && typeof saved.points === 'object') {
    Object.entries(saved.points).forEach(([pin, val]) => {
      if (data.users[pin] != null && typeof val === 'number' && !isNaN(val)) {
        data.points[pin] = val;
      }
    });
  }
  if (saved.deltas && typeof saved.deltas === 'object') {
    Object.entries(saved.deltas).forEach(([pin, val]) => {
      if (data.users[pin] && typeof val === 'number' && !isNaN(val)) {
        data.users[pin].lastDelta = val;
      }
    });
  }
}

/** Atomic score update: collect all filled inputs, apply together, persist once. */
function commitScoreUpdates() {
  const inputs = Array.from(document.querySelectorAll('.score-add-input'));
  // Phase 1: collect only — do not mutate yet
  const batch = [];
  const errors = [];
  inputs.forEach(input => {
    const raw = (input.value || '').trim();
    if (raw === '') return; // leave blank = leave that team untouched
    const pin = input.dataset.pin;
    if (!pin || !data.users[pin]) {
      errors.push('Unknown team');
      return;
    }
    const newTotal = parseInt(raw, 10);
    if (isNaN(newTotal) || newTotal < 0) {
      errors.push(`${data.users[pin].name}: invalid number`);
      return;
    }
    const cur = data.points[pin] || 0;
    batch.push({ pin, name: data.users[pin].name, cur, newTotal, delta: newTotal - cur, input });
  });

  if (errors.length) {
    return { ok: false, message: errors.join('; '), updated: [] };
  }
  if (!batch.length) {
    return { ok: false, message: 'Enter at least one new total (leave others blank to keep them).', updated: [] };
  }

  // Phase 2: apply ALL updates in one pass (East + West together)
  batch.forEach(({ pin, newTotal, delta }) => {
    data.points[pin] = newTotal;
    data.users[pin].lastDelta = delta;
  });

  // Phase 3: persist entire standings snapshot
  saveScores();

  // Phase 4: clear only the inputs we successfully applied
  batch.forEach(({ input }) => { input.value = ''; });

  return {
    ok: true,
    message: `Updated ${batch.length} team(s): ` + batch.map(b => `${b.name} ${b.cur}→${b.newTotal} (${b.delta >= 0 ? '+' : ''}${b.delta})`).join(', '),
    updated: batch
  };
}

const DEFAULT_CALENDAR = [
  { name: 'AEW Dynamite', type: 'Weekly TV', date: '', notes: '' },
  { name: 'AEW Collision', type: 'Weekly TV', date: '', notes: '' },
  { name: 'WWE Raw', type: 'Weekly TV', date: '', notes: '' },
  { name: 'WWE SmackDown', type: 'Weekly TV', date: '', notes: '' }
];
// Name + Date + Type only (no day-of-week / how-often)
const EVENT_TYPES = ['Weekly TV', 'Special', 'PPV', 'PLE', 'Foreign Object', 'Draft', 'Other'];

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
    baseRosterSize: 8, // 8–20
    leagueLogo: null, // data URL
    teamLogos: {}, // pin -> data URL
    teamNames: {}  // pin -> display name
  };
}

function getBaseRosterSize() {
  const n = parseInt(data.branding?.baseRosterSize, 10);
  if (isNaN(n)) return 8;
  return Math.min(20, Math.max(8, n));
}

/** Effective max roster: league base + FO extra spots */
function getTeamMaxRoster(pinOrUser) {
  const u = typeof pinOrUser === 'string' ? data.users[pinOrUser] : pinOrUser;
  if (!u) return getBaseRosterSize();
  const extra = Math.max(0, parseInt(u.extraRosterSpots, 10) || 0);
  return getBaseRosterSize() + extra;
}


// ---------- Purge ----------
const PURGE_KEY = 'wf_demo_purge';
let purgeConfig = { enabled: false, nextAt: '', history: [], lastExecutedFor: '' };
let purgeAutoTimer = null;

function loadPurge() {
  try {
    const raw = localStorage.getItem(PURGE_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      purgeConfig = {
        enabled: !!obj.enabled,
        nextAt: obj.nextAt || '',
        history: Array.isArray(obj.history) ? obj.history : [],
        lastExecutedFor: obj.lastExecutedFor || ''
      };
      // Restore purged flags on users
      if (obj.purgedPins && typeof obj.purgedPins === 'object') {
        Object.entries(obj.purgedPins).forEach(([pin, val]) => {
          if (data.users[pin]) data.users[pin].purged = !!val;
        });
      }
    }
  } catch (e) {}
}

function savePurge() {
  const purgedPins = {};
  Object.entries(data.users).forEach(([pin, u]) => {
    if (u.purged) purgedPins[pin] = true;
  });
  localStorage.setItem(PURGE_KEY, JSON.stringify({
    enabled: purgeConfig.enabled,
    nextAt: purgeConfig.nextAt,
    history: purgeConfig.history,
    lastExecutedFor: purgeConfig.lastExecutedFor || '',
    purgedPins
  }));
}

function isPurged(pin) {
  return !!data.users[pin]?.purged;
}

/** Run the Purge: lowest non-purged team in each division is eliminated; roster → free agency */
function runPurge(opts) {
  const options = opts || {};
  if (!purgeConfig.enabled) return { ok: false, error: 'Enable The Purge first' };
  const results = [];
  ['east', 'west'].forEach(div => {
    const candidates = Object.entries(data.users)
      .filter(([_, u]) => u.division === div && !u.isCommissioner && !u.purged)
      .map(([pin, u]) => ({ pin, name: u.name, points: data.points[pin] || 0, roster: (u.roster || []).slice() }))
      .sort((a, b) => a.points - b.points || a.name.localeCompare(b.name));
    const victim = candidates[0];
    if (!victim) return;
    const u = data.users[victim.pin];
    const released = (u.roster || []).slice();
    u.roster = [];
    u.tradeBlock = [];
    u.purged = true;
    results.push({
      pin: victim.pin,
      name: victim.name,
      div,
      points: victim.points,
      released
    });
  });
  if (!results.length) return { ok: false, error: 'No teams left to purge' };
  purgeConfig.history.unshift({
    at: new Date().toISOString(),
    auto: !!options.auto,
    scheduledFor: options.scheduledFor || purgeConfig.nextAt || null,
    results: results.map(r => ({ pin: r.pin, name: r.name, div: r.div, released: r.released }))
  });
  purgeConfig.history = purgeConfig.history.slice(0, 10);
  if (options.scheduledFor) {
    purgeConfig.lastExecutedFor = options.scheduledFor;
  } else if (purgeConfig.nextAt) {
    // Manual run still marks current schedule as consumed so auto doesn't double-fire
    purgeConfig.lastExecutedFor = purgeConfig.nextAt;
  }
  savePurge();
  saveTradeBlocks();
  return { ok: true, results };
}

/**
 * Auto-run when enabled and the scheduled nextAt is in the past,
 * and we have not already executed for that exact schedule stamp.
 */
function checkAndAutoPurge() {
  if (!purgeConfig.enabled || !purgeConfig.nextAt) return null;
  if (purgeConfig.lastExecutedFor && purgeConfig.lastExecutedFor === purgeConfig.nextAt) return null;
  const when = new Date(purgeConfig.nextAt);
  if (isNaN(when.getTime())) return null;
  if (Date.now() < when.getTime()) return null;

  const r = runPurge({ auto: true, scheduledFor: purgeConfig.nextAt });
  if (!r.ok) return r;

  // Refresh visible UI if app is open
  try {
    renderPurgeEditor();
    if (typeof renderStandings === 'function') renderStandings();
    if (typeof renderWaiver === 'function') renderWaiver();
    if (typeof renderLeagueRosters === 'function') renderLeagueRosters();
    if (typeof renderMyTeam === 'function' && activeTab === 'myteam') renderMyTeam();
    const msg = document.getElementById('purge-msg');
    if (msg) {
      const summary = r.results.map(x => x.name).join(', ');
      msg.textContent = 'Purge ran automatically at schedule: ' + summary + ' eliminated. Set a waiver deadline so owners can claim their released rosters.';
      msg.className = 'text-sm text-emerald-400';
    }
  } catch (e) {}
  return r;
}

function startPurgeAutoChecker() {
  if (purgeAutoTimer) clearInterval(purgeAutoTimer);
  checkAndAutoPurge();
  // Check every 30s while the page is open (demo-friendly)
  purgeAutoTimer = setInterval(() => { checkAndAutoPurge(); }, 30000);
}

function renderPurgeEditor() {
  const en = document.getElementById('purge-enabled');
  const body = document.getElementById('purge-module-body');
  const next = document.getElementById('purge-next-at');
  const status = document.getElementById('purge-status');
  if (en) en.checked = !!purgeConfig.enabled;
  if (body) {
    body.classList.toggle('opacity-40', !purgeConfig.enabled);
    body.classList.toggle('pointer-events-none', !purgeConfig.enabled);
  }
  if (next) next.value = purgeConfig.nextAt || '';
  if (status) {
    const purged = Object.entries(data.users).filter(([_, u]) => u.purged);
    const lines = [];
    if (purgeConfig.nextAt) {
      try {
        const d = new Date(purgeConfig.nextAt);
        const done = purgeConfig.lastExecutedFor === purgeConfig.nextAt;
        const past = !isNaN(d.getTime()) && Date.now() >= d.getTime();
        if (done) {
          lines.push('Scheduled ' + d.toLocaleString() + ' — already executed');
        } else if (past) {
          lines.push('Scheduled ' + d.toLocaleString() + ' — due (will run automatically)');
        } else {
          lines.push('Auto-purges at ' + d.toLocaleString());
        }
      } catch (e) {
        lines.push('Scheduled: ' + purgeConfig.nextAt);
      }
    } else {
      lines.push('No auto time set — set date/time to schedule automatic Purge.');
    }
    if (purged.length) {
      lines.push('Currently purged: ' + purged.map(([p, u]) => u.name).join(', '));
    } else {
      lines.push('No teams purged yet.');
    }
    status.textContent = lines.join(' · ');
  }
}

// ---------- Championships / titles ----------
const TITLES_KEY = 'wf_demo_titles';
let leagueTitles = [];

function abbreviateTitle(name) {
  const n = (name || '').trim();
  if (!n) return 'TITLE';
  // If user-provided short name already
  if (n.length <= 5 && !/\s/.test(n)) return n.toUpperCase();
  const words = n.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const skip = new Set(['the', 'of', 'and', 'a', 'an', 'in', 'for', 'to']);
  const significant = words.filter(w => !skip.has(w.toLowerCase()));
  const use = significant.length ? significant : words;
  if (use.length === 1) return use[0].slice(0, 4).toUpperCase();
  return use.map(w => w[0]).join('').toUpperCase().slice(0, 6);
}

function loadTitles() {
  try {
    const raw = localStorage.getItem(TITLES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        leagueTitles = arr.map(t => ({
          id: t.id || ('title_' + Math.random().toString(36).slice(2, 8)),
          name: t.name || '',
          abbrev: t.abbrev || abbreviateTitle(t.name),
          holder: t.holder || ''
        }));
        return;
      }
    }
  } catch (e) {}
  // Sample titles for demo pitch
  leagueTitles = [
    { id: 't_world', name: 'World Championship', abbrev: 'WORLD', holder: '' },
    { id: 't_tn', name: 'TNT Championship', abbrev: 'TNT', holder: '' }
  ];
}

function saveTitles() {
  localStorage.setItem(TITLES_KEY, JSON.stringify(leagueTitles));
}

function titlesForWrestler(name) {
  if (!name) return [];
  const key = name.toLowerCase();
  return leagueTitles.filter(t => t.holder && t.holder.toLowerCase() === key);
}

function titleBadgesHtml(name) {
  const titles = titlesForWrestler(name);
  if (!titles.length) return '';
  return titles.map(t =>
    `<span class="inline-block text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-aew-gold/20 text-aew-gold border border-aew-gold/50 ml-1" title="${escapeHtml(t.name)}">${escapeHtml(t.abbrev || abbreviateTitle(t.name))}</span>`
  ).join('');
}

function allRosteredWrestlerNames() {
  const set = new Set();
  Object.values(data.users).forEach(u => (u.roster || []).forEach(w => set.add(w)));
  (data.masterRoster || []).forEach(w => set.add(w));
  return [...set].sort((a, b) => a.localeCompare(b));
}

function renderTitlesEditor() {
  const el = document.getElementById('titles-editor-list');
  if (!el) return;
  const names = allRosteredWrestlerNames();
  el.innerHTML = leagueTitles.map((t, i) => `
    <div class="bg-black/40 border border-gray-800 rounded-lg p-3 space-y-2" data-i="${i}">
      <div class="flex flex-wrap gap-2 items-center">
        <input type="text" class="title-name flex-1 min-w-[10rem] bg-black border border-gray-700 rounded px-2 py-1.5 text-sm font-semibold" value="${escapeHtml(t.name)}" placeholder="Title name (e.g. World Championship)" />
        <input type="text" class="title-abbrev w-24 bg-black border border-gray-700 rounded px-2 py-1.5 text-sm text-aew-gold font-bold uppercase" value="${escapeHtml(t.abbrev || '')}" placeholder="ABBR" maxlength="8" title="Label abbreviation" />
        <button type="button" class="title-del text-red-400 text-xs px-1" data-i="${i}">✕</button>
      </div>
      <div>
        <label class="block text-[10px] text-gray-500 mb-0.5">Champion (holder)</label>
        <select class="title-holder w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-sm">
          <option value="">— Vacant —</option>
          ${names.map(n => `<option value="${escapeHtml(n)}" ${t.holder === n ? 'selected' : ''}>${escapeHtml(n)}</option>`).join('')}
        </select>
      </div>
    </div>
  `).join('') || '<p class="text-sm text-gray-500">No titles yet. Add one.</p>';

  el.querySelectorAll('.title-del').forEach(btn => {
    btn.onclick = () => {
      leagueTitles.splice(+btn.dataset.i, 1);
      renderTitlesEditor();
    };
  });
  // Live abbrev suggest when name changes
  el.querySelectorAll('.title-name').forEach(inp => {
    inp.addEventListener('change', () => {
      const row = inp.closest('[data-i]');
      const ab = row?.querySelector('.title-abbrev');
      if (ab && !(ab.value || '').trim()) ab.value = abbreviateTitle(inp.value);
    });
  });
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

/** Apply persisted custom team names onto user objects */
function applyTeamNamesFromBranding() {
  const names = data.branding?.teamNames || {};
  Object.entries(names).forEach(([pin, name]) => {
    if (data.users[pin] && name && String(name).trim()) {
      data.users[pin].name = String(name).trim();
    }
  });
}

/**
 * Set a team's display name. Enforces non-empty and league-wide uniqueness (case-insensitive).
 */
function setTeamName(pin, rawName) {
  const u = data.users[pin];
  if (!u || u.isCommissioner) return { ok: false, error: 'Only team owners can set a team name' };
  const name = (rawName || '').trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, error: 'Team name cannot be empty' };
  if (name.length < 2) return { ok: false, error: 'Team name must be at least 2 characters' };
  if (name.length > 32) return { ok: false, error: 'Team name must be 32 characters or fewer' };
  // Block obvious junk
  if (!/^[A-Za-z0-9][A-Za-z0-9 \-_'.]*$/.test(name)) {
    return { ok: false, error: 'Use letters, numbers, spaces, and basic punctuation only' };
  }
  const key = name.toLowerCase();
  const taken = Object.entries(data.users).find(([p, ou]) => {
    if (p === pin || ou.isCommissioner) return false;
    return (ou.name || '').trim().toLowerCase() === key;
  });
  if (taken) {
    return { ok: false, error: 'That team name is already taken. Choose a different name.' };
  }
  u.name = name;
  data.branding = data.branding || defaultBranding();
  data.branding.teamNames = data.branding.teamNames || {};
  data.branding.teamNames[pin] = name;
  saveBranding(data.branding);
  return { ok: true, name };
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

function normalizeEventType(type) {
  const t = (type || '').trim();
  if (!t) return 'Weekly TV';
  // Migrate old labels
  if (t === 'Special TV') return 'Special';
  if (t === 'PPV/PLE') return 'PPV';
  if (EVENT_TYPES.includes(t)) return t;
  return t; // keep custom if any
}

function normalizeCalendarEvent(s) {
  if (!s || typeof s !== 'object') return null;
  const name = (s.name || '').trim();
  if (!name) return null;
  return {
    name,
    type: normalizeEventType(s.type),
    date: (s.date || '').trim(), // YYYY-MM-DD or empty
    notes: (s.notes || '').trim()
  };
}

function loadCalendar() {
  try {
    const raw = localStorage.getItem(CALENDAR_KEY) || localStorage.getItem('wf_demo_schedule');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const cleaned = arr.map(normalizeCalendarEvent).filter(Boolean);
        if (cleaned.length) return cleaned;
      }
    }
  } catch (e) {}
  return DEFAULT_CALENDAR.map(s => ({ ...s }));
}

function saveCalendar(arr) {
  const cleaned = (arr || []).map(normalizeCalendarEvent).filter(Boolean);
  localStorage.setItem(CALENDAR_KEY, JSON.stringify(cleaned));
  // Drop legacy key so old schema doesn't fight us
  try { localStorage.removeItem('wf_demo_schedule'); } catch (e) {}
  data.calendar = cleaned;
  return cleaned;
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
  const rs = document.getElementById('setup-roster-size');
  if (rs) rs.value = String(Math.min(20, Math.max(8, parseInt(b.baseRosterSize, 10) || 8)));

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
  const nameInput = document.getElementById('my-team-name-input');
  if (nameInput && document.activeElement !== nameInput) {
    nameInput.value = u.name || '';
  }
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
  let rosterSize = parseInt(document.getElementById('setup-roster-size')?.value, 10);
  if (isNaN(rosterSize)) rosterSize = 8;
  b.baseRosterSize = Math.min(20, Math.max(8, rosterSize));
  // team logos already on data.branding from file pickers
  b.teamLogos = { ...(data.branding?.teamLogos || {}) };
  saveBranding(b);
  const msg = document.getElementById('setup-msg');
  if (msg) {
    msg.textContent = 'League setup saved · base roster size ' + b.baseRosterSize;
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
  renderPoolManageList();
}

function renderPoolManageList() {
  const el = document.getElementById('pool-manage-list');
  if (!el) return;
  const filter = (document.getElementById('pool-manage-filter')?.value || '').trim().toLowerCase();
  let names = (data.masterRoster || []).slice().sort((a, b) => a.localeCompare(b));
  if (filter) names = names.filter(n => n.toLowerCase().includes(filter));
  if (!names.length) {
    el.innerHTML = '<p class="text-gray-500 text-sm py-2">No wrestlers match.</p>';
    return;
  }
  el.innerHTML = names.map(name => {
    const safe = escapeHtml(name);
    const onTeams = Object.values(data.users).filter(u => (u.roster || []).some(w => w.toLowerCase() === name.toLowerCase())).length;
    return `
      <div class="flex flex-wrap items-center gap-2 bg-black/40 border border-gray-800 rounded-lg px-3 py-2" data-name="${safe}">
        ${portraitHtml(name, 'h-10 w-10')}
        <input type="text" class="pool-rename-input flex-1 min-w-[8rem] bg-black border border-gray-700 rounded px-2 py-1.5 text-sm" value="${safe}" />
        <span class="text-[10px] text-gray-500 w-16">${onTeams ? onTeams + ' team' + (onTeams > 1 ? 's' : '') : 'free'}</span>
        <button type="button" class="pool-rename-btn text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1.5 rounded" data-old="${safe}">Rename</button>
        <button type="button" class="pool-remove-btn text-xs text-red-400 hover:text-red-300 px-2 py-1.5 rounded border border-red-900/50" data-name="${safe}">Remove</button>
      </div>`;
  }).join('');

  el.querySelectorAll('.pool-rename-btn').forEach(btn => {
    btn.onclick = () => {
      const row = btn.closest('[data-name]');
      const oldName = btn.dataset.old;
      const newName = row?.querySelector('.pool-rename-input')?.value?.trim() || '';
      renameWrestler(oldName, newName);
    };
  });
  el.querySelectorAll('.pool-remove-btn').forEach(btn => {
    btn.onclick = () => {
      const name = btn.dataset.name;
      if (!confirm('Remove "' + name + '" from the league pool and all team rosters?')) return;
      removeWrestler(name);
    };
  });
}

function renameWrestler(oldName, newName) {
  const msg = document.getElementById('pool-manage-msg');
  if (!oldName || !newName) {
    if (msg) { msg.textContent = 'Enter a new name'; msg.className = 'text-sm mt-2 text-red-400'; }
    return;
  }
  if (oldName === newName) {
    if (msg) { msg.textContent = 'Name unchanged'; msg.className = 'text-sm mt-2 text-gray-400'; }
    return;
  }
  const pool = data.masterRoster || [];
  const idx = pool.findIndex(n => n.toLowerCase() === oldName.toLowerCase());
  if (idx < 0) {
    if (msg) { msg.textContent = 'Wrestler not found in pool'; msg.className = 'text-sm mt-2 text-red-400'; }
    return;
  }
  if (pool.some((n, i) => i !== idx && n.toLowerCase() === newName.toLowerCase())) {
    if (msg) { msg.textContent = 'That name already exists in the pool'; msg.className = 'text-sm mt-2 text-red-400'; }
    return;
  }

  pool[idx] = newName;
  data.masterRoster = pool;
  savePool(pool);

  // Team rosters
  Object.values(data.users).forEach(u => {
    if (!u.roster) return;
    u.roster = u.roster.map(w => w.toLowerCase() === oldName.toLowerCase() ? newName : w);
  });

  // Points key
  const oldKey = oldName.toLowerCase();
  const newKey = newName.toLowerCase();
  if (data.wrestlerPoints && data.wrestlerPoints[oldKey] != null) {
    data.wrestlerPoints[newKey] = data.wrestlerPoints[oldKey];
    if (oldKey !== newKey) delete data.wrestlerPoints[oldKey];
  }

  // Portraits
  if (data.portraits && data.portraits[oldKey]) {
    data.portraits[newKey] = data.portraits[oldKey];
    if (oldKey !== newKey) delete data.portraits[oldKey];
    try { localStorage.setItem(PORTRAIT_KEY, JSON.stringify(data.portraits)); } catch (e) {}
  }

  // Draft picks
  if (demoDraft?.picks) {
    demoDraft.picks.forEach(p => {
      if (p.wrestler && p.wrestler.toLowerCase() === oldName.toLowerCase()) p.wrestler = newName;
    });
    if (demoDraft.nomination?.wrestler?.toLowerCase() === oldName.toLowerCase()) {
      demoDraft.nomination.wrestler = newName;
    }
    saveDraft();
  }

  if (msg) {
    msg.textContent = `Renamed "${oldName}" → "${newName}"`;
    msg.className = 'text-sm mt-2 text-emerald-400';
  }
  renderPoolEditor();
}

function removeWrestler(name) {
  const msg = document.getElementById('pool-manage-msg');
  const key = name.toLowerCase();
  data.masterRoster = (data.masterRoster || []).filter(n => n.toLowerCase() !== key);
  savePool(data.masterRoster);

  Object.values(data.users).forEach(u => {
    if (!u.roster) return;
    u.roster = u.roster.filter(w => w.toLowerCase() !== key);
    if (u.tradeBlock) u.tradeBlock = u.tradeBlock.filter(w => w.toLowerCase() !== key);
  });
  saveTradeBlocks();

  if (data.wrestlerPoints) delete data.wrestlerPoints[key];
  if (data.portraits && data.portraits[key]) {
    delete data.portraits[key];
    try { localStorage.setItem(PORTRAIT_KEY, JSON.stringify(data.portraits)); } catch (e) {}
  }

  if (demoDraft?.picks) {
    demoDraft.picks = demoDraft.picks.filter(p => p.wrestler?.toLowerCase() !== key);
    if (demoDraft.nomination?.wrestler?.toLowerCase() === key) demoDraft.nomination = null;
    saveDraft();
  }

  if (msg) {
    msg.textContent = `Removed "${name}" from pool and all rosters`;
    msg.className = 'text-sm mt-2 text-emerald-400';
  }
  renderPoolEditor();
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
  if (id === 'transactions') { renderWaiver(); renderTradesPanel(); }
  if (id === 'draft') renderDraft();
  if (id === 'rules') renderScoring();
  if (id === 'commissioner') renderCommissioner();
  saveSession();
}

function renderStandings() {
  const list = (div) => Object.entries(data.users)
    .filter(([_, u]) => u.division === div)
    .map(([pin, u]) => ({
      pin, name: u.name, points: data.points[pin] || 0,
      maxRoster: getTeamMaxRoster(pin), lastDelta: u.lastDelta, purged: !!u.purged
    }))
    .sort((a, b) => {
      // Purged teams sink to the bottom
      if (a.purged !== b.purged) return a.purged ? 1 : -1;
      return b.points - a.points;
    });

  const paint = (arr, elId) => {
    const el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = arr.map((t, i) => {
      let deltaHtml = '';
      if (!t.purged) {
        if (t.lastDelta === 0) deltaHtml = `<span class="text-red-400 text-sm font-semibold ml-2">0</span>`;
        else if (typeof t.lastDelta === 'number' && t.lastDelta > 0) deltaHtml = `<span class="text-emerald-400 text-sm font-semibold ml-2">+${t.lastDelta}</span>`;
      }
      const nameHtml = t.purged
        ? `<span class="font-semibold text-red-400 line-through decoration-red-500 decoration-2">${escapeHtml(t.name)}</span>
           <span class="text-[10px] font-black tracking-wide text-red-500 border border-red-600/80 px-1.5 py-0.5 rounded ml-1">PURGED</span>`
        : `<span class="font-semibold">${escapeHtml(t.name)}${champCrown(t.pin)}</span>`;
      return `<div class="standing-row ${t.pin === currentUser ? 'me' : ''} ${t.purged ? 'opacity-70' : ''}">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-gray-500 w-5 text-right">${t.purged ? '—' : (i + 1 - arr.slice(0, i).filter(x => x.purged).length)}</span>
          ${teamLogoHtml(t.pin)}
          ${nameHtml}
          ${(!t.purged && t.maxRoster > getBaseRosterSize()) ? `<span class="text-xs bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded">${t.maxRoster}</span>` : ''}
        </div>
        <div class="flex items-center"><span class="font-bold text-lg ${t.purged ? 'text-gray-600 line-through' : ''}">${t.points}</span>${deltaHtml}</div>
      </div>`;
    }).join('');
  };
  paint(list('east'), 'east-standings');
  paint(list('west'), 'west-standings');
  renderStandingsFoTile();
}

// ---------- Foreign Object awards (optional bonus path) ----------
const FO_AWARD_KEY = 'wf_demo_fo_awards';

function defaultFoAwardState() {
  return { rounds: [], active: {} }; // active[div] = award object
}

let foAwardState = defaultFoAwardState();

function loadFoAwards() {
  try {
    const raw = localStorage.getItem(FO_AWARD_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      foAwardState = {
        rounds: Array.isArray(obj.rounds) ? obj.rounds : [],
        active: obj.active && typeof obj.active === 'object' ? obj.active : {}
      };
      loadFoInventories(obj.inventories);
      return;
    }
  } catch (e) {}
  foAwardState = defaultFoAwardState();
}

function saveFoAwards() {
  // Also snapshot inventories on users
  const inventories = {};
  Object.entries(data.users).forEach(([pin, u]) => {
    if (u.foInventory?.length) inventories[pin] = u.foInventory;
  });
  localStorage.setItem(FO_AWARD_KEY, JSON.stringify({ ...foAwardState, inventories }));
}

function loadFoInventories(inventories) {
  if (!inventories || typeof inventories !== 'object') return;
  Object.entries(inventories).forEach(([pin, inv]) => {
    if (data.users[pin] && Array.isArray(inv)) data.users[pin].foInventory = inv;
  });
}

function lastPlaceInDivision(div) {
  const teams = Object.entries(data.users)
    .filter(([_, u]) => u.division === div && !u.isCommissioner && !u.purged)
    .map(([pin, u]) => ({ pin, name: u.name, points: data.points[pin] || 0 }))
    .sort((a, b) => a.points - b.points || a.name.localeCompare(b.name));
  return teams[0] || null;
}

function isWheelFo(name) {
  return /wheel/i.test(name || '');
}

function isBankableFo(name) {
  return /can bank/i.test(name || '') || /bank/i.test(name || '');
}

function applyWheelResult(pin, label) {
  const u = data.users[pin];
  if (!u) return { text: 'Team not found' };
  const text = String(label || '');
  // +N points
  const plus = text.match(/\+(\d+)/);
  if (plus) {
    const n = parseInt(plus[1], 10);
    data.points[pin] = (data.points[pin] || 0) + n;
    u.lastDelta = (typeof u.lastDelta === 'number' ? u.lastDelta : 0) + n;
    saveScores();
    return { text: `${u.name} gains +${n} points from the wheel.` };
  }
  // Extra roster spot
  if (/roster\s*spot|extra\s*roster/i.test(text)) {
    u.extraRosterSpots = (parseInt(u.extraRosterSpots, 10) || 0) + 1;
    return { text: `${u.name} gets an extra roster spot (max ${getTeamMaxRoster(u)}).` };
  }
  // Steal 5 from every other player in region
  if (/steal/i.test(text)) {
    const div = u.division;
    let stolen = 0;
    Object.entries(data.users).forEach(([p, ou]) => {
      if (p === pin || ou.division !== div || ou.isCommissioner) return;
      data.points[p] = Math.max(0, (data.points[p] || 0) - 5);
      stolen += 5;
    });
    data.points[pin] = (data.points[pin] || 0) + stolen;
    u.lastDelta = (typeof u.lastDelta === 'number' ? u.lastDelta : 0) + stolen;
    saveScores();
    return { text: `${u.name} steals 5 pts from each other team in the region (+${stolen} total).` };
  }
  return { text: `${u.name} spun: ${text}` };
}

function triggerFoAwards() {
  if (data.foEnabled === false) return { ok: false, error: 'Foreign Objects are disabled' };
  const fos = data.foreignObjects || [];
  if (!fos.length) return { ok: false, error: 'No Foreign Objects configured' };

  const results = [];
  ['east', 'west'].forEach(div => {
    const last = lastPlaceInDivision(div);
    if (!last) return;
    // Don't overwrite an unresolved award
    const cur = foAwardState.active[div];
    if (cur && (cur.status === 'pending_pick' || cur.status === 'pending_wheel')) {
      results.push(`${div}: still waiting on ${data.users[cur.pin]?.name || cur.pin}`);
      return;
    }
    foAwardState.active[div] = {
      id: 'fo_' + Date.now().toString(36) + '_' + div,
      div,
      pin: last.pin,
      pointsAtAward: last.points,
      status: 'pending_pick', // pending_pick | pending_wheel | resolved
      foName: null,
      wheelResult: null,
      createdAt: new Date().toISOString()
    };
    results.push(`${div}: ${last.name} (${last.points} pts) — pick a Foreign Object`);
  });
  saveFoAwards();
  return { ok: true, results };
}

function pickForeignObject(div, foName) {
  const award = foAwardState.active[div];
  if (!award || award.status !== 'pending_pick') return { ok: false, error: 'No FO pick available' };
  if (award.pin !== currentUser && !data.users[currentUser]?.isCommissioner) {
    return { ok: false, error: 'Only the last-place owner (or commish) can pick' };
  }
  const fo = (data.foreignObjects || []).find(f => f.name === foName);
  if (!fo) return { ok: false, error: 'Unknown Foreign Object' };

  award.foName = fo.name;
  award.foDesc = fo.desc || '';

  if (isWheelFo(fo.name)) {
    award.status = 'pending_wheel';
    saveFoAwards();
    return {
      ok: true,
      needsWheel: true,
      message: `${data.users[award.pin]?.name || award.pin} chose ${fo.name}. Commissioner should spin the Wheel of Boom.`
    };
  }

  // Bankable / other FOs — resolve as held inventory
  award.status = 'resolved';
  award.resolvedAt = new Date().toISOString();
  const u = data.users[award.pin];
  if (u) {
    u.foInventory = u.foInventory || [];
    u.foInventory.push({ name: fo.name, desc: fo.desc || '', awardedAt: award.resolvedAt, bankable: isBankableFo(fo.name) });
  }
  foAwardState.rounds.unshift({ ...award });
  saveFoAwards();
  return {
    ok: true,
    needsWheel: false,
    message: `${data.users[award.pin]?.name || award.pin} receives ${fo.name}${isBankableFo(fo.name) ? ' (banked for later)' : ''}.`
  };
}

function resolveFoWheelSpin(div, label) {
  const award = foAwardState.active[div];
  if (!award || award.status !== 'pending_wheel') return { ok: false, error: 'No pending wheel FO for that region' };
  const applied = applyWheelResult(award.pin, label);
  award.wheelResult = label;
  award.status = 'resolved';
  award.resolvedAt = new Date().toISOString();
  award.resultText = applied.text;
  foAwardState.rounds.unshift({ ...award });
  saveFoAwards();
  return { ok: true, message: applied.text };
}

function renderStandingsFoTile() {
  const el = document.getElementById('standings-fo-tile');
  if (!el) return;
  const enabled = data.foEnabled !== false;
  const fos = data.foreignObjects || [];
  if (!enabled || !fos.length) {
    el.classList.add('hidden');
    el.innerHTML = '';
    return;
  }
  el.classList.remove('hidden');

  const isCommish = data.users[currentUser]?.isCommissioner;
  const lastEast = lastPlaceInDivision('east');
  const lastWest = lastPlaceInDivision('west');

  const activeBlocks = ['east', 'west'].map(div => {
    const award = foAwardState.active[div];
    if (!award || award.status === 'resolved') {
      const last = div === 'east' ? lastEast : lastWest;
      return `<div class="bg-black/40 rounded-lg p-3 border border-gray-800 text-sm">
        <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">${div === 'east' ? (data.branding?.divA || 'Division A') : (data.branding?.divB || 'Division B')}</div>
        <div class="text-gray-400">Last place: <strong class="text-gray-200">${last ? escapeHtml(last.name) + ' (' + last.points + ' pts)' : '—'}</strong></div>
        <div class="text-xs text-gray-500 mt-1">No active FO award</div>
      </div>`;
    }
    const ownerName = data.users[award.pin]?.name || award.pin;
    const canPick = award.status === 'pending_pick' && (currentUser === award.pin || isCommish);
    if (award.status === 'pending_pick') {
      return `<div class="bg-black/40 rounded-lg p-3 border border-aew-gold/40 text-sm space-y-2">
        <div class="text-xs text-aew-gold uppercase tracking-wide">${div === 'east' ? (data.branding?.divA || 'Division A') : (data.branding?.divB || 'Division B')} · FO pick</div>
        <div><strong>${escapeHtml(ownerName)}</strong> (last place, ${award.pointsAtAward} pts) chooses a Foreign Object</div>
        ${canPick ? `
          <div class="space-y-1.5 pt-1">
            ${fos.map(fo => `
              <button type="button" class="fo-pick-btn w-full text-left bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg px-3 py-2" data-div="${div}" data-name="${escapeHtml(fo.name)}">
                <div class="font-semibold text-sm">${escapeHtml(fo.name)}</div>
                <div class="text-[11px] text-gray-500 leading-snug">${escapeHtml(fo.desc || '')}</div>
              </button>`).join('')}
          </div>
        ` : `<p class="text-xs text-gray-500">Waiting for ${escapeHtml(ownerName)} to pick…</p>`}
      </div>`;
    }
    // pending_wheel
    return `<div class="bg-black/40 rounded-lg p-3 border border-purple-500/40 text-sm space-y-2">
      <div class="text-xs text-purple-300 uppercase tracking-wide">${div === 'east' ? (data.branding?.divA || 'Division A') : (data.branding?.divB || 'Division B')} · Wheel spin</div>
      <div><strong>${escapeHtml(ownerName)}</strong> chose <span class="text-aew-gold">${escapeHtml(award.foName)}</span></div>
      <p class="text-xs text-gray-400">Commissioner spins the Wheel of Boom to resolve this award.</p>
      ${isCommish ? `<button type="button" class="fo-spin-btn bg-aew-gold text-black font-bold text-sm px-3 py-1.5 rounded-lg" data-div="${div}">Spin for ${escapeHtml(ownerName)}</button>` : ''}
      <p class="fo-spin-msg text-xs min-h-[1rem]" data-div="${div}"></p>
    </div>`;
  }).join('');

  const recent = (foAwardState.rounds || []).slice(0, 4);
  const recentHtml = recent.length ? `
    <div class="mt-4 pt-3 border-t border-gray-800">
      <div class="text-xs text-gray-500 mb-2 uppercase tracking-wide">Recent FO results</div>
      <div class="space-y-1.5 text-xs text-gray-400">
        ${recent.map(r => {
          const name = data.users[r.pin]?.name || r.pin;
          const extra = r.wheelResult ? ` → wheel: ${escapeHtml(r.wheelResult)}` : '';
          const res = r.resultText ? ` · ${escapeHtml(r.resultText)}` : '';
          return `<div><span class="text-gray-300">${escapeHtml(name)}</span> · ${escapeHtml(r.foName || 'FO')}${extra}${res}</div>`;
        }).join('')}
      </div>
    </div>` : '';

  el.innerHTML = `
    <div class="bg-aew-card rounded-xl border border-gray-800 p-4">
      <div class="flex flex-wrap items-start justify-between gap-2 mb-1">
        <h3 class="font-bold text-aew-gold">Foreign Objects</h3>
        ${isCommish ? `<button type="button" id="fo-trigger-awards" class="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg font-medium">Award FO to last place</button>` : ''}
      </div>
      <p class="text-xs text-gray-500 mb-3">Optional bonus layer — not required. After a special/PPV (demo: commish clicks the button), each region's last-place team picks one FO. Wheel Of Boom = commissioner spins.</p>
      <div class="grid md:grid-cols-2 gap-3 mb-4">${activeBlocks}</div>
      <details class="text-sm">
        <summary class="cursor-pointer text-gray-400 hover:text-gray-200 text-xs">Available Foreign Objects (catalog)</summary>
        <div class="space-y-2 mt-2">
          ${fos.map(fo => `
            <div class="bg-black/40 rounded-lg p-3 border border-gray-800">
              <div class="font-semibold text-sm mb-0.5">${escapeHtml(fo.name)}</div>
              <div class="text-xs text-gray-400 leading-snug">${escapeHtml(fo.desc || '')}</div>
            </div>`).join('')}
        </div>
      </details>
      ${recentHtml}
      <p id="fo-award-msg" class="text-sm mt-2 min-h-[1.25rem]"></p>
    </div>`;

  document.getElementById('fo-trigger-awards')?.addEventListener('click', () => {
    const r = triggerFoAwards();
    const msg = document.getElementById('fo-award-msg');
    if (!r.ok) {
      if (msg) { msg.textContent = r.error; msg.className = 'text-sm mt-2 text-red-400'; }
      return;
    }
    if (msg) {
      msg.textContent = r.results.join(' · ');
      msg.className = 'text-sm mt-2 text-emerald-400';
    }
    renderStandingsFoTile();
  });

  el.querySelectorAll('.fo-pick-btn').forEach(btn => {
    btn.onclick = () => {
      const r = pickForeignObject(btn.dataset.div, btn.dataset.name);
      const msg = document.getElementById('fo-award-msg');
      if (!r.ok) {
        if (msg) { msg.textContent = r.error; msg.className = 'text-sm mt-2 text-red-400'; }
        return;
      }
      if (msg) {
        msg.textContent = r.message;
        msg.className = 'text-sm mt-2 text-emerald-400';
      }
      renderStandingsFoTile();
      if (activeTab === 'myteam') renderMyTeam();
      if (activeTab === 'standings') renderStandings();
    };
  });

  el.querySelectorAll('.fo-spin-btn').forEach(btn => {
    btn.onclick = () => {
      const div = btn.dataset.div;
      const segs = (data.wheel && data.wheel.length) ? data.wheel : DEFAULT_WHEEL;
      if (!segs.length) return;
      const i = Math.floor(Math.random() * segs.length);
      const label = segs[i].label;
      // Mirror on commissioner wheel result if present
      const wr = document.getElementById('wheel-result');
      if (wr) wr.textContent = label;
      const r = resolveFoWheelSpin(div, label);
      const msg = el.querySelector(`.fo-spin-msg[data-div="${div}"]`);
      if (!r.ok) {
        if (msg) msg.textContent = r.error;
        return;
      }
      if (msg) msg.textContent = r.message;
      renderStandingsFoTile();
      renderStandings();
      if (activeTab === 'myteam') renderMyTeam();
    };
  });
}

const TRADE_BLOCK_KEY = 'wf_demo_trade_block';

function loadTradeBlocks() {
  try {
    const raw = localStorage.getItem(TRADE_BLOCK_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(pin => {
          if (data.users[pin]) data.users[pin].tradeBlock = Array.isArray(obj[pin]) ? obj[pin] : [];
        });
      }
    }
  } catch (e) {}
}

function saveTradeBlocks() {
  const map = {};
  Object.entries(data.users).forEach(([pin, u]) => {
    if (u.tradeBlock?.length) map[pin] = u.tradeBlock;
  });
  localStorage.setItem(TRADE_BLOCK_KEY, JSON.stringify(map));
}

function isOnTradeBlock(pin, wrestler) {
  const block = data.users[pin]?.tradeBlock || [];
  return block.some(w => w.toLowerCase() === wrestler.toLowerCase());
}

function toggleTradeBlock(pin, wrestler) {
  const u = data.users[pin];
  if (!u) return;
  u.tradeBlock = u.tradeBlock || [];
  const i = u.tradeBlock.findIndex(w => w.toLowerCase() === wrestler.toLowerCase());
  if (i >= 0) u.tradeBlock.splice(i, 1);
  else u.tradeBlock.push(wrestler);
  // Only keep names still on roster
  u.tradeBlock = u.tradeBlock.filter(w => (u.roster || []).some(r => r.toLowerCase() === w.toLowerCase()));
  saveTradeBlocks();
}

// ---------- Trades (propose / accept / decline / counter) ----------
const TRADES_KEY = 'wf_demo_trades';
const TRADE_NOTICES_KEY = 'wf_demo_trade_notices';

let trades = [];
let tradeNotices = [];
let tradeProposePartner = '';
let tradeOfferSel = [];
let tradeRequestSel = [];
let tradeCounterId = null; // when set, propose form is in counter mode
let tradeCounterOffer = [];
let tradeCounterRequest = [];

function loadTrades() {
  try {
    const raw = localStorage.getItem(TRADES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) trades = arr;
    }
  } catch (e) { trades = []; }
  try {
    const raw = localStorage.getItem(TRADE_NOTICES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) tradeNotices = arr;
    }
  } catch (e) { tradeNotices = []; }
}

function saveTrades() {
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
  localStorage.setItem(TRADE_NOTICES_KEY, JSON.stringify(tradeNotices));
}

function newTradeId() {
  return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

function addTradeNotice(toPin, text, tradeId) {
  tradeNotices.unshift({
    id: 'n_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    toPin,
    text,
    tradeId: tradeId || null,
    read: false,
    createdAt: new Date().toISOString()
  });
  // keep last 40
  tradeNotices = tradeNotices.slice(0, 40);
  saveTrades();
}

function sameDivPartners(pin) {
  const me = data.users[pin];
  if (!me || !me.division) return [];
  return Object.entries(data.users)
    .filter(([p, u]) => p !== pin && u.division === me.division && !u.isCommissioner && !u.purged)
    .sort((a, b) => a[1].name.localeCompare(b[1].name));
}

function rosterHasAll(pin, names) {
  const roster = (data.users[pin]?.roster || []).map(w => w.toLowerCase());
  return names.every(n => roster.includes(n.toLowerCase()));
}

function applyTradeSwap(fromPin, toPin, offer, request) {
  const from = data.users[fromPin];
  const to = data.users[toPin];
  if (!from || !to) return { ok: false, error: 'Team not found' };
  if (!rosterHasAll(fromPin, offer)) return { ok: false, error: 'Offer roster changed — refresh and try again' };
  if (!rosterHasAll(toPin, request)) return { ok: false, error: 'Requested roster changed — refresh and try again' };

  const offerSet = new Set(offer.map(w => w.toLowerCase()));
  const reqSet = new Set(request.map(w => w.toLowerCase()));

  // Remove offered from from, requested from to
  from.roster = (from.roster || []).filter(w => !offerSet.has(w.toLowerCase()));
  to.roster = (to.roster || []).filter(w => !reqSet.has(w.toLowerCase()));
  // Add
  from.roster = [...from.roster, ...request];
  to.roster = [...to.roster, ...offer];

  // Clean trade blocks
  from.tradeBlock = (from.tradeBlock || []).filter(w => (from.roster || []).some(r => r.toLowerCase() === w.toLowerCase()));
  to.tradeBlock = (to.tradeBlock || []).filter(w => (to.roster || []).some(r => r.toLowerCase() === w.toLowerCase()));
  saveTradeBlocks();

  // Roster size check (soft warning only in demo — still apply if over; rules text covers 8/9)
  return { ok: true };
}

function proposeTrade(fromPin, toPin, offer, request, parentId) {
  if (!fromPin || !toPin || fromPin === toPin) return { ok: false, error: 'Pick a trade partner' };
  if (!offer.length && !request.length) return { ok: false, error: 'Select at least one wrestler' };
  if (!rosterHasAll(fromPin, offer)) return { ok: false, error: 'You no longer roster everyone you offered' };
  if (!rosterHasAll(toPin, request)) return { ok: false, error: 'Partner no longer rosters everyone you requested' };

  const trade = {
    id: newTradeId(),
    fromPin,
    toPin,
    offer: offer.slice(),
    request: request.slice(),
    status: 'pending',
    parentId: parentId || null,
    createdAt: new Date().toISOString()
  };
  trades.unshift(trade);
  const fromName = data.users[fromPin]?.name || fromPin;
  addTradeNotice(toPin, `${fromName} sent you a trade proposal.`, trade.id);
  saveTrades();
  return { ok: true, trade };
}

function acceptTrade(tradeId, byPin) {
  const t = trades.find(x => x.id === tradeId);
  if (!t || t.status !== 'pending') return { ok: false, error: 'Trade not available' };
  if (t.toPin !== byPin) return { ok: false, error: 'Only the receiving team can accept' };
  const result = applyTradeSwap(t.fromPin, t.toPin, t.offer, t.request);
  if (!result.ok) return result;
  t.status = 'accepted';
  t.resolvedAt = new Date().toISOString();
  const toName = data.users[byPin]?.name || byPin;
  addTradeNotice(t.fromPin, `${toName} accepted your trade.`, t.id);
  saveTrades();
  return { ok: true };
}

function declineTrade(tradeId, byPin) {
  const t = trades.find(x => x.id === tradeId);
  if (!t || t.status !== 'pending') return { ok: false, error: 'Trade not available' };
  if (t.toPin !== byPin) return { ok: false, error: 'Only the receiving team can decline' };
  t.status = 'declined';
  t.resolvedAt = new Date().toISOString();
  const toName = data.users[byPin]?.name || byPin;
  addTradeNotice(t.fromPin, `${toName} declined your trade.`, t.id);
  saveTrades();
  return { ok: true };
}

function startCounter(tradeId) {
  const t = trades.find(x => x.id === tradeId);
  if (!t || t.status !== 'pending') return;
  tradeCounterId = tradeId;
  // Counter: I (original to) offer from my roster, request from their roster
  tradeCounterOffer = [];
  tradeCounterRequest = [];
  renderTradesPanel();
  const el = document.getElementById('trade-counter-card');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function submitCounter(byPin) {
  const t = trades.find(x => x.id === tradeCounterId);
  if (!t || t.status !== 'pending') return { ok: false, error: 'Original trade not available' };
  if (t.toPin !== byPin) return { ok: false, error: 'Only the receiving team can counter' };
  // Counter proposal: from = current user (was to), to = original from
  const result = proposeTrade(byPin, t.fromPin, tradeCounterOffer, tradeCounterRequest, t.id);
  if (!result.ok) return result;
  t.status = 'countered';
  t.resolvedAt = new Date().toISOString();
  saveTrades();
  tradeCounterId = null;
  tradeCounterOffer = [];
  tradeCounterRequest = [];
  const fromName = data.users[byPin]?.name || byPin;
  // proposeTrade already notified the new recipient; also note counter on original
  addTradeNotice(t.fromPin, `${fromName} countered your trade with a new proposal.`, result.trade.id);
  return { ok: true };
}

function cancelTrade(tradeId, byPin) {
  const t = trades.find(x => x.id === tradeId);
  if (!t || t.status !== 'pending') return { ok: false, error: 'Trade not available' };
  if (t.fromPin !== byPin) return { ok: false, error: 'Only the sender can cancel' };
  t.status = 'cancelled';
  t.resolvedAt = new Date().toISOString();
  saveTrades();
  return { ok: true };
}

function wrestlerPickList(names, selected, dataAttr, pinForBlock) {
  return (names || []).slice().sort((a, b) => pts(b) - pts(a)).map(w => {
    const sel = selected.some(s => s.toLowerCase() === w.toLowerCase());
    const onBlock = pinForBlock && isOnTradeBlock(pinForBlock, w);
    return `<button type="button" class="trade-pick text-left px-2 py-1.5 rounded-lg border text-sm flex items-center gap-2 w-full ${sel ? 'border-aew-gold bg-aew-gold/10' : 'border-gray-800 bg-black/40 hover:border-gray-600'}" data-role="${dataAttr}" data-name="${escapeHtml(w)}">
      <span class="relative flex-shrink-0">
        ${portraitHtml(w, 'h-12 w-12')}
        ${onBlock ? '<span class="absolute bottom-0 right-0 text-xs">🤝</span>' : ''}
      </span>
      <span class="flex-1 truncate">${escapeHtml(w)}</span>
      <span class="text-gray-500 font-mono text-xs">${pts(w)}</span>
      <span class="text-xs ${sel ? 'text-aew-gold' : 'text-gray-600'}">${sel ? '✓' : ''}</span>
    </button>`;
  }).join('') || '<p class="text-xs text-gray-500">No wrestlers</p>';
}

function tradeSummaryLine(t) {
  const from = data.users[t.fromPin]?.name || t.fromPin;
  const to = data.users[t.toPin]?.name || t.toPin;
  const offer = (t.offer || []).join(', ') || '—';
  const req = (t.request || []).join(', ') || '—';
  return `<div class="text-sm">
    <span class="font-semibold">${escapeHtml(from)}</span>
    <span class="text-gray-500"> offers </span>
    <span class="text-aew-gold">${escapeHtml(offer)}</span>
    <span class="text-gray-500"> for </span>
    <span class="text-aew-gold">${escapeHtml(req)}</span>
    <span class="text-gray-500"> from </span>
    <span class="font-semibold">${escapeHtml(to)}</span>
  </div>`;
}

function statusBadge(status) {
  const map = {
    pending: 'bg-yellow-900/60 text-yellow-300',
    accepted: 'bg-emerald-900/60 text-emerald-300',
    declined: 'bg-red-900/60 text-red-300',
    countered: 'bg-purple-900/60 text-purple-300',
    cancelled: 'bg-gray-700 text-gray-400'
  };
  return `<span class="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${map[status] || 'bg-gray-700'}">${status}</span>`;
}

function renderTradesPanel() {
  renderTradeRulesPublic();
  const noticesEl = document.getElementById('trade-notices');
  const inboxEl = document.getElementById('trade-inbox');
  const proposeEl = document.getElementById('trade-propose-card');
  const historyEl = document.getElementById('trade-history');
  if (!inboxEl || !proposeEl) return;

  const me = currentUser;
  const u = data.users[me];
  if (!me || !u || u.isCommissioner) {
    if (noticesEl) noticesEl.innerHTML = '';
    inboxEl.innerHTML = '<p class="text-sm text-gray-500">Log in as a team owner to propose and respond to trades.</p>';
    proposeEl.innerHTML = '';
    if (historyEl) historyEl.innerHTML = '';
    return;
  }

  // Notices for me
  const myNotices = tradeNotices.filter(n => n.toPin === me).slice(0, 8);
  if (noticesEl) {
    if (!myNotices.length) noticesEl.innerHTML = '';
    else {
      noticesEl.innerHTML = myNotices.map(n => `
        <div class="text-sm px-3 py-2 rounded-lg border ${n.read ? 'border-gray-800 bg-black/30 text-gray-400' : 'border-aew-gold/40 bg-aew-gold/10 text-gray-200'}" data-nid="${n.id}">
          <div class="flex justify-between gap-2 items-start">
            <span>${escapeHtml(n.text)}</span>
            ${!n.read ? `<button type="button" class="trade-notice-read text-[10px] text-gray-400 hover:text-white whitespace-nowrap" data-nid="${n.id}">Dismiss</button>` : ''}
          </div>
        </div>`).join('');
      noticesEl.querySelectorAll('.trade-notice-read').forEach(btn => {
        btn.onclick = () => {
          const n = tradeNotices.find(x => x.id === btn.dataset.nid);
          if (n) n.read = true;
          saveTrades();
          renderTradesPanel();
        };
      });
    }
  }

  // Incoming pending
  const incoming = trades.filter(t => t.toPin === me && t.status === 'pending');
  const outgoing = trades.filter(t => t.fromPin === me && t.status === 'pending');

  let inboxHtml = '';
  if (incoming.length) {
    inboxHtml += `<h3 class="font-semibold mb-2">Incoming proposals</h3>`;
    inboxHtml += incoming.map(t => `
      <div class="bg-aew-card rounded-xl border border-aew-gold/30 p-4 space-y-3" data-tid="${t.id}">
        ${tradeSummaryLine(t)}
        <div class="text-xs text-gray-500">You receive: <span class="text-gray-300">${escapeHtml((t.offer || []).join(', ') || '—')}</span>
          · They receive: <span class="text-gray-300">${escapeHtml((t.request || []).join(', ') || '—')}</span></div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="trade-accept bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg" data-id="${t.id}">Accept</button>
          <button type="button" class="trade-decline bg-gray-700 hover:bg-gray-600 text-sm px-3 py-1.5 rounded-lg" data-id="${t.id}">Decline</button>
          <button type="button" class="trade-counter bg-aew-gold text-black text-sm font-bold px-3 py-1.5 rounded-lg" data-id="${t.id}">Counter</button>
        </div>
      </div>`).join('');
  }
  if (outgoing.length) {
    inboxHtml += `<h3 class="font-semibold mb-2 mt-4">Your pending offers</h3>`;
    inboxHtml += outgoing.map(t => `
      <div class="bg-aew-card rounded-xl border border-gray-800 p-4 space-y-2">
        ${tradeSummaryLine(t)}
        <div class="flex flex-wrap gap-2 items-center">
          ${statusBadge(t.status)}
          <button type="button" class="trade-cancel text-xs text-red-400 hover:text-red-300" data-id="${t.id}">Cancel offer</button>
        </div>
      </div>`).join('');
  }
  if (!incoming.length && !outgoing.length) {
    inboxHtml = '<p class="text-sm text-gray-500 mb-2">No pending trades.</p>';
  }
  inboxEl.innerHTML = inboxHtml;

  inboxEl.querySelectorAll('.trade-accept').forEach(btn => {
    btn.onclick = () => {
      const r = acceptTrade(btn.dataset.id, me);
      if (!r.ok) { alert(r.error); return; }
      tradeCounterId = null;
      renderTradesPanel();
      renderLeagueRosters();
      if (activeTab === 'myteam') renderMyTeam();
      if (activeTab === 'standings') renderStandings();
    };
  });
  inboxEl.querySelectorAll('.trade-decline').forEach(btn => {
    btn.onclick = () => {
      if (!confirm('Decline this trade? The other owner will be notified.')) return;
      const r = declineTrade(btn.dataset.id, me);
      if (!r.ok) { alert(r.error); return; }
      tradeCounterId = null;
      renderTradesPanel();
    };
  });
  inboxEl.querySelectorAll('.trade-counter').forEach(btn => {
    btn.onclick = () => startCounter(btn.dataset.id);
  });
  inboxEl.querySelectorAll('.trade-cancel').forEach(btn => {
    btn.onclick = () => {
      cancelTrade(btn.dataset.id, me);
      renderTradesPanel();
    };
  });

  // Counter form
  let counterHtml = '';
  if (tradeCounterId) {
    const orig = trades.find(x => x.id === tradeCounterId);
    if (orig && orig.status === 'pending' && orig.toPin === me) {
      const theirPin = orig.fromPin;
      const theirName = data.users[theirPin]?.name || theirPin;
      counterHtml = `
        <div id="trade-counter-card" class="bg-aew-card rounded-xl border border-purple-500/40 p-4 mb-4 space-y-3">
          <h3 class="font-bold text-purple-300">Counter trade to ${escapeHtml(theirName)}</h3>
          <p class="text-xs text-gray-500">Pick who you send them, and who you want back from their roster. This replaces the original proposal.</p>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-gray-400 mb-1">You send (your roster)</div>
              <div class="space-y-1 max-h-48 overflow-y-auto" id="counter-offer-list">
                ${wrestlerPickList(u.roster || [], tradeCounterOffer, 'counter-offer', me)}
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-400 mb-1">You receive (their roster)</div>
              <div class="space-y-1 max-h-48 overflow-y-auto" id="counter-request-list">
                ${wrestlerPickList(data.users[theirPin]?.roster || [], tradeCounterRequest, 'counter-request', theirPin)}
              </div>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" id="counter-submit" class="bg-aew-gold text-black font-bold text-sm px-4 py-2 rounded-lg">Send counter</button>
            <button type="button" id="counter-cancel" class="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded-lg">Cancel</button>
          </div>
          <p id="counter-msg" class="text-sm min-h-[1.25rem]"></p>
        </div>`;
    } else {
      tradeCounterId = null;
    }
  }

  // Propose form
  const partners = sameDivPartners(me);
  if (!tradeProposePartner && partners.length) tradeProposePartner = partners[0][0];
  const partnerRoster = data.users[tradeProposePartner]?.roster || [];

  proposeEl.innerHTML = counterHtml + `
    <h3 class="font-semibold mb-1">Propose a trade</h3>
    <p class="text-xs text-gray-500 mb-3">Same division only. Partner will see Accept, Decline, or Counter.</p>
    <div class="mb-3">
      <label class="block text-[10px] text-gray-500 mb-0.5">Trade with</label>
      <select id="trade-partner" class="w-full max-w-xs bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm">
        ${partners.map(([p, pu]) => `<option value="${p}" ${p === tradeProposePartner ? 'selected' : ''}>${escapeHtml(pu.name)}</option>`).join('')}
      </select>
    </div>
    <div class="grid md:grid-cols-2 gap-4 mb-3">
      <div>
        <div class="text-xs text-gray-400 mb-1">You send</div>
        <div class="space-y-1 max-h-52 overflow-y-auto" id="propose-offer-list">
          ${wrestlerPickList(u.roster || [], tradeOfferSel, 'offer', me)}
        </div>
      </div>
      <div>
        <div class="text-xs text-gray-400 mb-1">You receive</div>
        <div class="space-y-1 max-h-52 overflow-y-auto" id="propose-request-list">
          ${wrestlerPickList(partnerRoster, tradeRequestSel, 'request', tradeProposePartner)}
        </div>
      </div>
    </div>
    <button type="button" id="trade-propose-btn" class="bg-aew-red hover:bg-red-700 text-white font-bold text-sm px-4 py-2 rounded-lg">Send trade proposal</button>
    <p id="trade-propose-msg" class="text-sm mt-2 min-h-[1.25rem]"></p>`;

  // Wire propose picks
  const toggleSel = (arr, name) => {
    const i = arr.findIndex(x => x.toLowerCase() === name.toLowerCase());
    if (i >= 0) arr.splice(i, 1);
    else arr.push(name);
  };

  proposeEl.querySelectorAll('.trade-pick').forEach(btn => {
    btn.onclick = () => {
      const name = btn.dataset.name;
      const role = btn.dataset.role;
      if (role === 'offer') toggleSel(tradeOfferSel, name);
      else if (role === 'request') toggleSel(tradeRequestSel, name);
      else if (role === 'counter-offer') toggleSel(tradeCounterOffer, name);
      else if (role === 'counter-request') toggleSel(tradeCounterRequest, name);
      renderTradesPanel();
    };
  });

  document.getElementById('trade-partner')?.addEventListener('change', (e) => {
    tradeProposePartner = e.target.value;
    tradeRequestSel = [];
    renderTradesPanel();
  });

  document.getElementById('trade-propose-btn')?.addEventListener('click', () => {
    const r = proposeTrade(me, tradeProposePartner, tradeOfferSel, tradeRequestSel, null);
    const msg = document.getElementById('trade-propose-msg');
    if (!r.ok) {
      if (msg) { msg.textContent = r.error; msg.className = 'text-sm mt-2 text-red-400'; }
      return;
    }
    tradeOfferSel = [];
    tradeRequestSel = [];
    if (msg) { msg.textContent = 'Trade sent. Partner will see it under Incoming proposals.'; msg.className = 'text-sm mt-2 text-emerald-400'; }
    renderTradesPanel();
  });

  document.getElementById('counter-submit')?.addEventListener('click', () => {
    const r = submitCounter(me);
    const msg = document.getElementById('counter-msg');
    if (!r.ok) {
      if (msg) { msg.textContent = r.error; msg.className = 'text-sm text-red-400'; }
      else alert(r.error);
      return;
    }
    renderTradesPanel();
  });
  document.getElementById('counter-cancel')?.addEventListener('click', () => {
    tradeCounterId = null;
    tradeCounterOffer = [];
    tradeCounterRequest = [];
    renderTradesPanel();
  });

  // History
  if (historyEl) {
    const mine = trades.filter(t => t.fromPin === me || t.toPin === me).slice(0, 12);
    if (!mine.length) historyEl.innerHTML = '';
    else {
      historyEl.innerHTML = `<h3 class="font-semibold mb-2 text-sm text-gray-400">Recent activity</h3>` + mine.map(t => `
        <div class="bg-black/30 border border-gray-800 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <div class="min-w-0 flex-1">${tradeSummaryLine(t)}</div>
          ${statusBadge(t.status)}
        </div>`).join('');
    }
  }
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
        <p class="text-gray-400 text-sm">${u.division === 'east' ? (data.branding?.divA || 'Division A') : (data.branding?.divB || 'Division B')} · ${roster.length}/${getTeamMaxRoster(u)}</p>
      </div>
      <div class="text-right">
        <div class="text-3xl font-black text-aew-gold">${data.points[currentUser] || 0}</div>
        <div class="text-xs text-gray-500">Total Points</div>
      </div>
    </div>
    <div class="bg-aew-card rounded-xl border border-gray-800 p-4">
      <h3 class="font-semibold mb-1">Roster (by points)</h3>
      <p class="text-xs text-gray-500 mb-3">Tap <strong>Trade Block</strong> to mark a wrestler available. Others see 🤝 on League Rosters.</p>
      <div class="grid sm:grid-cols-2 gap-2">
        ${roster.map(w => {
          const onBlock = isOnTradeBlock(currentUser, w);
          return `<div class="bg-black/50 rounded-lg px-3 py-2 text-sm flex items-center gap-2 ${onBlock ? 'border border-amber-600/50' : ''}">
            <div class="relative flex-shrink-0">
              ${portraitHtml(w, 'h-28 w-28')}
              ${onBlock ? '<span class="absolute bottom-0 right-0 text-base leading-none drop-shadow" title="On trade block">🤝</span>' : ''}
            </div>
            <span class="flex-1 truncate">${escapeHtml(w)}${titleBadgesHtml(w)}</span>
            <span class="text-gray-400 font-mono text-xs">${pts(w)}</span>
            <button type="button" class="trade-block-btn text-[10px] px-2 py-1 rounded ${onBlock ? 'bg-amber-800 text-amber-100' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}" data-name="${escapeHtml(w)}">
              ${onBlock ? 'On block 🤝' : 'Trade Block'}
            </button>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  el.querySelectorAll('.trade-block-btn').forEach(btn => {
    btn.onclick = () => {
      toggleTradeBlock(currentUser, btn.dataset.name);
      renderMyTeam();
    };
  });

  // Banked / held Foreign Objects
  const inv = u.foInventory || [];
  if (inv.length) {
    const invCard = document.createElement('div');
    invCard.className = 'bg-aew-card rounded-xl border border-gray-800 p-4 mt-6';
    invCard.innerHTML = `
      <h3 class="font-semibold text-aew-gold mb-1">Your Foreign Objects</h3>
      <p class="text-xs text-gray-500 mb-3">Optional bonuses you've earned (bankable items can be used later in a full league).</p>
      <div class="space-y-2">
        ${inv.map(fo => `
          <div class="bg-black/40 border border-gray-800 rounded-lg px-3 py-2 text-sm">
            <div class="font-medium">${escapeHtml(fo.name)}</div>
            <div class="text-xs text-gray-500">${escapeHtml(fo.desc || '')}</div>
          </div>`).join('')}
      </div>`;
    el.appendChild(invCard);
  }
}

// ---------- Waivers ----------
const WAIVER_KEY = 'wf_demo_waivers';

let dropRanked = [];
let waiverState = {
  deadline: '',           // datetime-local string
  claims: {},             // pin -> { adds: [], drops: [], submittedAt }
  lastResults: [],        // [{ pin, add, drop, div }]
  lastProcessedAt: null
};

function loadWaivers() {
  try {
    const raw = localStorage.getItem(WAIVER_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      waiverState = {
        deadline: obj.deadline || '',
        claims: obj.claims && typeof obj.claims === 'object' ? obj.claims : {},
        lastResults: Array.isArray(obj.lastResults) ? obj.lastResults : [],
        lastProcessedAt: obj.lastProcessedAt || null
      };
    }
  } catch (e) {}
}

function saveWaivers() {
  localStorage.setItem(WAIVER_KEY, JSON.stringify(waiverState));
}

function getAvailable(div) {
  const d = div || data.users[currentUser]?.division;
  const taken = new Set();
  Object.values(data.users).forEach(u => {
    if (u.division === d) (u.roster || []).forEach(w => taken.add(w.toLowerCase()));
  });
  return (data.masterRoster || [])
    .filter(w => !taken.has(w.toLowerCase()))
    .sort((a, b) => pts(b) - pts(a) || a.localeCompare(b));
}

function formatWaiverDeadline() {
  if (!waiverState.deadline) return 'No deadline set';
  try {
    const d = new Date(waiverState.deadline);
    if (isNaN(d.getTime())) return waiverState.deadline;
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) {
    return waiverState.deadline;
  }
}

function isPastWaiverDeadline() {
  if (!waiverState.deadline) return false;
  const d = new Date(waiverState.deadline);
  if (isNaN(d.getTime())) return false;
  return Date.now() >= d.getTime();
}

function submitWaiverClaim(pin) {
  const u = data.users[pin];
  if (!u || u.isCommissioner) return { ok: false, error: 'Owners only' };
  if (!claimRanked.length) return { ok: false, error: 'Add at least one free agent to claim' };
  const rosterLen = (u.roster || []).length;
  const maxR = getTeamMaxRoster(u);
  // If roster full after any successful add without drop, need drops
  if (rosterLen >= maxR && !dropRanked.length) {
    return { ok: false, error: 'Roster is full — select at least one drop' };
  }
  // Validate drops are on roster
  for (const d of dropRanked) {
    if (!(u.roster || []).some(w => w.toLowerCase() === d.toLowerCase())) {
      return { ok: false, error: `Drop not on your roster: ${d}` };
    }
  }
  waiverState.claims[pin] = {
    adds: claimRanked.slice(),
    drops: dropRanked.slice(),
    submittedAt: new Date().toISOString()
  };
  saveWaivers();
  return { ok: true };
}

function clearMyWaiverDraft() {
  claimRanked = [];
  dropRanked = [];
}

/**
 * Process waivers by division.
 * Priority: lowest points first (last in standings).
 * Each team gets at most ONE successful claim (first available on their ranked list).
 * Claims stay silent until this runs.
 */
function processWaivers() {
  const results = [];
  const divisions = ['east', 'west'];

  divisions.forEach(div => {
    // Priority order: lowest points first
    const order = Object.entries(data.users)
      .filter(([_, u]) => u.division === div && !u.isCommissioner && !u.purged)
      .map(([pin, u]) => ({ pin, points: data.points[pin] || 0, name: u.name }))
      .sort((a, b) => a.points - b.points || a.name.localeCompare(b.name));

    // Track who got claimed this process (free agents taken)
    const claimedThisRun = new Set();

    order.forEach(({ pin }) => {
      const claim = waiverState.claims[pin];
      if (!claim || !(claim.adds || []).length) return;
      const u = data.users[pin];
      if (!u) return;

      for (const addName of claim.adds) {
        if (claimedThisRun.has(addName.toLowerCase())) continue;
        // Free agent = not on any same-division roster and not taken this run
        const onSomeone = Object.values(data.users).some(ou =>
          ou.division === div && (ou.roster || []).some(r => r.toLowerCase() === addName.toLowerCase())
        );
        if (onSomeone) continue;

        // Need roster space?
        let dropUsed = null;
        const roster = (u.roster || []).slice();
        if (roster.length >= getTeamMaxRoster(u)) {
          // Use first still-on-roster drop from claim
          const drop = (claim.drops || []).find(d =>
            roster.some(r => r.toLowerCase() === d.toLowerCase())
          );
          if (!drop) continue; // can't claim this one without a valid drop
          dropUsed = drop;
          u.roster = roster.filter(r => r.toLowerCase() !== drop.toLowerCase());
        }

        // Add free agent
        if (!(u.roster || []).some(r => r.toLowerCase() === addName.toLowerCase())) {
          u.roster = [...(u.roster || []), addName];
        }
        // Clean trade block for dropped
        if (dropUsed && u.tradeBlock) {
          u.tradeBlock = u.tradeBlock.filter(w => w.toLowerCase() !== dropUsed.toLowerCase());
        }
        claimedThisRun.add(addName.toLowerCase());
        results.push({
          pin,
          name: u.name,
          div,
          add: addName,
          drop: dropUsed,
          priority: order.findIndex(o => o.pin === pin) + 1
        });
        break; // one successful claim per team
      }
    });
  });

  // Clear all claims after process (whether successful or not)
  waiverState.claims = {};
  waiverState.lastResults = results;
  waiverState.lastProcessedAt = new Date().toISOString();
  saveWaivers();
  saveTradeBlocks();
  return results;
}

function removeFromClaimRanked(nameOrIndex) {
  if (typeof nameOrIndex === 'number' && !isNaN(nameOrIndex)) {
    if (nameOrIndex >= 0 && nameOrIndex < claimRanked.length) {
      claimRanked.splice(nameOrIndex, 1);
      return true;
    }
    return false;
  }
  const name = String(nameOrIndex || '');
  const idx = claimRanked.findIndex(w => w.toLowerCase() === name.toLowerCase());
  if (idx < 0) return false;
  claimRanked.splice(idx, 1);
  return true;
}

let claimListBound = false;
function bindClaimListClicks() {
  const el = document.getElementById('claim-list');
  if (!el || claimListBound) return;
  claimListBound = true;
  // Event delegation — survives re-renders; X always works
  el.addEventListener('click', (e) => {
    const btn = e.target.closest('.claim-remove');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const name = btn.getAttribute('data-name');
    const i = parseInt(btn.getAttribute('data-i'), 10);
    if (name) removeFromClaimRanked(name);
    else if (!isNaN(i)) removeFromClaimRanked(i);
    renderClaimList();
  });
}

function renderClaimList() {
  const el = document.getElementById('claim-list');
  if (!el) return;
  bindClaimListClicks();
  if (!claimRanked.length) {
    el.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">Click free agents to rank a claim</p>';
    return;
  }
  el.innerHTML = claimRanked.map((w, i) => `
    <div class="flex items-center justify-between gap-2 py-1.5 text-sm border-b border-gray-800/50 last:border-0">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <span class="text-gray-500 text-xs w-5">${i + 1}.</span>
        ${portraitHtml(w, 'h-14 w-14')}
        <span class="truncate">${escapeHtml(w)}</span>
      </div>
      <button type="button" class="claim-remove flex-shrink-0 min-w-[2.5rem] min-h-[2.5rem] flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg text-base" data-i="${i}" data-name="${escapeHtml(w)}" aria-label="Remove ${escapeHtml(w)} from claim" title="Remove from claim">✕</button>
    </div>`).join('');
}

function renderDropList() {
  const el = document.getElementById('drop-list');
  if (!el) return;
  const u = data.users[currentUser];
  if (!u || u.isCommissioner) {
    el.innerHTML = '';
    return;
  }
  const roster = (u.roster || []).slice().sort((a, b) => pts(b) - pts(a));
  el.innerHTML = `
    <div class="space-y-1 mb-2">
      ${dropRanked.length ? dropRanked.map((w, i) => `
        <div class="flex items-center justify-between gap-2 text-sm py-1">
          <span class="text-gray-500 text-xs w-5">${i + 1}.</span>
          <span class="flex-1 truncate">${escapeHtml(w)}</span>
          <button type="button" class="drop-remove min-w-[2.5rem] min-h-[2.5rem] flex items-center justify-center text-red-400 hover:bg-red-950/40 rounded-lg" data-i="${i}" data-name="${escapeHtml(w)}" aria-label="Remove drop">✕</button>
        </div>`).join('') : '<p class="text-xs text-gray-500">No drops selected</p>'}
    </div>
    <div class="text-[10px] text-gray-500 mb-1">Tap roster names to queue as drops:</div>
    <div class="flex flex-wrap gap-1">
      ${roster.map(w => {
        const on = dropRanked.some(d => d.toLowerCase() === w.toLowerCase());
        return `<button type="button" class="drop-add text-xs px-2 py-1 rounded border ${on ? 'border-red-700 bg-red-950/40 text-red-300' : 'border-gray-700 text-gray-400 hover:border-gray-500'}" data-name="${escapeHtml(w)}">${escapeHtml(w)}</button>`;
      }).join('')}
    </div>`;
  el.querySelectorAll('.drop-remove').forEach(b => {
    b.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const name = b.getAttribute('data-name');
      if (name) {
        const idx = dropRanked.findIndex(d => d.toLowerCase() === name.toLowerCase());
        if (idx >= 0) dropRanked.splice(idx, 1);
      } else {
        const i = parseInt(b.getAttribute('data-i'), 10);
        if (!isNaN(i) && i >= 0 && i < dropRanked.length) dropRanked.splice(i, 1);
      }
      renderDropList();
    };
  });
  el.querySelectorAll('.drop-add').forEach(b => {
    b.onclick = () => {
      const name = b.dataset.name;
      const i = dropRanked.findIndex(d => d.toLowerCase() === name.toLowerCase());
      if (i >= 0) dropRanked.splice(i, 1);
      else dropRanked.push(name);
      renderDropList();
    };
  });
}

function renderWaiver() {
  const bar = document.getElementById('waiver-deadline-bar');
  const ownerPanel = document.getElementById('waiver-owner-panel');
  const commishPanel = document.getElementById('waiver-commish-panel');
  const resultsEl = document.getElementById('waiver-results');
  const isCommish = data.users[currentUser]?.isCommissioner;

  if (bar) {
    const past = isPastWaiverDeadline();
    bar.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span class="text-gray-500">Waiver deadline:</span>
          <strong class="${past ? 'text-yellow-400' : 'text-gray-200'}">${escapeHtml(formatWaiverDeadline())}</strong>
          ${past ? '<span class="text-xs text-yellow-500 ml-2">Past due — ready to process</span>' : ''}
        </div>
        <div class="text-xs text-gray-500">Priority: lowest standings first · claims are silent until processed</div>
      </div>`;
  }

  if (isCommish) {
    if (ownerPanel) ownerPanel.classList.add('hidden');
    if (commishPanel) {
      commishPanel.classList.remove('hidden');
      const silentCount = Object.keys(waiverState.claims || {}).length;
      const claimPins = Object.keys(waiverState.claims || {});
      // Commish sees COUNT only, not contents (silent)
      const byDiv = { east: 0, west: 0 };
      claimPins.forEach(pin => {
        const d = data.users[pin]?.division;
        if (d && byDiv[d] != null) byDiv[d]++;
      });
      commishPanel.innerHTML = `
        <div class="bg-aew-card rounded-xl border border-aew-gold/30 p-4 space-y-4">
          <h3 class="font-bold text-aew-gold">Waiver wire (commissioner)</h3>
          <p class="text-xs text-gray-500">Claims are silent — you only see how many teams submitted, not who they claimed, until process runs.</p>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] text-gray-500 mb-0.5">Process deadline</label>
              <input type="datetime-local" id="waiver-deadline-input" class="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm" value="${escapeHtml(waiverState.deadline || '')}" />
            </div>
            <div class="flex items-end">
              <button type="button" id="waiver-save-deadline" class="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded-lg">Save deadline</button>
            </div>
          </div>
          <div class="text-sm text-gray-300">
            Submitted (sealed): <strong>${silentCount}</strong> team(s)
            <span class="text-gray-500 text-xs ml-2">A: ${byDiv.east} · B: ${byDiv.west}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" id="waiver-process-btn" class="bg-aew-red hover:bg-red-700 text-white font-bold text-sm px-4 py-2 rounded-lg">Process waivers (demo)</button>
          </div>
          <p id="waiver-commish-msg" class="text-sm min-h-[1.25rem]"></p>
          <p class="text-[11px] text-gray-500">Runs reverse-standings priority per division. Each team gets at most one successful add. Then all sealed claims clear.</p>
        </div>`;

      document.getElementById('waiver-save-deadline')?.addEventListener('click', () => {
        waiverState.deadline = document.getElementById('waiver-deadline-input')?.value || '';
        saveWaivers();
        const msg = document.getElementById('waiver-commish-msg');
        if (msg) {
          msg.textContent = 'Deadline saved: ' + formatWaiverDeadline();
          msg.className = 'text-sm text-emerald-400';
        }
        renderWaiver();
      });
      document.getElementById('waiver-process-btn')?.addEventListener('click', () => {
        if (!Object.keys(waiverState.claims).length) {
          const msg = document.getElementById('waiver-commish-msg');
          if (msg) {
            msg.textContent = 'No sealed claims to process';
            msg.className = 'text-sm text-yellow-400';
          }
          return;
        }
        if (!confirm('Process all sealed waiver claims now? Priority = lowest standings first.')) return;
        const results = processWaivers();
        const msg = document.getElementById('waiver-commish-msg');
        if (msg) {
          msg.textContent = results.length
            ? `Processed: ${results.length} successful claim(s).`
            : 'Processed — no claims could be filled.';
          msg.className = 'text-sm text-emerald-400';
        }
        renderWaiver();
        renderStandings();
        renderLeagueRosters();
      });
    }
  } else {
    if (ownerPanel) ownerPanel.classList.remove('hidden');
    if (commishPanel) {
      commishPanel.classList.add('hidden');
      commishPanel.innerHTML = '';
    }

    const box = document.getElementById('available-wrestlers');
    if (box) {
      const avail = getAvailable();
      box.innerHTML = avail.map(w => `
        <div class="wrestler-chip px-2 py-2 rounded-lg text-sm flex items-center gap-2 cursor-pointer hover:border-gray-600 border border-transparent" data-name="${escapeHtml(w)}">
          ${portraitHtml(w, 'h-20 w-20')}
          <span class="flex-1 truncate">${escapeHtml(w)}</span>
          <span class="text-gray-500 font-mono text-xs">${pts(w)}</span>
        </div>`).join('') || '<p class="text-gray-500 text-sm p-3">None available</p>';
      box.querySelectorAll('.wrestler-chip').forEach(el => {
        el.onclick = () => {
          const n = el.dataset.name;
          if (!claimRanked.some(c => c.toLowerCase() === n.toLowerCase())) {
            claimRanked.push(n);
            renderClaimList();
          }
        };
      });
    }
    renderClaimList();
    renderDropList();

    const submitted = waiverState.claims[currentUser];
    const mySub = document.getElementById('waiver-my-submitted');
    if (mySub) {
      if (submitted) {
        mySub.innerHTML = `
          <div class="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-3 text-sm">
            <div class="font-medium text-emerald-300 mb-1">Claim sealed</div>
            <div class="text-xs text-gray-400">Submitted ${submitted.submittedAt ? new Date(submitted.submittedAt).toLocaleString() : ''}. Ranked adds: <span class="text-gray-300">${escapeHtml((submitted.adds || []).join(', '))}</span>
            ${(submitted.drops || []).length ? ` · Drops: <span class="text-gray-300">${escapeHtml(submitted.drops.join(', '))}</span>` : ''}</div>
            <p class="text-[11px] text-gray-500 mt-1">You can resubmit to replace this sealed claim before process.</p>
          </div>`;
      } else {
        mySub.innerHTML = '<p class="text-xs text-gray-500">No sealed claim yet.</p>';
      }
    }
  }

  // Results visible to everyone after process
  if (resultsEl) {
    const res = waiverState.lastResults || [];
    if (!res.length) {
      resultsEl.innerHTML = waiverState.lastProcessedAt
        ? `<p class="text-xs text-gray-500">Last process ${new Date(waiverState.lastProcessedAt).toLocaleString()} — no successful claims.</p>`
        : '';
    } else {
      resultsEl.innerHTML = `
        <h3 class="font-semibold text-sm mb-2">Last waiver results</h3>
        <div class="space-y-1.5">
          ${res.map(r => `
            <div class="text-sm bg-black/40 border border-gray-800 rounded-lg px-3 py-2">
              <span class="font-medium">${escapeHtml(r.name)}</span>
              <span class="text-gray-500 text-xs">(priority #${r.priority})</span>
              claimed <span class="text-aew-gold">${escapeHtml(r.add)}</span>
              ${r.drop ? ` · dropped <span class="text-red-300">${escapeHtml(r.drop)}</span>` : ''}
            </div>`).join('')}
        </div>
        <p class="text-[11px] text-gray-500 mt-1">${waiverState.lastProcessedAt ? new Date(waiverState.lastProcessedAt).toLocaleString() : ''}</p>`;
    }
  }
}

function renderLeagueRosters() {
  const el = document.getElementById('league-rosters-view');
  if (!el) return;
  const div = data.users[currentUser]?.division;
  const teams = Object.entries(data.users)
    .filter(([_, u]) => u.division === div)
    .sort((a, b) => (data.points[b[0]] || 0) - (data.points[a[0]] || 0));
  const legend = `
    <div class="text-xs text-gray-400 mb-4 flex flex-wrap items-center gap-2">
      <span class="inline-flex items-center gap-1.5 bg-black/40 border border-gray-800 rounded-lg px-2.5 py-1.5">
        <span class="text-sm leading-none">🤝</span>
        <span>= on the <strong class="text-gray-300">Trade Block</strong> (owner marked them available to trade)</span>
      </span>
    </div>`;
  el.innerHTML = legend + teams.map(([pin, u]) => {
    const roster = (u.roster || []).slice().sort((a, b) => pts(b) - pts(a));
    return `<div class="bg-aew-card rounded-xl border border-gray-800 p-4">
      <div class="flex justify-between mb-2">
        <span class="font-semibold ${u.purged ? 'line-through text-red-400' : ''}">${escapeHtml(u.name)}${pin === currentUser ? ' (you)' : ''}${champCrown(pin)}</span>
        ${u.purged ? '<span class="text-[10px] font-black text-red-500 border border-red-600 px-1 rounded">PURGED</span>' : ''}
        <span class="text-sm text-gray-400">${roster.length}/${getTeamMaxRoster(u)} · ${data.points[pin] || 0} pts</span>
      </div>
      <div class="flex flex-wrap gap-1.5">
        ${roster.map(w => {
          const onBlock = isOnTradeBlock(pin, w);
          return `<span class="relative text-xs bg-black/60 border ${onBlock ? 'border-amber-600/60' : 'border-gray-700'} rounded pl-1 pr-2 py-1 inline-flex items-center gap-1.5">
            <span class="relative inline-block flex-shrink-0">
              ${portraitHtml(w, 'h-20 w-20')}
              ${onBlock ? '<span class="absolute bottom-0 right-0 text-sm leading-none" title="On trade block">🤝</span>' : ''}
            </span>
            <span>${escapeHtml(w)}${titleBadgesHtml(w)}</span>
            <span class="text-gray-500">${pts(w)}</span>
          </span>`;
        }).join('')}
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
  renderTradeRulesPublic();
  renderBonusRulesPublic();
}

function renderTradeRulesPublic() {
  const rules = data.leagueRules || defaultLeagueRules();
  const tradeBlock = document.getElementById('rules-trade-block');
  const tradeBody = document.getElementById('rules-trade-body');
  if (!tradeBlock || !tradeBody) return;
  if (rules.tradeEnabled && rules.tradeText) {
    tradeBlock.classList.remove('hidden');
    tradeBody.textContent = rules.tradeText;
  } else {
    tradeBlock.classList.add('hidden');
  }
}

function renderBonusRulesPublic() {
  const rules = data.leagueRules || defaultLeagueRules();
  const bonusBlock = document.getElementById('rules-bonus-block');
  const bonusBody = document.getElementById('rules-bonus-body');
  if (!bonusBlock || !bonusBody) return;
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

function setTxTab(which) {
  const panels = {
    waivers: document.getElementById('tx-waivers-panel'),
    trades: document.getElementById('tx-trades-panel'),
    rosters: document.getElementById('tx-rosters-panel')
  };
  const buttons = {
    waivers: document.getElementById('tx-tab-waivers'),
    trades: document.getElementById('tx-tab-trades'),
    rosters: document.getElementById('tx-tab-rosters')
  };
  Object.keys(panels).forEach(k => {
    if (panels[k]) panels[k].classList.toggle('hidden', k !== which);
    if (buttons[k]) {
      buttons[k].className = k === which
        ? 'px-4 py-2 rounded-lg text-sm font-medium bg-aew-red text-white'
        : 'px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300';
    }
  });
  if (which === 'rosters') renderLeagueRosters();
  if (which === 'trades') renderTradesPanel();
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
  if (type === 'PPV' || type === 'PLE' || type === 'PPV/PLE') return 'bg-red-900/60 text-red-300';
  if (type === 'Special' || type === 'Special TV') return 'bg-purple-900/60 text-purple-300';
  if (type === 'Foreign Object') return 'bg-amber-900/60 text-amber-300';
  if (type === 'Draft') return 'bg-emerald-900/60 text-emerald-300';
  if (type === 'Weekly TV') return 'bg-blue-900/60 text-blue-300';
  return 'bg-gray-800 text-gray-300';
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
  const events = (data.calendar || []).map(normalizeCalendarEvent).filter(Boolean);
  if (!events.length) {
    el.innerHTML = '<p class="text-gray-500 text-sm py-8 text-center">No events yet. Commissioner can add them under Commissioner tools.</p>';
    return;
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const weekly = events.filter(e => e.type === 'Weekly TV');
  const upcoming = events
    .filter(e => e.date && e.date >= todayStr)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = events
    .filter(e => e.date && e.date < todayStr)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  // Dated or undated non-weekly that aren't in upcoming/past lists handled:
  const undatedOther = events.filter(e => e.type !== 'Weekly TV' && !e.date);

  let html = '';
  if (weekly.length) {
    html += `<div class="mb-6"><h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Weekly TV</h3>
      <div class="space-y-2">${weekly.map(eventCard).join('')}</div></div>`;
  }
  if (upcoming.length) {
    html += `<div class="mb-6"><h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Upcoming</h3>
      <div class="space-y-2">${upcoming.map(eventCard).join('')}</div></div>`;
  }
  if (undatedOther.length) {
    html += `<div class="mb-6"><h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Other (no date set)</h3>
      <div class="space-y-2">${undatedOther.map(eventCard).join('')}</div></div>`;
  }
  if (past.length) {
    html += `<div class="mb-6"><h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Past</h3>
      <div class="space-y-2">${past.map(eventCard).join('')}</div></div>`;
  }
  el.innerHTML = html || '<p class="text-gray-500 text-sm py-4 text-center">No events to show.</p>';
}

function eventCard(s) {
  const dateLine = s.date
    ? formatSeasonDate(s.date)
    : (s.type === 'Weekly TV' ? 'Weekly' : 'Date not set');
  return `
    <div class="bg-aew-card rounded-xl border border-gray-800 p-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <div class="font-bold text-lg">${escapeHtml(s.name)}</div>
        <div class="text-sm text-gray-400 mt-0.5">${escapeHtml(dateLine)}</div>
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

let calendarEditIndex = null; // which event row is expanded for editing
let calendarEditorBound = false; // event delegation bound once

/** Snapshot every event from memory, overlaying any open editor fields from the DOM. */
function collectCalendarFromDom() {
  const list = document.getElementById('calendar-editor-list');
  const base = (data.calendar || []).map(e => {
    const n = normalizeCalendarEvent(e);
    return n || { name: '', type: 'Weekly TV', date: '', notes: '' };
  });
  if (!list) return base;

  list.querySelectorAll('[data-i]').forEach(block => {
    const i = parseInt(block.getAttribute('data-i'), 10);
    if (isNaN(i) || i < 0 || i >= base.length) return;
    const nameEl = block.querySelector('.cal-name');
    // Collapsed rows have no inputs — keep existing base[i]
    if (!nameEl) return;
    const name = (nameEl.value || '').trim();
    const type = normalizeEventType(block.querySelector('.cal-type')?.value);
    const date = (block.querySelector('.cal-date')?.value || '').trim();
    const notes = (block.querySelector('.cal-notes')?.value || '').trim();
    base[i] = { name: name || base[i].name, type, date, notes };
  });
  return base;
}

function openCalendarEdit(i) {
  const idx = parseInt(i, 10);
  if (isNaN(idx) || idx < 0) return;
  data.calendar = collectCalendarFromDom();
  calendarEditIndex = idx;
  renderCalendarEditor();
  requestAnimationFrame(() => {
    const list = document.getElementById('calendar-editor-list');
    const nameInput = list?.querySelector(`[data-i="${idx}"] .cal-name`);
    if (nameInput) {
      nameInput.focus();
      nameInput.select();
    }
  });
}

function closeCalendarEdit() {
  data.calendar = collectCalendarFromDom();
  calendarEditIndex = null;
  renderCalendarEditor();
}

function deleteCalendarEvent(i) {
  const idx = parseInt(i, 10);
  if (isNaN(idx)) return;
  data.calendar = collectCalendarFromDom();
  if (idx < 0 || idx >= data.calendar.length) return;
  data.calendar.splice(idx, 1);
  if (calendarEditIndex === idx) calendarEditIndex = null;
  else if (calendarEditIndex != null && calendarEditIndex > idx) calendarEditIndex -= 1;
  renderCalendarEditor();
}

function bindCalendarEditorClicks() {
  const el = document.getElementById('calendar-editor-list');
  if (!el || calendarEditorBound) return;
  calendarEditorBound = true;
  el.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.cal-edit');
    const doneBtn = e.target.closest('.cal-done');
    const delBtn = e.target.closest('.cal-del');
    if (editBtn) {
      e.preventDefault();
      e.stopPropagation();
      openCalendarEdit(editBtn.getAttribute('data-i'));
      return;
    }
    if (doneBtn) {
      e.preventDefault();
      e.stopPropagation();
      closeCalendarEdit();
      return;
    }
    if (delBtn) {
      e.preventDefault();
      e.stopPropagation();
      deleteCalendarEvent(delBtn.getAttribute('data-i'));
    }
  });
}

function renderCalendarEditor() {
  const el = document.getElementById('calendar-editor-list');
  if (!el) return;
  bindCalendarEditorClicks();

  // Always work from normalized copy
  data.calendar = (data.calendar || []).map(e => normalizeCalendarEvent(e) || e);
  const events = data.calendar;

  if (!events.length) {
    el.innerHTML = '<p class="text-gray-500 text-sm">No events yet. Click + Add event.</p>';
    return;
  }

  el.innerHTML = events.map((s, i) => {
    const editing = Number(calendarEditIndex) === i;
    const when = s.date ? formatSeasonDate(s.date) : (s.type === 'Weekly TV' ? 'Weekly' : 'No date');
    if (!editing) {
      return `
        <div class="bg-black/40 rounded-lg px-3 py-2.5 border border-gray-800 flex flex-wrap items-center gap-2" data-i="${i}">
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm truncate">${escapeHtml(s.name)}</div>
            <div class="text-xs text-gray-500">${escapeHtml(s.type || '')} · ${escapeHtml(when)}</div>
          </div>
          <button type="button" class="cal-edit inline-flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 text-white px-2.5 py-1.5 rounded-lg" data-i="${i}" title="Edit this event">
            <span aria-hidden="true">✏️</span> Edit
          </button>
          <button type="button" class="cal-del text-red-400 text-xs hover:text-red-300 px-2 py-1.5" data-i="${i}" title="Delete">✕</button>
        </div>`;
    }
    return `
      <div class="bg-black/40 rounded-lg p-3 border border-aew-gold/60 space-y-2 ring-1 ring-aew-gold/30" data-i="${i}">
        <div class="flex flex-wrap items-center gap-2">
          <input type="text" class="cal-name flex-1 min-w-[10rem] bg-black border border-gray-700 rounded px-2 py-1.5 text-sm font-semibold" value="${escapeHtml(s.name)}" placeholder="Event name" />
          <button type="button" class="cal-done text-xs bg-emerald-800 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg" data-i="${i}">Done</button>
          <button type="button" class="cal-del text-red-400 text-xs hover:text-red-300 px-2 py-1.5" data-i="${i}">✕</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] text-gray-500 mb-0.5">Type</label>
            <select class="cal-type w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-sm">
              ${EVENT_TYPES.map(t => `<option value="${t}" ${s.type === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[10px] text-gray-500 mb-0.5">Date</label>
            <input type="date" class="cal-date w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-sm" value="${escapeHtml(s.date || '')}" />
          </div>
        </div>
        <input type="text" class="cal-notes w-full bg-black border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300" value="${escapeHtml(s.notes || '')}" placeholder="Notes (optional)" />
        <p class="text-[11px] text-gray-500">Name, Date, Type — then <strong>Done</strong>. Click <strong>Save Calendar</strong> to keep changes.</p>
      </div>`;
  }).join('');
}

function renderCommissioner() {
  renderLeagueSetupForm();
  renderPoolEditor();
  renderTeamsInvite();
  renderDraftSetupForm();
  renderSeasonForm();
  renderCalendarEditor();
  renderScoringEditor();
  renderPurgeEditor();
  renderTitlesEditor();
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
  if (u && (u.roster || []).length < getTeamMaxRoster(u) && !(u.roster || []).includes(wrestler)) {
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
  if (u && (u.roster || []).length < getTeamMaxRoster(u) && !(u.roster || []).includes(nom.wrestler)) {
    u.roster = [...(u.roster || []), nom.wrestler];
  }
  demoDraft.nomination = null;
  demoDraft.nominatorIndex = (demoDraft.nominatorIndex + 1) % (demoDraft.order || [1]).length;

  // End when all teams full or pool empty
  const order = demoDraft.order || [];
  const allFull = order.every(p => (data.users[p]?.roster || []).length >= getTeamMaxRoster(p));
  if (allFull || getDraftAvailable().length === 0) demoDraft.status = 'complete';

  saveDraft();
  renderDraft();
  renderStandings();
}

document.addEventListener('DOMContentLoaded', () => {
  data.branding = loadBranding();
  applyTeamNamesFromBranding();
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
  loadTradeBlocks();
  loadTrades();
  loadFoAwards();
  loadWaivers();
  loadPurge();
  loadTitles();
  applyLoadedScores();
  startPurgeAutoChecker();
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

  function attemptLogin(pin, preferredTab) {
    const res = login(pin);
    const err = document.getElementById('login-error');
    if (res.ok) {
      if (err) err.classList.add('hidden');
      const tab = preferredTab || (data.users[pin]?.isCommissioner ? 'commissioner' : 'standings');
      enterApp(tab);
    } else if (err) {
      err.textContent = res.error;
      err.classList.remove('hidden');
    }
  }
  document.getElementById('login-btn').onclick = () => {
    attemptLogin(document.getElementById('pin-input').value);
  };
  document.getElementById('quick-login-commish')?.addEventListener('click', () => {
    attemptLogin('commish', 'commissioner');
  });
  document.getElementById('quick-login-alpha')?.addEventListener('click', () => {
    attemptLogin('alpha', 'standings');
  });
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
  document.getElementById('tx-tab-waivers')?.addEventListener('click', () => setTxTab('waivers'));
  document.getElementById('tx-tab-trades')?.addEventListener('click', () => setTxTab('trades'));
  document.getElementById('tx-tab-rosters')?.addEventListener('click', () => setTxTab('rosters'));

  document.getElementById('waiver-submit-claim')?.addEventListener('click', () => {
    const r = submitWaiverClaim(currentUser);
    const msg = document.getElementById('waiver-claim-msg');
    if (!r.ok) {
      if (msg) { msg.textContent = r.error; msg.className = 'text-sm text-red-400'; }
      return;
    }
    clearMyWaiverDraft();
    if (msg) {
      msg.textContent = 'Claim sealed. It stays silent until the commissioner processes waivers.';
      msg.className = 'text-sm text-emerald-400';
    }
    renderWaiver();
  });
  document.getElementById('waiver-clear-claim')?.addEventListener('click', () => {
    clearMyWaiverDraft();
    const msg = document.getElementById('waiver-claim-msg');
    if (msg) { msg.textContent = 'Draft cleared'; msg.className = 'text-sm text-gray-400'; }
    renderWaiver();
  });
  document.getElementById('save-scores').onclick = () => {
    // Atomic: collect ALL filled fields (East + West), apply once, persist once.
    // Blank fields are left alone — never wipe the other division.
    const result = commitScoreUpdates();
    const msgEl = document.getElementById('save-scores-msg');
    if (!result.ok) {
      if (msgEl) {
        msgEl.textContent = result.message;
        msgEl.className = 'text-sm mt-2 text-red-400';
      } else {
        alert(result.message);
      }
      return;
    }
    renderCommissioner();
    renderStandings();
    if (msgEl) {
      msgEl.textContent = result.message;
      msgEl.className = 'text-sm mt-2 text-emerald-400';
    } else {
      alert(result.message);
    }
  };

  document.getElementById('setup-save')?.addEventListener('click', saveLeagueSetupUI);

  document.getElementById('pool-save')?.addEventListener('click', () => {
    const text = document.getElementById('pool-paste')?.value || '';
    const names = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    savePool(names);
    renderPoolEditor();
    alert('Saved ' + names.length + ' wrestlers to the pool.');
  });
  document.getElementById('pool-manage-filter')?.addEventListener('input', () => renderPoolManageList());
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
  document.getElementById('my-team-name-save')?.addEventListener('click', () => {
    const input = document.getElementById('my-team-name-input');
    const msg = document.getElementById('my-team-name-msg');
    const r = setTeamName(currentUser, input?.value || '');
    if (!r.ok) {
      if (msg) { msg.textContent = r.error; msg.className = 'text-sm mt-1.5 text-red-400'; }
      return;
    }
    if (msg) { msg.textContent = 'Team name saved: ' + r.name; msg.className = 'text-sm mt-1.5 text-emerald-400'; }
    renderMyTeam();
    renderMyTeamLogoCard();
    renderStandings();
    renderLeagueRosters();
    if (typeof renderTradesPanel === 'function') renderTradesPanel();
    // Update header badge
    const u = data.users[currentUser];
    const badge = document.getElementById('user-badge');
    if (badge && u) badge.textContent = u.name + (u.isCommissioner ? ' · Commish' : '');
  });

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
    const label = segs[i].label;
    document.getElementById('wheel-result').textContent = label;
    // If exactly one region is waiting on a wheel FO, apply this spin to them
    const pending = ['east', 'west'].filter(d => foAwardState.active[d]?.status === 'pending_wheel');
    if (pending.length === 1) {
      const r = resolveFoWheelSpin(pending[0], label);
      if (r.ok) {
        const msg = document.getElementById('wheel-editor-msg');
        if (msg) {
          msg.textContent = r.message;
          msg.className = 'text-sm mt-2 text-emerald-400';
        }
        renderStandingsFoTile();
        renderStandings();
      }
    } else if (pending.length > 1) {
      const msg = document.getElementById('wheel-editor-msg');
      if (msg) {
        msg.textContent = 'Multiple FO wheel spins pending — use “Spin for [team]” on Standings.';
        msg.className = 'text-sm mt-2 text-yellow-400';
      }
    }
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
    data.calendar = collectCalendarFromDom();
    data.calendar.push({ name: 'New event', type: 'Weekly TV', date: '', notes: '' });
    openCalendarEdit(data.calendar.length - 1);
  });
  document.getElementById('calendar-reset')?.addEventListener('click', () => {
    data.calendar = DEFAULT_CALENDAR.map(s => ({ ...s }));
    calendarEditIndex = null;
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
    // Always collect open editor fields, normalize, persist once
    const events = collectCalendarFromDom()
      .map(normalizeCalendarEvent)
      .filter(Boolean);
    calendarEditIndex = null;
    saveCalendar(events);
    const msg = document.getElementById('calendar-msg');
    if (msg) {
      const dated = events.filter(e => e.date).length;
      msg.textContent = events.length
        ? `Saved ${events.length} event(s)` + (dated ? ` · ${dated} with dates` : '')
        : 'Calendar cleared';
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
    renderTradeRulesPublic();
  });
  document.getElementById('trade-rules-enabled')?.addEventListener('change', (e) => {
    const rules = data.leagueRules || defaultLeagueRules();
    rules.tradeEnabled = e.target.checked;
    data.leagueRules = rules;
    saveLeagueRules(rules);
    renderTradeRulesPublic();
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


  // Purge
  document.getElementById('purge-enabled')?.addEventListener('change', (e) => {
    purgeConfig.enabled = e.target.checked;
    savePurge();
    renderPurgeEditor();
  });
  document.getElementById('purge-save')?.addEventListener('click', () => {
    purgeConfig.nextAt = document.getElementById('purge-next-at')?.value || '';
    purgeConfig.enabled = document.getElementById('purge-enabled')?.checked === true;
    savePurge();
    const msg = document.getElementById('purge-msg');
    if (msg) {
      msg.textContent = 'Purge settings saved';
      msg.className = 'text-sm text-emerald-400';
    }
    renderPurgeEditor();
  });
  document.getElementById('purge-run')?.addEventListener('click', () => {
    if (!purgeConfig.enabled) {
      const msg = document.getElementById('purge-msg');
      if (msg) { msg.textContent = 'Enable The Purge first'; msg.className = 'text-sm text-red-400'; }
      return;
    }
    if (!confirm('Run the Purge now? Lowest team in each division will be eliminated and their roster goes to free agency.')) return;
    const r = runPurge();
    const msg = document.getElementById('purge-msg');
    if (!r.ok) {
      if (msg) { msg.textContent = r.error; msg.className = 'text-sm text-red-400'; }
      return;
    }
    const summary = r.results.map(x => x.name + ' (' + x.div + ') — released ' + x.released.length + ' wrestlers').join(' · ');
    if (msg) {
      msg.textContent = 'Purged: ' + summary + '. Set a waiver deadline under Transactions so owners can claim them.';
      msg.className = 'text-sm text-emerald-400';
    }
    renderPurgeEditor();
    renderStandings();
    renderWaiver();
  });

  // Championships
  document.getElementById('titles-add')?.addEventListener('click', () => {
    leagueTitles.push({
      id: 'title_' + Date.now().toString(36),
      name: 'New Championship',
      abbrev: 'NEW',
      holder: ''
    });
    renderTitlesEditor();
  });
  document.getElementById('titles-save')?.addEventListener('click', () => {
    const list = document.getElementById('titles-editor-list');
    if (!list) return;
    const next = [];
    list.querySelectorAll('[data-i]').forEach(row => {
      const name = row.querySelector('.title-name')?.value?.trim() || '';
      if (!name) return;
      let abbrev = row.querySelector('.title-abbrev')?.value?.trim() || '';
      if (!abbrev) abbrev = abbreviateTitle(name);
      const holder = row.querySelector('.title-holder')?.value || '';
      const i = parseInt(row.getAttribute('data-i'), 10);
      const prev = leagueTitles[i];
      next.push({
        id: prev?.id || ('title_' + Math.random().toString(36).slice(2, 8)),
        name,
        abbrev: abbrev.toUpperCase().slice(0, 8),
        holder
      });
    });
    leagueTitles = next;
    saveTitles();
    const msg = document.getElementById('titles-msg');
    if (msg) {
      msg.textContent = 'Saved ' + leagueTitles.length + ' title(s)';
      msg.className = 'text-sm text-emerald-400';
    }
    renderTitlesEditor();
    if (activeTab === 'myteam') renderMyTeam();
    if (activeTab === 'standings') renderStandings();
    renderLeagueRosters();
  });

  // Foreign Objects editor
  document.getElementById('fo-enabled')?.addEventListener('change', (e) => {
    data.foEnabled = e.target.checked;
    saveWheelConfig(currentWheelConfig());
    renderForeignObjects();
    renderStandingsFoTile();
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
    renderStandingsFoTile();
  });
});

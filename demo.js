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
  fantasyChampion: 'charlie'
};
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
  if (id === 'myteam') renderMyTeam();
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
        <h2 class="text-2xl font-bold">${u.name}${champCrown(currentUser)}</h2>
        <p class="text-gray-400 text-sm">${u.division === 'east' ? 'Division A' : 'Division B'} · ${roster.length}/${u.maxRoster}</p>
      </div>
      <div class="text-right">
        <div class="text-3xl font-black text-aew-gold">${data.points[currentUser] || 0}</div>
        <div class="text-xs text-gray-500">Total Points</div>
      </div>
    </div>
    <div class="bg-aew-card rounded-xl border border-gray-800 p-4">
      <h3 class="font-semibold mb-3">Roster (by points)</h3>
      <div class="grid sm:grid-cols-2 gap-2">
        ${roster.map(w => `<div class="bg-black/50 rounded-lg px-3 py-2 text-sm flex justify-between">
          <span>${w}</span><span class="text-gray-400 font-mono text-xs">${pts(w)}</span>
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
    <div class="wrestler-chip px-3 py-2 rounded-lg text-sm flex justify-between cursor-pointer hover:border-gray-600 border border-transparent" data-name="${w}">
      <span>${w}</span><span class="text-gray-500 font-mono text-xs">${pts(w)}</span>
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
    <div class="flex justify-between py-1 text-sm"><span>${i + 1}. ${w}</span>
    <button class="text-red-400 text-xs" data-i="${i}">✕</button></div>`).join('');
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
        ${roster.map(w => `<span class="text-xs bg-black/60 border border-gray-700 rounded px-2 py-1">${w} <span class="text-gray-500">${pts(w)}</span></span>`).join('')}
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
  document.getElementById('spin-wheel').onclick = () => {
    const i = Math.floor(Math.random() * WHEEL.length);
    document.getElementById('wheel-result').textContent = WHEEL[i].label;
  };
});

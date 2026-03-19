/* ══ ppPacSmile — Shop & Coins System ══ */
const COINS_KEY   = 'pacsmile_coins';
const PRICES_KEY  = 'pacsmile_prices';
const OWNED_KEY   = 'pacsmile_owned';  // owned (bought but not yet used) inventory

// Base prices for each power-up
const BASE_PRICES = {
  pill:      30,
  turbo:     40,
  candy:     40,
  shield:    60,
  bomb:      80,
  ice:       50,
  medikit:   45,
  extralife: 120,
};

// Price increment each time you buy the same item (gets more expensive)
const PRICE_INCREMENT = {
  pill:      10,
  turbo:     15,
  candy:     15,
  shield:    20,
  bomb:      25,
  ice:       18,
  medikit:   15,
  extralife: 40,
};

// Max stack per item in inventory
const MAX_STACK = 3;

// Power-up slot definitions — maps shop key → tile type & game property
const PU_MAP = {
  pill:      { tile: 3,  tKey: 'powerT',  dur: 28, emoji: '🔵' },
  turbo:     { tile: 8,  tKey: 'turboT',  dur: 22, emoji: '⭐' },
  candy:     { tile: 10, tKey: 'candyT',  dur: 28, emoji: '🍬' },
  shield:    { tile: 11, tKey: 'shieldT', dur: 32, emoji: '🛡️' },
  bomb:      { tile: 9,  tKey: null,      dur: 0,  emoji: '💣' },
  ice:       { tile: 15, tKey: null,      dur: 0,  emoji: '🧊' },
  medikit:   { tile: 5,  tKey: null,      dur: 0,  emoji: '💊' },
  extralife: { tile: 14, tKey: null,      dur: 0,  emoji: '❤️' },
};

// Active slots displayed at bottom of screen (player chooses up to 4)
// These are the 4 quick-use slots
const QUICK_SLOTS_KEY = 'pacsmile_slots';
let quickSlots = ['pill','turbo','candy','shield']; // default slots
try {
  const saved = JSON.parse(localStorage.getItem(QUICK_SLOTS_KEY));
  if (Array.isArray(saved) && saved.length === 4) quickSlots = saved;
} catch {}

/* ══ Persistence ══ */
function getCoins() {
  return parseInt(localStorage.getItem(COINS_KEY) || '0', 10);
}
function setCoins(n) {
  localStorage.setItem(COINS_KEY, Math.max(0, Math.floor(n)));
}
function addCoins(n) {
  setCoins(getCoins() + n);
  updateCoinHUD();
}
function spendCoins(n) {
  const c = getCoins();
  if (c < n) return false;
  setCoins(c - n);
  updateCoinHUD();
  return true;
}

function getPrices() {
  try { return JSON.parse(localStorage.getItem(PRICES_KEY)) || {}; } catch { return {}; }
}
function savePrices(p) { localStorage.setItem(PRICES_KEY, JSON.stringify(p)); }
function getCurrentPrice(key) {
  const prices = getPrices();
  return prices[key] !== undefined ? prices[key] : BASE_PRICES[key];
}
function bumpPrice(key) {
  const prices = getPrices();
  prices[key] = getCurrentPrice(key) + (PRICE_INCREMENT[key] || 10);
  savePrices(prices);
}
function resetPrices() {
  localStorage.removeItem(PRICES_KEY);
}

function getOwned() {
  try { return JSON.parse(localStorage.getItem(OWNED_KEY)) || {}; } catch { return {}; }
}
function saveOwned(o) { localStorage.setItem(OWNED_KEY, JSON.stringify(o)); }
function getOwnedCount(key) {
  return getOwned()[key] || 0;
}
function addOwned(key, n = 1) {
  const o = getOwned();
  o[key] = Math.min((o[key] || 0) + n, MAX_STACK);
  saveOwned(o);
}
function useOwned(key) {
  const o = getOwned();
  if (!o[key] || o[key] <= 0) return false;
  o[key]--;
  saveOwned(o);
  return true;
}

/* ══ Coins earned in game ══ */
// Called during gameplay to award coins
function awardGameCoins(amount, multiply2x = false) {
  const final = multiply2x ? amount * 2 : amount;
  addCoins(final);
  return final;
}

/* ══ Shop UI ══ */
function openShop(returnScreen = 'ss') {
  const overlay = document.getElementById('shop-overlay');
  overlay.classList.remove('hidden');
  renderShop();
  SFX.shop();

  document.getElementById('shop-close-btn').onclick = () => {
    overlay.classList.add('hidden');
  };
  document.getElementById('shop-reset-btn').onclick = () => {
    confirm2('🔄', t('conf_reset_prices'), t('conf_reset_text'), t('shop_reset_yes'), () => {
      resetPrices();
      renderShop();
      toast('🔄 ' + t('shop_reset') + ' OK');
    });
  };
  document.getElementById('shop-ads-btn').onclick = () => {
    showAd('shop_coins', () => {
      addCoins(50);
      toast(t('toast_coins_earned') + ' +50');
      SFX.coin();
      renderShop();
    });
  };
}

function renderShop() {
  updateCoinHUD();
  const coins = getCoins();
  document.getElementById('shop-coins-display').textContent = coins;

  const items = [
    { key: 'pill',      nameKey: 'pu_pill_name',      descKey: 'pu_pill_desc' },
    { key: 'turbo',     nameKey: 'pu_turbo_name',     descKey: 'pu_turbo_desc' },
    { key: 'candy',     nameKey: 'pu_candy_name',     descKey: 'pu_candy_desc' },
    { key: 'shield',    nameKey: 'pu_shield_name',    descKey: 'pu_shield_desc' },
    { key: 'bomb',      nameKey: 'pu_bomb_name',      descKey: 'pu_bomb_desc' },
    { key: 'ice',       nameKey: 'pu_ice_name',       descKey: 'pu_ice_desc' },
    { key: 'medikit',   nameKey: 'pu_medikit_name',   descKey: 'pu_medikit_desc' },
    { key: 'extralife', nameKey: 'pu_extralife_name', descKey: 'pu_extralife_desc' },
  ];

  const grid = document.getElementById('shop-grid');
  grid.innerHTML = items.map(item => {
    const price = getCurrentPrice(item.key);
    const owned = getOwnedCount(item.key);
    const canAfford = coins >= price;
    const maxed = owned >= MAX_STACK;
    const pu = PU_MAP[item.key];
    return `<div class="shop-item ${maxed ? 'maxed' : ''} ${!canAfford && !maxed ? 'cant-afford' : ''}">
      <div class="shop-item-emoji">${pu.emoji}</div>
      <div class="shop-item-name">${t(item.nameKey)}</div>
      <div class="shop-item-desc">${t(item.descKey)}</div>
      <div class="shop-item-footer">
        <div class="shop-owned">
          ${[...Array(MAX_STACK)].map((_, i) => `<span class="shop-dot ${i < owned ? 'filled' : ''}"></span>`).join('')}
        </div>
        <button class="shop-buy-btn ${maxed ? 'maxed' : !canAfford ? 'broke' : ''}"
          onclick="shopBuy('${item.key}')" ${maxed ? 'disabled' : ''}>
          ${maxed ? '✅ MAX' : `🪙 ${price}`}
        </button>
      </div>
    </div>`;
  }).join('');
}

function shopBuy(key) {
  const price = getCurrentPrice(key);
  if (getOwnedCount(key) >= MAX_STACK) { toast('✅ MAX'); return; }
  if (!spendCoins(price)) { toast(t('shop_not_enough')); SFX.hit(); return; }
  addOwned(key);
  bumpPrice(key);
  toast(`${PU_MAP[key].emoji} ${t('shop_purchased')}`);
  SFX.shop();
  renderShop();
  updateQuickSlotBar();
}

/* ══ Quick Slot Bar (bottom of game screen) ══ */
function updateQuickSlotBar() {
  const bar = document.getElementById('pu-bar');
  if (!bar) return;
  bar.innerHTML = quickSlots.map((key, idx) => {
    const pu = PU_MAP[key];
    const owned = getOwnedCount(key);
    // Check if currently active in G
    let activeTimer = 0;
    if (window.G) {
      if (key === 'pill')   activeTimer = G.powerT  || 0;
      if (key === 'turbo')  activeTimer = G.turboT  || 0;
      if (key === 'candy')  activeTimer = G.candyT  || 0;
      if (key === 'shield') activeTimer = G.shieldT || 0;
    }
    const isActive = activeTimer > 0;
    const secs = isActive ? Math.ceil(activeTimer * 160 / 1000) : 0;
    return `<button class="pu-slot-btn ${owned > 0 ? 'has-item' : 'empty'} ${isActive ? 'active' : ''}"
      onclick="activateSlot(${idx})" title="${t(pu ? 'pu_'+key+'_name' : 'toast_no_pu')}">
      <span class="pu-slot-emoji">${pu ? pu.emoji : '—'}</span>
      <span class="pu-slot-count">${owned > 0 ? owned : isActive ? secs+'s' : ''}</span>
    </button>`;
  }).join('');
}

function activateSlot(idx) {
  const key = quickSlots[idx];
  if (!key || !window.G || !G.player || G.over) return;
  const pu = PU_MAP[key];
  if (!pu) return;

  // Check if already active (timer-based)
  if (pu.tKey && G[pu.tKey] > 0) { toast('⚡ Already active!'); return; }

  if (!useOwned(key)) { toast(t('toast_no_pu')); SFX.hit(); return; }

  // Apply effect
  switch (key) {
    case 'pill':
      G.powerT = 28; G.enemies.forEach(e => { if (!e.dead) { e.scared = true; e.scaredT = 28; } });
      G.comboK = 0; toast('😱 ' + t('toast_frightened')); G.score += 20; break;
    case 'turbo':
      G.turboT = 22; toast(t('toast_turbo')); G.score += 20; break;
    case 'candy':
      G.candyT = 28; toast(t('toast_x2')); G.score += 10; break;
    case 'shield':
      G.shieldT = 32; toast(t('toast_shield')); G.score += 25; break;
    case 'bomb':
      G.explosions = G.explosions || [];
      G.enemies.forEach(e => {
        if (!e.dead) { G.explosions.push({x:e.x,y:e.y,t:12}); e.dead=true; e.scared=false; e.frozen=false; e.respawnT=40; }
      });
      toast(t('toast_boom')); G.score += 80; SFX.bomb(); break;
    case 'ice':
      G.enemies.forEach(e => { if (!e.dead) { e.frozen=true; e.frozenT=30; e.scared=false; } });
      toast(t('toast_frozen')); G.score += 40; SFX.ice(); break;
    case 'medikit':
      G.hp = Math.min(100, G.hp + 38); toast(t('toast_hp')); G.score += 15; break;
    case 'extralife':
      G.lives = Math.min(G.lives + 1, 5); toast(t('toast_extralife')); G.score += 100; updateHUD(); break;
  }
  SFX.powerup();
  updateQuickSlotBar();
}

/* ══ Coin HUD update ══ */
function updateCoinHUD() {
  const el = document.getElementById('hcoins');
  if (el) el.textContent = getCoins();
  const el2 = document.getElementById('shop-coins-display');
  if (el2) el2.textContent = getCoins();
}

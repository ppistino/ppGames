/* ══ ppPacSmile — GameDistribution SDK Integration ══ */

// GameDistribution game ID — replace with your actual GD game ID
const GD_GAME_ID = 'YOUR_GAME_ID_HERE';

let gdSDKReady = false;
let adPlaying  = false;
let pendingAdCallback = null;

/* ══ SDK Init ══ */
function initGameDistribution() {
  // GameDistribution SDK
  window['GD_OPTIONS'] = {
    gameId: GD_GAME_ID,
    onEvent: function(event) {
      switch (event.name) {
        case 'SDK_GAME_START':
          // Ad finished or closed — resume game
          adPlaying = false;
          if (window.G && G.player && !G.over) {
            G.paused = false;
            if (typeof lastTs !== 'undefined') { lastTs = 0; tickAcc = 0; }
            if (typeof loop === 'function') loop();
          }
          if (pendingAdCallback) {
            const cb = pendingAdCallback;
            pendingAdCallback = null;
            cb();
          }
          hideAdOverlay();
          break;

        case 'SDK_GAME_PAUSE':
          // Ad is about to play — pause game
          adPlaying = true;
          if (window.G && G.player && !G.over) G.paused = true;
          showAdOverlay();
          break;

        case 'SDK_READY':
          gdSDKReady = true;
          console.log('[GD] SDK Ready');
          break;

        case 'SDK_ERROR':
          console.warn('[GD] SDK Error', event);
          adPlaying = false;
          // Still fire the callback so the game doesn't get stuck
          if (pendingAdCallback) {
            const cb = pendingAdCallback;
            pendingAdCallback = null;
            cb();
          }
          hideAdOverlay();
          break;
      }
    }
  };

  // Load GD SDK script
  const script = document.createElement('script');
  script.src = 'https://html5.api.gamedistribution.com/main.min.js';
  script.async = true;
  script.onerror = () => {
    console.warn('[GD] SDK failed to load — running in standalone mode');
    gdSDKReady = false;
  };
  document.head.appendChild(script);
}

/* ══ Show Ad ══ */
// type: 'interstitial' | 'rewarded'
// callback fires after the ad completes (or on error/fallback)
function showAd(reason, callback) {
  pendingAdCallback = callback || null;

  if (!gdSDKReady || typeof gdsdk === 'undefined') {
    // SDK not loaded — simulate ad with a brief overlay then fire callback
    simulateAd(callback);
    return;
  }

  SFX.ads();
  showAdOverlay(reason);

  try {
    gdsdk.showAd(gdsdk.AdType.Interstitial);
  } catch (e) {
    console.warn('[GD] showAd error:', e);
    simulateAd(callback);
  }
}

function showRewardedAd(callback) {
  pendingAdCallback = callback || null;

  if (!gdSDKReady || typeof gdsdk === 'undefined') {
    simulateAd(callback);
    return;
  }

  SFX.ads();
  showAdOverlay('rewarded');

  try {
    // GD uses interstitial for rewarded too in most integrations
    gdsdk.showAd(gdsdk.AdType.Interstitial);
  } catch (e) {
    simulateAd(callback);
  }
}

/* ══ Simulate Ad (fallback when SDK not available) ══ */
function simulateAd(callback, delay = 1800) {
  showAdOverlay('simulated');
  setTimeout(() => {
    hideAdOverlay();
    if (callback) callback();
  }, delay);
}

/* ══ Ad overlay UI ══ */
function showAdOverlay(reason) {
  let el = document.getElementById('ad-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ad-overlay';
    el.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:rgba(0,0,0,.88);
      display:flex;align-items:center;justify-content:center;
      flex-direction:column;gap:16px;
      font-family:'Boogaloo',cursive;color:#fff;
      animation:popIn .25s ease;
    `;
    el.innerHTML = `
      <div style="font-size:3rem">📺</div>
      <div style="font-size:1.4rem;letter-spacing:2px">Ad Loading…</div>
      <div style="font-size:.85rem;color:rgba(255,255,255,.6)">Please wait a moment</div>
      <div style="width:180px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden;margin-top:8px">
        <div id="ad-progress" style="height:100%;background:linear-gradient(90deg,#ffcc00,#ff9500);
          border-radius:2px;animation:adProgress 2s linear forwards"></div>
      </div>
    `;
    document.body.appendChild(el);
    const style = document.createElement('style');
    style.textContent = '@keyframes adProgress{from{width:0}to{width:100%}}';
    document.head.appendChild(style);
  }
  el.style.display = 'flex';
}

function hideAdOverlay() {
  const el = document.getElementById('ad-overlay');
  if (el) el.style.display = 'none';
}

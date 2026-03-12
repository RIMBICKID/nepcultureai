/**
 * NepCulture — auth.js  v3.0
 * ─────────────────────────────────────────────────────────────────────────────
 * PERSISTENT SESSION AUTHENTICATION
 *
 * How it works (like Gmail / Facebook):
 *   1. User signs in ONCE through any method (username, Google, Facebook)
 *   2. A session token is created and stored in localStorage (30-day expiry)
 *      OR sessionStorage (tab-only, when "Remember Me" is unchecked)
 *   3. Every protected page calls NepAuth.requireAuth()
 *      → If a valid session exists: page loads immediately, no gate shown
 *      → If no session: inline login gate is shown over the page
 *   4. After login via the gate, the page RELOADS (same URL) so all scripts
 *      re-initialize cleanly with the authenticated session
 *   5. Session ends only on: logout · expiry · admin revocation · account disabled
 *
 * No redirect loops: the gate never navigates away from the current page.
 * login.html → always redirects to index.html after success.
 *
 * Storage keys:
 *   nepCulture_token    → active session token string
 *   nepCulture_sessions → all session records (admin-visible audit log)
 *   nepCulture_users    → registered user accounts
 *
 * OAuth notes (Google / Facebook):
 *   In this local / file:// build, OAuth uses a simulated consent UI so you
 *   can test the full flow without an HTTPS server.
 *   For production deployment, replace _showOAuthConsent() with:
 *     Google:   https://developers.google.com/identity/gsi/web
 *     Facebook: https://developers.facebook.com/docs/facebook-login/web
 *   The createSession() call that follows is identical either way.
 *
 * Public API: window.NepAuth
 *   Core          requireAuth(), isLoggedIn(), isAdmin(), getSession()
 *   Auth          login(u,p,remember), register(u,p,name), loginOAuth(provider), logout()
 *   Admin         getUsers(), getSessions(), revokeSession(token), revokeUserSessions(u),
 *                 disableUser(u), enableUser(u), getStats()
 */
;(function () {
  'use strict';

  // ── Admin credentials (char-code obfuscated) ──────────────────────────────
  const _AU = String.fromCharCode(114,105,109,98,105,99,107,105,100);
  const _AP = String.fromCharCode(116,104,101,121,99,97,108,108,109,101,76,79,71,73,67);

  // ── Storage keys ─────────────────────────────────────────────────────────
  const K_TOKEN    = 'nepCulture_token';
  const K_SESSIONS = 'nepCulture_sessions';
  const K_USERS    = 'nepCulture_users';
  const K_SESSION_LEGACY = 'nepCulture_session'; // v1 backward-compat

  const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  // ── Helpers ────────────────────────────────────────────────────────────────
  function generateToken() {
    try {
      const b = new Uint8Array(24);
      crypto.getRandomValues(b);
      return Array.from(b, x => x.toString(16).padStart(2,'0')).join('');
    } catch(e) {
      return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    }
  }

  function safeJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  }

  // ── Token storage ─────────────────────────────────────────────────────────
  function getToken() {
    return localStorage.getItem(K_TOKEN) || sessionStorage.getItem(K_TOKEN) || null;
  }
  function storeToken(token, persist) {
    (persist ? localStorage : sessionStorage).setItem(K_TOKEN, token);
  }
  function clearToken(token) {
    if (localStorage.getItem(K_TOKEN)   === token) localStorage.removeItem(K_TOKEN);
    if (sessionStorage.getItem(K_TOKEN) === token) sessionStorage.removeItem(K_TOKEN);
  }

  // ── Sessions log ──────────────────────────────────────────────────────────
  function getAllSessions() { return safeJSON(K_SESSIONS, []); }
  function saveSessions(list) { localStorage.setItem(K_SESSIONS, JSON.stringify(list.slice(0, 300))); }

  function upsertSession(s) {
    const list = getAllSessions().filter(x => x.token !== s.token);
    list.unshift(s);
    saveSessions(list);
  }

  function findSessionByToken(token) {
    return token ? getAllSessions().find(s => s.token === token) || null : null;
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  function getUsers() { return safeJSON(K_USERS, []); }
  function saveUsers(list) { localStorage.setItem(K_USERS, JSON.stringify(list)); }
  function findUser(username) {
    return getUsers().find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  // ── Session creation ───────────────────────────────────────────────────────
  function createSession(userObj, method, remember) {
    const token = generateToken();
    const now   = Date.now();
    const s = {
      token,
      username:     userObj.username,
      displayName:  userObj.displayName || userObj.username,
      role:         userObj.role || 'user',
      method:       method || 'password',
      loginTime:    now,
      lastActivity: now,
      expiresAt:    remember ? now + REMEMBER_MS : null,
      revoked:      false,
      device:       navigator.userAgent.substring(0, 130),
    };
    upsertSession(s);
    storeToken(token, !!remember);
    return s;
  }

  // ── v1 migration: convert old nepCulture_session → token ──────────────────
  function migrateLegacy() {
    if (getToken()) return; // already have a token, skip
    const old = safeJSON(K_SESSION_LEGACY, null);
    if (!old || !old.username) return;
    // Create a new token session from the old session data
    const userObj = { username: old.username, displayName: old.displayName || old.username, role: old.role || 'user' };
    createSession(userObj, 'migrated', true);
    localStorage.removeItem(K_SESSION_LEGACY);
    console.info('[NepCulture] auth: migrated legacy session for', old.username);
  }

  // ── Session validation ─────────────────────────────────────────────────────
  function validateSession() {
    const token = getToken();
    if (!token) return null;

    const s = findSessionByToken(token);
    if (!s)          return null;
    if (s.revoked)   { clearToken(token); return null; }
    if (s.expiresAt && Date.now() > s.expiresAt) {
      // Expired — mark and clear
      s.revoked = true; s.revokedReason = 'expired'; upsertSession(s);
      clearToken(token);
      return null;
    }

    // Check user account is not disabled (skip for admin)
    if (s.role !== 'admin') {
      const u = findUser(s.username);
      if (u && u.disabled) { clearToken(token); return null; }
    }

    // Refresh lastActivity (write-throttled to once per minute)
    if (Date.now() - (s.lastActivity || 0) > 60000) {
      s.lastActivity = Date.now();
      upsertSession(s);
    }
    return s;
  }

  // ── Core public API ────────────────────────────────────────────────────────
  function getSession()  { return validateSession(); }
  function isLoggedIn()  { return validateSession() !== null; }
  function isAdmin()     { const s = validateSession(); return !!(s && s.role === 'admin'); }

  // ── Login ──────────────────────────────────────────────────────────────────
  function login(username, password, remember) {
    if (!username || !password)
      return { success: false, error: 'Please enter your username and password.' };
    if (remember === undefined) remember = true;

    // Admin
    if (username.trim() === _AU && password === _AP) {
      createSession({ username: _AU, displayName: 'Administrator', role: 'admin' }, 'password', remember);
      return { success: true, role: 'admin' };
    }

    // Regular user
    const user = findUser(username.trim());
    if (!user || user.password !== password)
      return { success: false, error: 'Incorrect username or password.' };
    if (user.disabled)
      return { success: false, error: 'This account has been disabled. Contact an administrator.' };

    createSession(user, 'password', remember);
    return { success: true, role: user.role || 'user' };
  }

  // ── Register ───────────────────────────────────────────────────────────────
  function register(username, password, displayName) {
    username = (username || '').trim();
    if (username.length < 3)
      return { success: false, error: 'Username must be at least 3 characters.' };
    if ((password || '').length < 6)
      return { success: false, error: 'Password must be at least 6 characters.' };
    if (username.toLowerCase() === _AU.toLowerCase())
      return { success: false, error: 'Username not available.' };
    if (findUser(username))
      return { success: false, error: 'Username already taken. Please choose another.' };

    const users = getUsers();
    users.push({
      id:          Date.now(),
      username,
      password,
      displayName: (displayName || username).trim(),
      role:        'user',
      disabled:    false,
      createdAt:   new Date().toISOString(),
    });
    saveUsers(users);
    return login(username, password, true);
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  function logout() {
    const token = getToken();
    if (token) {
      const s = findSessionByToken(token);
      if (s) { s.revoked = true; s.revokedReason = 'logout'; upsertSession(s); }
      clearToken(token);
    }
    // Reload the same page — requireAuth() will show the gate since session is gone
    window.location.reload();
  }

  // ── OAuth (simulated for file:// / local dev) ──────────────────────────────
  /**
   * For production with HTTPS:
   *   Google:   Replace _showOAuthConsent with Google Identity Services SDK
   *             https://developers.google.com/identity/gsi/web/guides/overview
   *   Facebook: Replace with Facebook Login JS SDK
   *             https://developers.facebook.com/docs/facebook-login/web
   * createSession() call at the end stays identical.
   */
  function loginOAuth(provider) {
    return new Promise(resolve => {
      _showOAuthConsent(provider, profile => {
        if (!profile) { resolve({ success: false, error: 'Sign-in cancelled.' }); return; }

        const oauthId = provider.toLowerCase() + '_' + profile.email.replace(/[^a-z0-9]/gi, '_');
        const users   = getUsers();
        let user      = users.find(u => u.oauthId === oauthId);

        if (!user) {
          user = {
            id: Date.now(), username: oauthId,
            displayName: profile.name, email: profile.email,
            role: 'user', disabled: false,
            oauthId, oauthProvider: provider,
            createdAt: new Date().toISOString(),
          };
          users.push(user);
          saveUsers(users);
        }

        if (user.disabled) {
          resolve({ success: false, error: 'This account has been disabled.' });
          return;
        }

        createSession(user, provider.toLowerCase(), true);
        resolve({ success: true, role: 'user', displayName: user.displayName });
      });
    });
  }

  function _showOAuthConsent(provider, callback) {
    document.getElementById('_nep_oauth')?.remove();
    const color = provider === 'Google' ? '#4285F4' : '#1877F2';
    const G_ICON = `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`;
    const F_ICON = `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;

    const ov = document.createElement('div');
    ov.id = '_nep_oauth';
    ov.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);font-family:"DM Sans",sans-serif;';
    ov.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:36px 32px;width:100%;max-width:400px;color:#111;box-sizing:border-box;box-shadow:0 24px 80px rgba(0,0,0,0.6);">
        <div style="display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:20px;">
          ${provider === 'Google' ? G_ICON : F_ICON}
          <span style="font-size:1rem;font-weight:600;">Sign in with ${provider}</span>
        </div>
        <div style="background:#f5f5f5;border:1px solid #e0e0e0;border-radius:10px;padding:16px;margin-bottom:14px;">
          <div style="font-size:0.72rem;color:#666;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">${provider} Account</div>
          <input id="_oa_email" type="email" placeholder="${provider} email address" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:7px;font-size:0.88rem;margin-bottom:8px;outline:none;box-sizing:border-box;">
          <input id="_oa_name"  type="text"  placeholder="Your display name"       style="width:100%;padding:10px;border:1px solid #ddd;border-radius:7px;font-size:0.88rem;outline:none;box-sizing:border-box;">
        </div>
        <div style="background:#fffbea;border:1px solid #e5c200;border-radius:8px;padding:10px 13px;margin-bottom:16px;font-size:0.72rem;color:#7a5c00;line-height:1.5;">
          ℹ️ <strong>Dev mode</strong> — Real ${provider} OAuth requires HTTPS + server-side token exchange. See <code>auth.js</code> comments for production setup.
        </div>
        <div style="display:flex;gap:10px;">
          <button id="_oa_cancel" style="flex:1;padding:11px;border:1px solid #ddd;border-radius:30px;background:#fff;cursor:pointer;font-size:0.88rem;font-family:inherit;">Cancel</button>
          <button id="_oa_allow"  style="flex:1;padding:11px;border:none;border-radius:30px;background:${color};color:#fff;font-size:0.88rem;font-weight:600;cursor:pointer;font-family:inherit;">Allow</button>
        </div>
        <div id="_oa_err" style="color:#dc2626;font-size:0.78rem;text-align:center;margin-top:8px;min-height:18px;"></div>
      </div>`;
    document.body.appendChild(ov);

    ov.querySelector('#_oa_cancel').addEventListener('click', () => { ov.remove(); callback(null); });
    ov.querySelector('#_oa_allow').addEventListener('click', () => {
      const email = ov.querySelector('#_oa_email').value.trim();
      const name  = ov.querySelector('#_oa_name').value.trim();
      const err   = ov.querySelector('#_oa_err');
      if (!email || !email.includes('@')) { err.textContent = 'Please enter a valid email.'; return; }
      if (!name)  { err.textContent = 'Please enter your display name.'; return; }
      ov.remove();
      callback({ email, name });
    });
    ov.querySelector('#_oa_email').addEventListener('keydown', e => { if (e.key === 'Enter') ov.querySelector('#_oa_name').focus(); });
    ov.querySelector('#_oa_name').addEventListener('keydown',  e => { if (e.key === 'Enter') ov.querySelector('#_oa_allow').click(); });
    setTimeout(() => ov.querySelector('#_oa_email').focus(), 60);
  }

  // ── Admin API ──────────────────────────────────────────────────────────────
  function adminGetUsers()    { if (!isAdmin()) return []; return getUsers(); }
  function adminGetStats() {
    if (!isAdmin()) return null;
    const sessions = getAllSessions();
    const now      = Date.now();
    return {
      totalTracks:    safeJSON('nepCulture_tracks',     []).length,
      totalBooks:     safeJSON('nepCulture_literature', []).length,
      totalUsers:     getUsers().length,
      activeSessions: sessions.filter(s => !s.revoked && (!s.expiresAt || now < s.expiresAt)).length,
    };
  }

  function adminGetSessions() {
    if (!isAdmin()) return [];
    const now = Date.now();
    return getAllSessions().map(s => ({
      fullToken:    s.token,
      shortToken:   s.token.substring(0, 12) + '…',
      username:     s.username,
      displayName:  s.displayName,
      method:       s.method || 'password',
      loginTime:    new Date(s.loginTime).toLocaleString(),
      lastActivity: new Date(s.lastActivity || s.loginTime).toLocaleString(),
      expiresAt:    s.expiresAt ? new Date(s.expiresAt).toLocaleString() : 'Tab-only',
      active:       !s.revoked && (!s.expiresAt || now < s.expiresAt),
      revoked:      s.revoked,
      revokedReason: s.revokedReason || '',
      device:       (s.device || '').substring(0, 80),
    }));
  }

  function adminRevokeSession(fullToken) {
    if (!isAdmin()) return false;
    const sessions = getAllSessions();
    const s = sessions.find(x => x.token === fullToken);
    if (s) { s.revoked = true; s.revokedReason = 'admin_revoked'; }
    saveSessions(sessions); // ← save the SAME array we mutated
    clearToken(fullToken);
    return true;
  }

  function adminRevokeUserSessions(username) {
    if (!isAdmin()) return false;
    const sessions = getAllSessions(); // ← capture once
    sessions.forEach(s => {
      if (s.username === username && !s.revoked) {
        s.revoked = true; s.revokedReason = 'admin_kick';
      }
    });
    saveSessions(sessions); // ← save the mutated array
    // If the revoked user is in this browser, clear their token too
    const tok = getToken();
    if (tok) {
      const cur = findSessionByToken(tok);
      if (cur && cur.username === username) clearToken(tok);
    }
    return true;
  }

  function adminDisableUser(username) {
    if (!isAdmin()) return false;
    saveUsers(getUsers().map(u => u.username === username ? { ...u, disabled: true } : u));
    adminRevokeUserSessions(username);
    return true;
  }

  function adminEnableUser(username) {
    if (!isAdmin()) return false;
    saveUsers(getUsers().map(u => u.username === username ? { ...u, disabled: false } : u));
    return true;
  }

  // ── requireAuth — inline gate overlay, zero page navigations ──────────────
  /**
   * Call this once at the bottom of every protected page, after all scripts load.
   *
   * If the session is valid → returns true immediately; page is already rendered.
   * If no valid session   → injects a full-screen login gate over the page.
   *   After successful login, the gate calls window.location.reload() so the
   *   page re-initializes cleanly with the authenticated session.
   *   This reload is safe (same URL) and cannot cause a redirect loop.
   */
  function requireAuth() {
    migrateLegacy(); // migrate v1 sessions on first run
    if (isLoggedIn()) return true;
    // Inject gate — after DOM ready
    if (document.body) _injectGate();
    else document.addEventListener('DOMContentLoaded', _injectGate, { once: true });
    return false;
  }

  function _injectGate() {
    if (document.getElementById('_nauth_gate')) return;
    document.documentElement.style.overflow = 'hidden';

    const gate = document.createElement('div');
    gate.id = '_nauth_gate';
    gate.style.cssText = [
      'position:fixed;inset:0;z-index:99999',
      'background:linear-gradient(160deg,rgba(8,8,13,0.98) 0%,rgba(14,8,26,0.98) 100%)',
      'display:flex;align-items:center;justify-content:center',
      'font-family:"DM Sans",sans-serif',
      'backdrop-filter:blur(20px)',
    ].join(';');

    gate.innerHTML = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600&display=swap');
@keyframes gIn   {from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes gShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
@keyframes gSpin {to{transform:rotate(360deg)}}
#_nauth_gate *{box-sizing:border-box;margin:0;padding:0}
#_ng_card{
  background:rgba(16,16,22,0.97);
  border:1px solid rgba(218,165,32,0.2);
  border-radius:24px;
  padding:46px 42px 38px;
  width:100%;max-width:430px;
  box-shadow:0 40px 80px rgba(0,0,0,0.85),0 0 0 1px rgba(255,255,255,0.03);
  animation:gIn 0.32s cubic-bezier(0.22,1,0.36,1) both;
}
#_ng_logo{font-family:"Playfair Display",serif;font-size:1.9rem;color:#DAA520;text-align:center;letter-spacing:1.5px;margin-bottom:5px;}
#_ng_tagline{text-align:center;font-size:0.78rem;color:#3a3530;margin-bottom:30px;letter-spacing:0.3px;}
._ng_tabs{display:flex;border-bottom:1px solid rgba(255,255,255,0.07);margin-bottom:24px;}
._ng_tab{flex:1;background:none;border:none;color:#3a3530;font-size:0.87rem;padding:10px 0;cursor:pointer;border-bottom:2px solid transparent;transition:color 0.2s,border-color 0.2s;font-family:"DM Sans",sans-serif;font-weight:600;letter-spacing:0.2px;}
._ng_tab.on{color:#DAA520;border-bottom-color:#DAA520;}
._ng_tab:not(.on):hover{color:#7a6040;}
._ng_oa{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);color:#999;padding:11px 16px;border-radius:11px;font-size:0.86rem;font-family:"DM Sans",sans-serif;cursor:pointer;transition:all 0.18s;margin-bottom:9px;}
._ng_oa:hover{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.2);color:#ddd;transform:translateY(-1px);}
._ng_sep{display:flex;align-items:center;gap:12px;margin:16px 0;}
._ng_sep::before,._ng_sep::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.07);}
._ng_sep span{color:#252220;font-size:0.72rem;}
._ng_lbl{display:block;font-size:0.72rem;color:#4a4540;margin-bottom:5px;letter-spacing:0.6px;text-transform:uppercase;}
._ng_inp{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);color:#ede8e0;padding:12px 14px;border-radius:10px;outline:none;font-size:0.9rem;font-family:"DM Sans",sans-serif;transition:border-color 0.2s,background 0.2s;margin-bottom:14px;}
._ng_inp:focus{border-color:rgba(218,165,32,0.55);background:rgba(255,255,255,0.06);}
._ng_inp::placeholder{color:#252220;}
._ng_row{display:flex;align-items:center;gap:7px;margin-bottom:14px;cursor:pointer;}
._ng_row span{font-size:0.8rem;color:#3a3530;}
._ng_row input[type=checkbox]{accent-color:#DAA520;width:14px;height:14px;cursor:pointer;}
._ng_btn{width:100%;background:linear-gradient(135deg,#DC143C 0%,#9a001e 100%);color:#fff;border:none;padding:13px;border-radius:30px;font-size:0.92rem;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:"DM Sans",sans-serif;box-shadow:0 4px 22px rgba(220,20,60,0.3);letter-spacing:0.3px;}
._ng_btn:hover:not(:disabled){background:linear-gradient(135deg,#c01030 0%,#7a001a 100%);box-shadow:0 6px 28px rgba(220,20,60,0.45);transform:translateY(-1px);}
._ng_btn:disabled{opacity:0.5;cursor:wait;transform:none;}
._ng_btn.ok{background:linear-gradient(135deg,#16a34a,#0d7a30) !important;box-shadow:0 4px 22px rgba(22,163,74,0.3) !important;}
._ng_err{color:#f87171;font-size:0.78rem;text-align:center;margin-top:10px;min-height:18px;}
._ng_ok {color:#4ade80;font-size:0.78rem;text-align:center;margin-top:10px;min-height:18px;}
._ng_sp{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:gSpin 0.55s linear infinite;vertical-align:middle;margin-right:5px;}
.shk{animation:gShake 0.35s ease;}
</style>

<div id="_ng_card">
  <div id="_ng_logo">NepCulture</div>
  <div id="_ng_tagline">Your cultural workspace — sign in to continue</div>

  <div class="_ng_tabs">
    <button class="_ng_tab on" id="_t_in">Sign In</button>
    <button class="_ng_tab"    id="_t_up">Create Account</button>
  </div>

  <!-- SIGN IN PANEL -->
  <div id="_f_in">
    <button class="_ng_oa" id="_gg">
      <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      Continue with Google
    </button>
    <button class="_ng_oa" id="_fb">
      <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      Continue with Facebook
    </button>
    <div class="_ng_sep"><span>or sign in with username</span></div>
    <label class="_ng_lbl">Username</label>
    <input class="_ng_inp" id="_si_u" type="text"     placeholder="your username"  autocomplete="username">
    <label class="_ng_lbl">Password</label>
    <input class="_ng_inp" id="_si_p" type="password" placeholder="••••••••"       autocomplete="current-password" style="margin-bottom:10px;">
    <label class="_ng_row"><input type="checkbox" id="_si_rem" checked><span>Remember me for 30 days</span></label>
    <button class="_ng_btn" id="_si_btn">Sign In</button>
    <div class="_ng_err" id="_si_err"></div>
  </div>

  <!-- REGISTER PANEL -->
  <div id="_f_up" style="display:none;">
    <label class="_ng_lbl">Your Name</label>
    <input class="_ng_inp" id="_su_n"  type="text"     placeholder="Hari Prasad Sharma">
    <label class="_ng_lbl">Username</label>
    <input class="_ng_inp" id="_su_u"  type="text"     placeholder="choose a username"   autocomplete="username">
    <label class="_ng_lbl">Password</label>
    <input class="_ng_inp" id="_su_p"  type="password" placeholder="min 6 characters"    autocomplete="new-password">
    <label class="_ng_lbl">Confirm Password</label>
    <input class="_ng_inp" id="_su_p2" type="password" placeholder="repeat password"     autocomplete="new-password" style="margin-bottom:10px;">
    <button class="_ng_btn" id="_su_btn">Create Account</button>
    <div class="_ng_err" id="_su_err"></div>
    <div class="_ng_ok"  id="_su_ok"></div>
  </div>
</div>`;

    document.body.appendChild(gate);

    // ─ After successful login: RELOAD the page (same URL, no redirect risk).
    //   The page re-initializes cleanly with the authenticated session.
    function dismissAndReload(delayMs) {
      const btn = gate.querySelector('button._ng_btn.ok') || gate.querySelector('#_si_btn') || gate.querySelector('#_su_btn');
      if (btn) { btn.innerHTML = '✓ Signed in — loading…'; btn.className += ' ok'; btn.disabled = true; }
      setTimeout(() => {
        document.documentElement.style.overflow = '';
        window.location.reload();
      }, delayMs || 600);
    }

    function shake() {
      const c = gate.querySelector('#_ng_card');
      c.classList.remove('shk');
      void c.offsetWidth;
      c.classList.add('shk');
    }

    function setLoading(btn, on) {
      if (on) {
        btn._t = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="_ng_sp"></span>Signing in…';
      } else {
        btn.disabled = false;
        btn.innerHTML = btn._t || btn.innerHTML;
      }
    }

    // Tab switching
    const tI = gate.querySelector('#_t_in'), tU = gate.querySelector('#_t_up');
    const fI = gate.querySelector('#_f_in'), fU = gate.querySelector('#_f_up');
    tI.addEventListener('click', () => { tI.classList.add('on'); tU.classList.remove('on'); fI.style.display=''; fU.style.display='none'; });
    tU.addEventListener('click', () => { tU.classList.add('on'); tI.classList.remove('on'); fU.style.display=''; fI.style.display='none'; });

    // OAuth
    gate.querySelector('#_gg').addEventListener('click', () => {
      loginOAuth('Google').then(r => r.success ? dismissAndReload(600) : (gate.querySelector('#_si_err').textContent = r.error));
    });
    gate.querySelector('#_fb').addEventListener('click', () => {
      loginOAuth('Facebook').then(r => r.success ? dismissAndReload(600) : (gate.querySelector('#_si_err').textContent = r.error));
    });

    // Sign In
    function doSignIn() {
      const u   = gate.querySelector('#_si_u').value.trim();
      const p   = gate.querySelector('#_si_p').value;
      const rem = gate.querySelector('#_si_rem').checked;
      const err = gate.querySelector('#_si_err');
      const btn = gate.querySelector('#_si_btn');
      err.textContent = '';
      setLoading(btn, true);
      setTimeout(() => {
        const r = login(u, p, rem);
        if (r.success) {
          dismissAndReload(500);
        } else {
          setLoading(btn, false);
          err.textContent = r.error;
          shake();
        }
      }, 320);
    }

    gate.querySelector('#_si_btn').addEventListener('click', doSignIn);
    gate.querySelector('#_si_p').addEventListener('keydown', e => { if (e.key === 'Enter') doSignIn(); });
    gate.querySelector('#_si_u').addEventListener('keydown', e => { if (e.key === 'Enter') gate.querySelector('#_si_p').focus(); });

    // Register
    function doRegister() {
      const n   = gate.querySelector('#_su_n').value.trim();
      const u   = gate.querySelector('#_su_u').value.trim();
      const p   = gate.querySelector('#_su_p').value;
      const p2  = gate.querySelector('#_su_p2').value;
      const err = gate.querySelector('#_su_err');
      const ok  = gate.querySelector('#_su_ok');
      const btn = gate.querySelector('#_su_btn');
      err.textContent = ''; ok.textContent = '';
      if (p !== p2) { err.textContent = 'Passwords do not match.'; shake(); return; }
      setLoading(btn, true);
      setTimeout(() => {
        const r = register(u, p, n);
        if (r.success) {
          ok.textContent = '✓ Account created — welcome to NepCulture! 🎉';
          dismissAndReload(1000);
        } else {
          setLoading(btn, false);
          err.textContent = r.error;
          shake();
        }
      }, 380);
    }

    gate.querySelector('#_su_btn').addEventListener('click', doRegister);
    gate.querySelector('#_su_p2').addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });

    setTimeout(() => gate.querySelector('#_si_u').focus(), 80);
  }

  // ── Expose public API ──────────────────────────────────────────────────────
  window.NepAuth = {
    // Core session checks (use these in every protected page)
    requireAuth,
    isLoggedIn,
    isAdmin,
    getSession,
    // Auth actions
    login,
    register,
    loginOAuth,
    logout,
    // Admin-only actions
    getUsers:           adminGetUsers,
    getSessions:        adminGetSessions,
    revokeSession:      adminRevokeSession,
    revokeUserSessions: adminRevokeUserSessions,
    disableUser:        adminDisableUser,
    enableUser:         adminEnableUser,
    getStats:           adminGetStats,
  };

  console.info('[NepCulture] auth.js v3 — persistent token sessions. Sign in once, stay in.');
})();

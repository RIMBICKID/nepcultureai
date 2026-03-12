/**
 * NepCulture — collections.js  (My Identity / My Favorites page)
 * BUG FIX: properly reads favorites from nepCulture_tracks AND nepCulture_literature.
 * Features: tab filtering, sort, batch remove, tag/note editing, export/import,
 * offline simulation, Play button for music items.
 * Depends on main.js (db, showToast, exportJSON, debounce).
 */

(function () {
  'use strict';

  // ─── DOM ────────────────────────────────────────────────────────────────────
  const vaultGrid     = document.getElementById('vault-grid');
  const totalItemsEl  = document.getElementById('total-items');
  const tabBtns       = document.querySelectorAll('.tab-btn');
  const playbackBar   = document.getElementById('playback-bar');
  const playbackLabel = document.getElementById('playback-label');
  const playbackStop  = document.getElementById('playback-stop');

  // ─── State ──────────────────────────────────────────────────────────────────
  let activeTab    = 'all';
  let sortMode     = 'recent';
  let selectedIds  = new Set();
  let playingId    = null;
  let playingAudio = null;

  // ─── DEBUG HELPER — logs stored data ────────────────────────────────────────
  function debugFavorites() {
    const tracks = db.get('nepCulture_tracks');
    const books  = db.get('nepCulture_literature');
    console.log('[NepCulture] All tracks:', tracks.length, '| Favorited:', tracks.filter(t=>t.favorite).length);
    console.log('[NepCulture] All books:', books.length,  '| Favorited:', books.filter(b=>b.favorite).length);
  }

  // ─── Tab navigation ──────────────────────────────────────────────────────────
  tabBtns.forEach(btn => {
    if (!btn.dataset.tab) return;
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected','true');
      activeTab = btn.dataset.tab;
      selectedIds.clear();
      renderVault();
    });
  });

  // ─── Playback ────────────────────────────────────────────────────────────────
  if (playbackStop) playbackStop.addEventListener('click', stopPlayback);

  function stopPlayback() {
    if (playingAudio) { playingAudio.pause(); playingAudio.src = ''; playingAudio = null; }
    playingId = null;
    if (playbackBar) playbackBar.classList.remove('visible');
    renderVault();
  }

  function playTrack(track) {
    if (playingAudio) { playingAudio.pause(); playingAudio.src = ''; }
    if (playingId === track.id) { stopPlayback(); return; }
    playingId = track.id;
    playingAudio = new Audio(track.file);
    playingAudio.play().catch(() => showToast('Audio file not found. Add MP3s to assets/audio/.','crimson'));
    playingAudio.addEventListener('ended', () => stopPlayback());
    if (playbackLabel) playbackLabel.innerText = `Now Playing: ${track.title}`;
    if (playbackBar) playbackBar.classList.add('visible');
    renderVault();
  }

  // ─── Build toolbar ────────────────────────────────────────────────────────────
  function buildToolbar() {
    const existing = document.getElementById('vault-toolbar');
    if (existing) existing.remove();

    const toolbar = document.createElement('div');
    toolbar.id = 'vault-toolbar';
    toolbar.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:24px;';
    toolbar.innerHTML = `
      <select id="sort-select" class="style-input" style="padding:8px 14px;border-radius:20px;font-size:0.85rem;width:auto;cursor:pointer;" aria-label="Sort favorites">
        <option value="recent">Recently Added</option>
        <option value="alpha">Alphabetical</option>
        <option value="type">By Type</option>
      </select>
      <button id="batch-remove-btn" class="btn-outline" style="font-size:0.85rem;padding:8px 16px;border-radius:20px;display:none;" aria-label="Remove selected">
        🗑 Remove Selected (<span id="sel-count">0</span>)
      </button>
      <button id="export-btn" class="btn-outline" style="font-size:0.85rem;padding:8px 16px;border-radius:20px;" aria-label="Export">⬇ Export JSON</button>
      <label for="import-file" class="btn-outline" style="font-size:0.85rem;padding:8px 16px;border-radius:20px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
        ⬆ Import JSON
        <input type="file" id="import-file" accept=".json" style="display:none;" aria-hidden="true">
      </label>
    `;
    if (vaultGrid && vaultGrid.parentNode) {
      vaultGrid.parentNode.insertBefore(toolbar, vaultGrid);
    }

    toolbar.querySelector('#sort-select').addEventListener('change', (e) => {
      sortMode = e.target.value; renderVault();
    });

    toolbar.querySelector('#batch-remove-btn').addEventListener('click', () => {
      if (selectedIds.size === 0) return;
      const count = selectedIds.size;
      selectedIds.forEach(id => {
        db.update('nepCulture_tracks', id, { favorite: false });
        db.update('nepCulture_literature', id, { favorite: false });
      });
      selectedIds.clear();
      showToast(`Removed ${count} item(s) from favorites.`, 'crimson');
      renderVault();
    });

    toolbar.querySelector('#export-btn').addEventListener('click', () => {
      const allFavs = getFavorites('all');
      if (allFavs.length === 0) { showToast('No favorites to export.','crimson'); return; }
      exportJSON(allFavs, 'nepculture_favorites.json');
      showToast(`Exported ${allFavs.length} favorites.`);
    });

    toolbar.querySelector('#import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (!Array.isArray(imported)) throw new Error('Not an array');
          let added = 0;
          imported.forEach(item => {
            // Determine correct storage key from item type
            const isMusic = item.type === 'Music' || item.type === 'music';
            const key = isMusic ? 'nepCulture_tracks' : 'nepCulture_literature';
            const existing = db.get(key);
            if (!existing.some(ex => ex.id === item.id)) {
              item.favorite = true;
              db.add(key, item);
              added++;
            }
          });
          showToast(`Imported ${added} new item(s). ${imported.length - added} duplicate(s) skipped.`);
          renderVault();
        } catch {
          showToast('Invalid JSON file.', 'crimson');
        }
        e.target.value = '';
      };
      reader.readAsText(file);
    });
  }

  // ─── Get favorites — FIXED to read correct keys ───────────────────────────
  /**
   * CRITICAL FIX: reads nepCulture_tracks for music and nepCulture_literature
   * for books. Both use favorite:true to mark favorites.
   * The type field on tracks is 'Music', on literature is 'Literature'.
   */
  function getFavorites(tab) {
    // Read raw arrays
    const allTracks = db.get('nepCulture_tracks');
    const allBooks  = db.get('nepCulture_literature');

    // Filter to favorited items only
    const favTracks = allTracks.filter(t => t.favorite === true);
    const favBooks  = allBooks.filter(b => b.favorite === true);

    // Ensure type field is set correctly (backwards-compat)
    favTracks.forEach(t => { if (!t.type) t.type = 'Music'; });
    favBooks.forEach(b => { if (!b.type) b.type = 'Literature'; });

    if (tab === 'music')     return favTracks;
    if (tab === 'books')     return favBooks;
    if (tab === 'playlists') return buildQuickAccess([...favTracks, ...favBooks]);
    return [...favTracks, ...favBooks];
  }

  function buildQuickAccess(items) {
    return [...items].sort((a, b) => {
      const aId = typeof a.id === 'number' ? a.id : new Date(a.savedDate || 0).getTime();
      const bId = typeof b.id === 'number' ? b.id : new Date(b.savedDate || 0).getTime();
      return bId - aId;
    }).slice(0, 5);
  }

  function sortItems(items) {
    if (sortMode === 'alpha') return [...items].sort((a,b) => (a.title||'').localeCompare(b.title||''));
    if (sortMode === 'type')  return [...items].sort((a,b) => (a.type||'').localeCompare(b.type||''));
    // 'recent' — sort by id (numeric timestamp) descending
    return [...items].sort((a,b) => {
      const aVal = typeof a.id === 'number' ? a.id : 0;
      const bVal = typeof b.id === 'number' ? b.id : 0;
      return bVal - aVal;
    });
  }

  // ─── Render vault ─────────────────────────────────────────────────────────────
  function renderVault() {
    if (!vaultGrid) return;
    debugFavorites();

    const allFavs = getFavorites(activeTab);
    const items   = sortItems(allFavs);

    // Update total count badge
    if (totalItemsEl) totalItemsEl.innerText = getFavorites('all').length;

    vaultGrid.innerHTML = '';

    // Update batch button
    const batchBtn = document.getElementById('batch-remove-btn');
    if (batchBtn) {
      const selCount = document.getElementById('sel-count');
      batchBtn.style.display = selectedIds.size > 0 ? 'inline-flex' : 'none';
      if (selCount) selCount.innerText = selectedIds.size;
    }

    if (items.length === 0) {
      const emptyMessages = {
        all:       { icon: '📭', title: 'No Favorites Yet', msg: 'Heart ❤️ tracks in the Studio or save books in the Library.' },
        music:     { icon: '🎵', title: 'No Music Favorites', msg: 'Heart ❤️ tracks in the Studio to see them here.' },
        books:     { icon: '📚', title: 'No Book Favorites', msg: 'Save books in the Library and ❤️ them to see them here.' },
        playlists: { icon: '⚡', title: 'No Quick Access Yet', msg: 'Heart ❤️ some tracks or books — the 5 most recent will appear here.' },
      };
      const e = emptyMessages[activeTab] || emptyMessages.all;
      vaultGrid.innerHTML = `
        <div class="empty-state" role="status" style="grid-column:1/-1;">
          <div style="font-size:3rem;margin-bottom:10px;">${e.icon}</div>
          <h3>${e.title}</h3>
          <p style="margin-top:10px;color:var(--text-muted);">${e.msg}</p>
          <a href="index.html" class="btn-primary" style="display:inline-block;margin-top:20px;text-decoration:none;">Explore Hub</a>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const isMusic    = (item.type === 'Music' || item.type === 'music');
      const isSelected = selectedIds.has(item.id);
      const isPlaying  = playingId === item.id;

      const card = document.createElement('div');
      card.className = 'vault-card';
      card.setAttribute('tabindex','0');
      card.setAttribute('role','article');
      card.setAttribute('aria-label', item.title || 'Favorite item');
      if (isSelected) card.classList.add('vault-card--selected');

      // Build metadata line
      const metaLine = isMusic
        ? `${item.genre || ''}${item.mood ? ' · '+item.mood : ''}${item.tempo ? ' · '+item.tempo+'BPM' : ''}`
        : `by ${escHtml(item.author || '')}${item.year ? ' · '+item.year : ''}`;

      card.innerHTML = `
        <div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
            <div class="tag ${isMusic ? 'music' : 'literature'}">${item.type || 'Item'}</div>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.8rem;color:var(--text-muted);">
              <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${isSelected?'checked':''} aria-label="Select ${escHtml(item.title||'')}">
              Select
            </label>
          </div>
          <h3 class="serif" style="margin-bottom:5px;font-size:1.2rem;">${escHtml(item.title||'Untitled')}</h3>
          <p style="color:var(--text-muted);font-size:0.82rem;margin-bottom:8px;">${metaLine}</p>
          ${item.offline ? '<span class="offline-badge" aria-label="Available offline">📴 Offline</span>' : ''}
          ${item.tags && item.tags.length
            ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;">${item.tags.map(t=>`<span class="tag" style="background:rgba(110,0,255,0.15);border-color:var(--accent-1);color:var(--accent-1);">${escHtml(t)}</span>`).join('')}</div>`
            : ''}
          ${item.note ? `<p style="font-size:0.8rem;color:#aaa;font-style:italic;margin-bottom:8px;">"${escHtml(item.note)}"</p>` : ''}
        </div>
        <div style="margin-top:16px;">
          <!-- Tag + Note editor -->
          <div class="tag-editor" style="display:none;margin-bottom:12px;">
            <input type="text" class="tag-input style-input" placeholder="#tag" style="padding:8px;border-radius:8px;font-size:0.8rem;margin-bottom:6px;" aria-label="Add tag">
            <textarea class="note-input style-input" placeholder="Add a note…" rows="2" style="padding:8px;border-radius:8px;font-size:0.8rem;resize:none;" aria-label="Add note"></textarea>
            <button class="btn-primary save-meta-btn" style="width:100%;margin-top:8px;padding:8px;border-radius:20px;font-size:0.8rem;">Save</button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${isMusic ? `
              <button class="btn-outline play-btn" style="flex:1;font-size:0.8rem;padding:8px 0;border-radius:20px;${isPlaying?'background:var(--accent-1);color:white;border-color:var(--accent-1);':''}" aria-label="${isPlaying?'Stop':'Play'} ${escHtml(item.title||'')}">
                ${isPlaying ? '⏸ Playing' : '▶ Play'}
              </button>` : ''}
            <button class="btn-outline toggle-editor-btn" style="flex:1;font-size:0.8rem;padding:8px 0;border-radius:20px;" aria-label="Edit tags">✏️ Tag</button>
            <button class="btn-outline unfav-btn" style="flex:1;font-size:0.8rem;padding:8px 0;border-radius:20px;border-color:var(--crimson);color:var(--crimson);" aria-label="Remove from favorites">🗑 Remove</button>
          </div>
          <button class="btn-outline offline-btn" style="width:100%;margin-top:8px;font-size:0.8rem;padding:8px 0;border-radius:20px;${item.offline?'opacity:0.4;cursor:default;':''}"
            ${item.offline?'disabled':''} aria-label="Make available offline">
            ${item.offline ? '✓ Offline Ready' : '📴 Make Offline (demo)'}
          </button>
        </div>
      `;

      // Checkbox toggle
      const checkbox = card.querySelector('.item-checkbox');
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) { selectedIds.add(item.id); card.classList.add('vault-card--selected'); }
        else { selectedIds.delete(item.id); card.classList.remove('vault-card--selected'); }
        const bBtn = document.getElementById('batch-remove-btn');
        const sCnt = document.getElementById('sel-count');
        if (bBtn) bBtn.style.display = selectedIds.size > 0 ? 'inline-flex' : 'none';
        if (sCnt) sCnt.innerText = selectedIds.size;
      });

      // Play button (music only)
      const playBtn = card.querySelector('.play-btn');
      if (playBtn) playBtn.addEventListener('click', () => playTrack(item));

      // Tag/note editor toggle
      const editorDiv = card.querySelector('.tag-editor');
      card.querySelector('.toggle-editor-btn').addEventListener('click', () => {
        const open = editorDiv.style.display === 'block';
        editorDiv.style.display = open ? 'none' : 'block';
        if (!open && item.tags)  card.querySelector('.tag-input').value  = item.tags.join(' ');
        if (!open && item.note)  card.querySelector('.note-input').value = item.note;
      });

      // Save tag + note
      card.querySelector('.save-meta-btn').addEventListener('click', () => {
        const rawTags = card.querySelector('.tag-input').value.trim();
        const note    = card.querySelector('.note-input').value.trim();
        const tags    = rawTags ? rawTags.split(/\s+/).map(t => t.startsWith('#') ? t : '#'+t) : [];
        const key     = isMusic ? 'nepCulture_tracks' : 'nepCulture_literature';
        db.update(key, item.id, { tags, note });
        editorDiv.style.display = 'none';
        showToast('Tag & note saved. ✓');
        renderVault();
      });

      // Remove from favorites — FIXED: uses correct key per item type
      card.querySelector('.unfav-btn').addEventListener('click', () => {
        if (isMusic && playingId === item.id) stopPlayback();
        const key = isMusic ? 'nepCulture_tracks' : 'nepCulture_literature';
        card.classList.add('fade-out');
        setTimeout(() => {
          db.update(key, item.id, { favorite: false });
          selectedIds.delete(item.id);
          showToast(`"${item.title}" removed from Favorites.`, 'crimson');
          renderVault();
        }, 340);
      });

      // Offline simulation
      const offlineBtn = card.querySelector('.offline-btn');
      if (offlineBtn && !item.offline) {
        offlineBtn.addEventListener('click', () => {
          const key = isMusic ? 'nepCulture_tracks' : 'nepCulture_literature';
          db.update(key, item.id, { offline: true });
          showToast('Marked as offline ✓', 'purple');
          renderVault();
        });
      }

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') card.querySelector('.unfav-btn')?.focus();
      });

      vaultGrid.appendChild(card);
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    buildToolbar();
    renderVault();
  }

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();

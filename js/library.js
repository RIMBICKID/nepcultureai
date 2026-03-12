/**
 * NepCulture — library.js
 * Cultural library: 22 books, real-time search, view-details modal,
 * and a doctoral-level AI cultural guide chatbot with deep keyword detection.
 * Depends on main.js (db, showToast, debounce).
 */

(function () {
  'use strict';

  // ─── Archive data — 22 books ─────────────────────────────────────────────────
  const ARCHIVES = [
    // POETRY
    {
      id:'book_001',title:'Muna Madan',author:'Laxmi Prasad Devkota',icon:'📖',year:'1936',
      era:'Modern',genre:'Poetry',rating:'★★★★★',theme:'Love, Migration, Caste',
      summary:'Nepal\'s most beloved poem in the melodic Jhyaure folk meter. Madan leaves wife Muna for wealth in Lhasa, falls ill, and is rescued by a low-caste Newari man — a devastating critique of caste hierarchy wrapped in lyric beauty. Devkota\'s masterwork changed Nepali literature forever.'
    },
    {
      id:'book_002',title:'Bhrikuti',author:'Laxmi Prasad Devkota',icon:'👑',year:'1944',
      era:'Modern',genre:'Poetry',rating:'★★★★☆',theme:'Diplomacy, Buddhism, Womanhood',
      summary:'An epic poem celebrating the Nepali princess Bhrikuti who became queen of Tibet and is credited with bringing Buddhism there. Devkota portrays her as an emblem of cultural diplomacy, feminine strength, and the transformative power of compassion across the Himalayas.'
    },
    {
      id:'book_003',title:'Shakuntala',author:'Laxmi Prasad Devkota',icon:'🌺',year:'1945',
      era:'Modern',genre:'Poetry',rating:'★★★★★',theme:'Romantic Love, Nature, Classical Heritage',
      summary:'A free verse epic retelling the Sanskrit Shakuntala legend with Devkota\'s signature Romanticism. Widely considered his greatest verse drama, it merges classical Indian tradition with modern Nepali sensibility, vivid natural imagery, and an emotional directness unprecedented in Nepali poetry.'
    },
    {
      id:'book_004',title:'Ramayana (Nepali)',author:'Bhanubhakta Acharya',icon:'⚔️',year:'1887',
      era:'Classical',genre:'Poetry',rating:'★★★★★',theme:'Epic, Dharma, Democratization',
      summary:'The first translation of the Ramayana into conversational Nepali vernacular — making the epic accessible to ordinary people for the first time. Bhanubhakta Acharya is honored as Aadikavi (First Poet) of Nepali literature for this transformative democratization of sacred knowledge.'
    },
    {
      id:'book_005',title:'Ritubihar',author:'Lekhnath Paudyal',icon:'🌸',year:'1916',
      era:'Modern',genre:'Poetry',rating:'★★★★☆',theme:'Nature, Seasons, Spirituality',
      summary:'A landmark poetry collection describing Nepal\'s six seasons through Sanskrit meters adapted for Nepali. Lekhnath Paudyal is the first modern Nepali poet to systematically apply Sanskrit prosody to a contemporary Nepali context, establishing a bridge between classical and modern literary traditions.'
    },
    {
      id:'book_006',title:'Premi ra Premi',author:'Gopal Prasad Rimal',icon:'💌',year:'1955',
      era:'Modern',genre:'Poetry',rating:'★★★★☆',theme:'Revolution, Love, Social Change',
      summary:'Rimal introduced free verse and political consciousness to Nepali poetry. This collection combines romantic longing with sharp social critique, addressing the awakening of democratic aspirations against Rana-era Nepal — poetry as both love letter and revolutionary manifesto simultaneously.'
    },
    // FICTION
    {
      id:'book_007',title:'Shirishko Phool',author:'Parijat',icon:'🌸',year:'1964',
      era:'Modern',genre:'Fiction',rating:'★★★★★',theme:'Existentialism, War, Solitude',
      summary:'Nepal\'s first existentialist novel, following war veteran Suyogbir\'s descent into nihilism. Written by a woman in 1964 Nepal, it was doubly transgressive — the philosophy was radical, the authorship scandalous. Parijat won Nepal\'s highest literary honor. Influenced by Camus yet rooted entirely in Nepali social reality.'
    },
    {
      id:'book_008',title:'Palpasa Cafe',author:'Narayan Wagle',icon:'☕',year:'2005',
      era:'Conflict Era',genre:'Fiction',rating:'★★★★★',theme:'Civil War, Love, Art',
      summary:'The first major Nepali novel engaging the Maoist insurgency (1996–2006) while the conflict was still ongoing. Self-published because no publisher dared touch it, it sold 100,000+ copies — extraordinary for Nepal. A painter and Palpasa fall in love across a fractured, beautiful country at war.'
    },
    {
      id:'book_009',title:'Karnali Blues',author:'Buddhisagar',icon:'🌊',year:'2010',
      era:'Contemporary',genre:'Fiction',rating:'★★★★★',theme:'Father-Son, Memory, Loss',
      summary:'A son reconstructs his father\'s life — a barefoot journey from remote Karnali to Kathmandu. Deceptively simple prose making its emotional depth devastating. A national bestseller that brought unprecedented literary attention to the historically neglected Karnali region and its communities.'
    },
    {
      id:'book_010',title:'Basai',author:'Lil Bahadur Chettri',icon:'🏕️',year:'1958',
      era:'Modern',genre:'Fiction',rating:'★★★★★',theme:'Migration, Village Life, Loss',
      summary:'Widely considered the finest Nepali novel of the 20th century. Set in a Kirati village facing displacement, it chronicles migration from ancestral land with extraordinary psychological depth. The word "basai" means migration — and the book defines a national trauma still resonating today.'
    },
    {
      id:'book_011',title:'Sumnima',author:'BP Koirala',icon:'🌙',year:'1984',
      era:'Modern',genre:'Fiction',rating:'★★★★★',theme:'Sexuality, Mythology, Freedom',
      summary:'Written in exile by Nepal\'s first democratically elected Prime Minister, this avant-garde novel retells a Kirant myth with frank explorations of sexuality and spiritual freedom unprecedented in Nepali literature. A radical text from a political leader — its courage remains unmatched.'
    },
    {
      id:'book_012',title:'Teen Ghumti',author:'BP Koirala',icon:'🔺',year:'1968',
      era:'Modern',genre:'Fiction',rating:'★★★★☆',theme:'Social Critique, Women, Society',
      summary:'BP Koirala\'s most accessible novel follows three women at crossroads in Kathmandu society — a sharp examination of patriarchy and the price women pay for independence. Groundbreaking for its nuanced portrayal of female interiority and desire in 1960s Nepal.'
    },
    {
      id:'book_013',title:'Seto Dharti',author:'Amar Neupane',icon:'🌿',year:'2012',
      era:'Contemporary',genre:'Fiction',rating:'★★★★☆',theme:'Rural Life, Identity',
      summary:'A celebrated contemporary novel exploring rural identity and the quiet struggles of people living at the margins of a rapidly urbanizing Nepal. Neupane writes with compassionate precision about the invisible lives the development narrative erases — a morally necessary counter-narrative.'
    },
    {
      id:'book_014',title:'Naso',author:'Banira Giri',icon:'🧶',year:'1993',
      era:'Contemporary',genre:'Fiction',rating:'★★★★☆',theme:'Womanhood, Identity, Society',
      summary:'A pioneering feminist Nepali novel exploring the interiority of women\'s experience in a patriarchal society. Banira Giri writes with lyrical precision about the silent negotiations women make daily — one of the most important contributions to Nepali women\'s literature in the late 20th century.'
    },
    // HISTORICAL ARCHIVES
    {
      id:'book_015',title:'The Gorkha Unification',author:'Historical Archives',icon:'🏰',year:'1768',
      era:'Unification',genre:'Historical Archives',rating:'★★★★★',theme:'Nation-building, Warfare, Identity',
      summary:'Chronicles the unification of Nepal under Prithvi Narayan Shah — military campaigns, diplomatic maneuvers, and the forging of a national identity from 52 competing kingdoms. The foundational text of Nepali political consciousness and the origin story of the modern nation-state.'
    },
    {
      id:'book_016',title:'Divya Upadesh',author:'Prithvi Narayan Shah',icon:'📜',year:'1774',
      era:'Unification',genre:'Historical Archives',rating:'★★★★★',theme:'Governance, Strategy, National Identity',
      summary:'The "Divine Counsel" — Nepal\'s founder\'s political testament. Describes Nepal as "a yam between two boulders" (India and China) and outlines principles of governance, foreign policy, and cultural preservation that remain remarkably prescient 250 years later. Required reading for understanding Nepali strategic culture.'
    },
    {
      id:'book_017',title:'Nepal Ko Itihas',author:'Baburam Acharya',icon:'📚',year:'1967',
      era:'Modern',genre:'Historical Archives',rating:'★★★★★',theme:'History, Scholarship, Nation',
      summary:'The definitive scholarly history of Nepal, compiled by the country\'s greatest historian over decades of meticulous research. Baburam Acharya reconstructed Nepal\'s ancient and medieval past from inscriptions, chronicles, and oral tradition — creating the foundational framework of Nepali historiography.'
    },
    {
      id:'book_018',title:'Rana Court Chronicles',author:'Historical Archives',icon:'👑',year:'1847',
      era:'Rana Period',genre:'Historical Archives',rating:'★★★★☆',theme:'Power, Architecture, Oligarchy',
      summary:'Documents the century of Rana rule (1846–1951) through court records, diplomatic correspondence, and palace construction accounts. Essential for understanding the European-influenced architecture, the closed-border policy, and the paradox of cultural stagnation and preservation occurring simultaneously.'
    },
    // FOLKLORE
    {
      id:'book_019',title:'Nepali Folk Tales',author:'Collected Oral Tradition',icon:'🧚',year:'Pre-1900',
      era:'Ancient/Oral',genre:'Folklore',rating:'★★★★☆',theme:'Morality, Magic, Community',
      summary:'Nepal\'s vast oral literature spans over 100 ethnic communities, each with distinct narrative traditions. These collected tales — featuring trickster figures, divine interventions, and moral reversals — encode the ethical and cosmological worldview of communities across hills, mountains, and plains.'
    },
    {
      id:'book_020',title:'Teej Songs (Teej Geet)',author:'Women\'s Oral Tradition',icon:'🎵',year:'Ancient',
      era:'Ancient/Oral',genre:'Folklore',rating:'★★★★★',theme:'Women, Devotion, Social Commentary',
      summary:'One of Nepal\'s most extraordinary literary traditions — women gathering to sing compositions that simultaneously express devotion and communicate grievances about patriarchal life. A subversive oral literature operating within religious form, composed collectively and passed through generations exclusively among women.'
    },
    {
      id:'book_021',title:'Deuda Songs of Far West Nepal',author:'Far West Folk Tradition',icon:'🎶',year:'Ancient',
      era:'Ancient/Oral',genre:'Folklore',rating:'★★★★☆',theme:'Dance, Community, Improvisation',
      summary:'The Deuda tradition of Nepal\'s Far Western hills involves communal circular dancing and improvised song during festivals. Participants create verses in response to each other in a tradition of poetic improvisation that has sustained community bonds for centuries in Nepal\'s most remote and historically neglected region.'
    },
    {
      id:'book_022',title:'Jhankri Spirit Narratives',author:'Shamanic Oral Tradition',icon:'🌀',year:'Ancient',
      era:'Ancient/Oral',genre:'Folklore',rating:'★★★★☆',theme:'Shamanism, Spirit, Healing',
      summary:'The narratives of Nepal\'s jhankri (shamanic healers) represent a pre-Hindu cosmological system still practiced across hills and mountains. These oral texts describe spirit worlds, healing journeys, and the geography of the supernatural — an indigenous philosophical tradition predating recorded history in the region.'
    },
  ];

  // ─── DOM references ──────────────────────────────────────────────────────────
  const bookGrid    = document.getElementById('book-grid');
  const searchInput = document.getElementById('search-input');
  const resultCount = document.getElementById('result-count');
  const chatBody    = document.getElementById('chat-body');
  const typingEl    = document.getElementById('typing-indicator');

  // ─── Render books ────────────────────────────────────────────────────────────
  function renderBooks(data) {
    if (!bookGrid) return;
    bookGrid.innerHTML = '';
    if (resultCount) resultCount.innerText = `Showing ${data.length} works`;

    data.forEach(book => {
      const saved   = db.get('nepCulture_literature');
      const isSaved = saved.some(s => s.id === book.id);

      const card = document.createElement('div');
      card.className = 'book-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `View details: ${book.title}`);

      card.innerHTML = `
        <div class="cover" aria-hidden="true">${book.icon}</div>
        <h4 style="margin-bottom:4px;font-size:0.88rem;">${escHtml(book.title)}</h4>
        <span style="font-size:0.75rem;color:#888;">${escHtml(book.author)}</span>
        <span style="font-size:0.68rem;color:#666;display:block;margin-top:2px;">${escHtml(book.year)} · ${escHtml(book.genre)}</span>
        <div class="book-overlay" role="region" aria-label="Book details">
          <p><strong>Year:</strong> ${escHtml(book.year)}</p>
          <p><strong>Era:</strong> ${escHtml(book.era)}</p>
          <p><strong>Theme:</strong> ${escHtml(book.theme)}</p>
          <p style="margin-top:6px;">Impact: ${book.rating}</p>
          <button class="btn-outline save-btn"
            style="margin-top:12px;font-size:0.72rem;padding:5px 14px;"
            data-id="${book.id}"
            ${isSaved ? 'disabled aria-disabled="true"' : ''}
            aria-label="${isSaved ? 'Already in archive' : 'Save to archive'}">
            ${isSaved ? '✓ In Archive' : 'Save to Archive'}
          </button>
          <button class="btn-outline view-detail-btn"
            style="margin-top:6px;font-size:0.72rem;padding:5px 14px;border-color:var(--accent-1);color:var(--accent-1);"
            data-id="${book.id}"
            aria-label="View full details for ${book.title}">
            View Details
          </button>
        </div>
      `;

      const saveBtn = card.querySelector('.save-btn');
      if (saveBtn && !isSaved) {
        saveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          saveBook(book);
          saveBtn.disabled = true;
          saveBtn.setAttribute('aria-disabled','true');
          saveBtn.innerText = '✓ In Archive';
        });
      }
      const detailBtn = card.querySelector('.view-detail-btn');
      if (detailBtn) {
        detailBtn.addEventListener('click', (e) => { e.stopPropagation(); openBookModal(book); });
      }
      card.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') openBookModal(book); });
      bookGrid.appendChild(card);
    });
  }

  // ─── Save book ────────────────────────────────────────────────────────────────
  function saveBook(book) {
    const saved = db.get('nepCulture_literature');
    if (saved.some(s => s.id === book.id)) {
      showToast(`"${book.title}" is already in your archive.`, 'crimson');
      return;
    }
    db.add('nepCulture_literature', {
      ...book,
      savedDate: new Date().toLocaleString(),
      type: 'Literature',
      favorite: false,
      offline: false,
      tags: [],
      note: ''
    });
    showToast(`"${book.title}" saved to your archive. ✓`);
    renderBooks(currentFilter());
  }
  window.saveBook = (title) => { const b = ARCHIVES.find(x => x.title === title); if (b) saveBook(b); };

  // ─── Book modal ───────────────────────────────────────────────────────────────
  function openBookModal(book) {
    document.getElementById('book-modal')?.remove();
    const saved   = db.get('nepCulture_literature');
    const isSaved = saved.some(s => s.id === book.id);

    const overlay = document.createElement('div');
    overlay.id = 'book-modal';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label', book.title);
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9000;padding:20px;';
    overlay.innerHTML = `
      <div class="modal-box glass-card" role="document" style="max-width:540px;width:100%;padding:40px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.8);animation:fadeInUp 0.3s ease;">
        <button id="modal-close" aria-label="Close" style="position:absolute;top:16px;right:20px;background:none;border:none;color:#888;font-size:1.8rem;cursor:pointer;line-height:1;">×</button>
        <div style="font-size:3rem;margin-bottom:16px;">${book.icon}</div>
        <h2 class="serif gold-text" style="margin-bottom:6px;">${escHtml(book.title)}</h2>
        <p style="color:var(--text-muted);margin-bottom:20px;">by ${escHtml(book.author)}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;font-size:0.9rem;">
          <span><strong style="color:#aaa;">Year</strong><br>${escHtml(book.year)}</span>
          <span><strong style="color:#aaa;">Era</strong><br>${escHtml(book.era)}</span>
          <span><strong style="color:#aaa;">Genre</strong><br>${escHtml(book.genre)}</span>
          <span><strong style="color:#aaa;">Impact</strong><br>${book.rating}</span>
        </div>
        <p style="color:var(--gold);font-size:0.78rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Theme</p>
        <p style="font-size:0.85rem;color:#ccc;margin-bottom:16px;">${escHtml(book.theme)}</p>
        <p style="font-size:0.9rem;line-height:1.7;color:#ddd;margin-bottom:24px;">${escHtml(book.summary)}</p>
        <button class="btn-primary modal-save-btn" style="width:100%;border-radius:30px;" ${isSaved?'disabled':''} aria-label="${isSaved?'Already in archive':'Save to archive'}">
          ${isSaved ? '✓ Already in Archive' : '📚 Save to Archive'}
        </button>
      </div>
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#modal-close').addEventListener('click', () => overlay.remove());
    const esc = (e) => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); } };
    document.addEventListener('keydown', esc);
    const mSave = overlay.querySelector('.modal-save-btn');
    if (mSave && !isSaved) {
      mSave.addEventListener('click', () => {
        saveBook(book);
        mSave.disabled = true;
        mSave.innerText = '✓ Saved to Archive';
      });
    }
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-box').setAttribute('tabindex','-1');
    overlay.querySelector('.modal-box').focus();
  }

  // ─── Search ───────────────────────────────────────────────────────────────────
  function currentFilter() {
    const q = searchInput ? searchInput.value.toLowerCase() : '';
    if (!q) return ARCHIVES;
    return ARCHIVES.filter(b =>
      b.title.toLowerCase().includes(q)   ||
      b.author.toLowerCase().includes(q)  ||
      b.era.toLowerCase().includes(q)     ||
      b.theme.toLowerCase().includes(q)   ||
      b.genre.toLowerCase().includes(q)   ||
      b.summary.toLowerCase().includes(q)
    );
  }
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => { renderBooks(currentFilter()); }, 150));
  }
  document.querySelectorAll('.filter-item').forEach(item => {
    item.addEventListener('click', () => {
      const val = item.textContent.trim().toLowerCase();
      const filtered = ARCHIVES.filter(b => b.era.toLowerCase().includes(val) || b.genre.toLowerCase().includes(val));
      renderBooks(filtered.length ? filtered : ARCHIVES);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  //  AI CULTURAL GUIDE — DOCTORAL-LEVEL KEYWORD-MATCHED RESPONSES
  // ══════════════════════════════════════════════════════════════════════════════

  const CHAT_RESPONSES = [
    // ── BOOKS & AUTHORS ──────────────────────────────────────────────────────
    {
      keywords: ['muna madan','jhyaure','mahakavi devkota'],
      response: `<strong>Muna Madan (1936)</strong> is the cornerstone of modern Nepali literature by <em>Mahakavi</em> Laxmi Prasad Devkota. Written in the melodious <em>Jhyaure</em> folk meter, it deliberately broke from elitist Sanskrit verse to make poetry accessible to every Nepali speaker.<br><br>
<strong>Narrative:</strong> Madan leaves his devoted wife Muna to earn wealth in Lhasa. He falls gravely ill and is abandoned by companions — but rescued by a man from a marginalized Newari caste. This act becomes the poem's moral center: <em>caste is meaningless before compassion.</em><br><br>
<strong>Themes:</strong> Migration and its emotional toll; sacrifice; the spiritual cost of chasing material wealth; radical challenge to caste hierarchy embedded in folk form.<br><br>
<strong>Literary significance:</strong> The Jhyaure meter carries both joy and sorrow simultaneously — making the poem feel like a festival song and a funeral lament at once. This tonal complexity is what makes it inexhaustible across generations.<br><br>
<em>Shall I discuss its linguistic innovations, compare it with Devkota's other works, or explore its influence on later Nepali literature?</em>`
    },
    {
      keywords: ['devkota','laxmi prasad','great nepali poet','mahakavi','shakuntala','bhrikuti poem'],
      response: `<strong>Laxmi Prasad Devkota (1909–1959)</strong> — revered as <em>Mahakavi</em> (Great Poet) — is Nepal's greatest literary figure by almost any measure. He transformed Nepali literature by combining Sanskrit classical knowledge with Romantic sensibility and a democratic impulse to make literature accessible.<br><br>
<strong>Major works:</strong><br>
• <em>Muna Madan (1936)</em> — the defining Nepali poem, in Jhyaure folk meter<br>
• <em>Shakuntala (1945)</em> — free verse epic retelling the classical Sanskrit love story<br>
• <em>Bhrikuti (1944)</em> — celebrating the Nepali princess who brought Buddhism to Tibet<br>
• <em>Sulochana (1934)</em> — his first major publication, establishing his lyric voice<br><br>
<strong>Philosophy:</strong> Devkota believed poetry should be the voice of the dispossessed. His own struggles with poverty, mental illness, and social marginalization inform his work's extraordinary empathy. He famously wrote that "a poet is a madman" — and embraced the designation.<br><br>
<strong>Legacy:</strong> Devkota's birthday (Ashar 7) is celebrated as Nepali Literature Day. His face appeared on Nepali currency. No single figure has shaped the Nepali literary imagination more completely.<br><br>
<em>Would you like to explore a specific work, his biography, or his influence on subsequent Nepali poets?</em>`
    },
    {
      keywords: ['parijat','shirishko phool','blue mimosa','bishnu kumari waiba','existentialist'],
      response: `<strong>Parijat (1937–1993)</strong> — born Bishnu Kumari Waiba — is Nepal's most radical literary figure. She adopted the pen name after a night-blooming flower and shattered both gender and literary conventions simultaneously.<br><br>
<strong>Shirishko Phool (Blue Mimosa, 1964)</strong> is Nepal's first existentialist novel. It follows war veteran Suyogbir's descent into nihilism — deeply influenced by Camus and Sartre yet rooted entirely in Nepali post-war social reality.<br><br>
<strong>Why it's doubly transgressive:</strong> A woman writing existentialist fiction in 1964 Nepal was extraordinary on two levels — the philosophy itself was radical, and the authorship by a woman was socially transgressive. She won the <em>Tribhuvan Pragya Puraskar</em>, Nepal's highest literary honor.<br><br>
<strong>Her poetry</strong> was equally groundbreaking — confessional, political, deeply personal about her own chronic illness and navigation of a world that tried to contain her voice.<br><br>
<em>Would you like to explore her poetry collections, her influence on Nepali women's writing, or compare Shirishko Phool with Camus's The Stranger?</em>`
    },
    {
      keywords: ['palpasa cafe','narayan wagle','maoist novel','conflict literature'],
      response: `<strong>Palpasa Cafe (2005)</strong> by Narayan Wagle was the first major Nepali novel to directly engage the Maoist insurgency while the conflict was still ongoing — an act of tremendous literary courage.<br><br>
<strong>The story:</strong> Drishya, a painter, falls in love with Palpasa amid civil war's chaos. The novel asks: <em>what does it mean to create art, love someone, and remain human during collective violence?</em> It refuses political sides in favour of human complexity.<br><br>
<strong>Publishing history:</strong> Originally self-published because no publisher would touch it. It became a sensation — over 100,000 copies in a country where 10,000 is a bestseller. Later translated and studied internationally as a landmark of conflict literature.<br><br>
<strong>Technique:</strong> Non-linear structure mirrors wartime fragmentation. The Palpasa Cafe itself — a beautiful space refusing to be destroyed — becomes a symbol of culture's persistence against violence.<br><br>
<em>I can discuss its place in global conflict literature, compare it with other war novels, or explore Wagle's career.</em>`
    },
    {
      keywords: ['karnali blues','buddhisagar','karnali region','father son'],
      response: `<strong>Karnali Blues (2010)</strong> by Buddhisagar is considered one of the finest 21st-century Nepali novels. It follows a son reconstructing his father's extraordinary life — a barefoot journey from remote Karnali to Kathmandu.<br><br>
<strong>Literary qualities:</strong> The prose is deliberately stripped and plain — making its emotional depth devastating. No sentimentality, but every earned feeling lands. The Karnali river becomes structural metaphor: both origin and loss, boundary and connection.<br><br>
<strong>Social impact:</strong> It brought unprecedented literary attention to Nepal's Karnali zone — historically the most neglected region, associated with poverty and distance from national narrative. The novel argued that these invisible lives deserved the full weight of literary attention.<br><br>
<strong>Cultural significance:</strong> Normalized father-son emotional expression in Nepali literature, which had largely avoided male interiority.<br><br>
<em>Shall I compare it to other Nepali coming-of-age literature, discuss Buddhisagar's writing process, or explore the Karnali region's broader cultural significance?</em>`
    },
    {
      keywords: ['basai','lil bahadur chettri','kirati','migration novel'],
      response: `<strong>Basai (1958)</strong> by Lil Bahadur Chettri is widely considered Nepal's finest novel of the 20th century. Set in a Kirati village facing displacement from ancestral land, it chronicles forced migration with extraordinary psychological depth.<br><br>
<strong>The word:</strong> "Basai" means migration in Nepali — but specifically the kind compelled by circumstances beyond individual choice. It carries the weight of leaving the place where identity is rooted. The novel defined a national experience.<br><br>
<strong>Narrative approach:</strong> Chettri portrays the collective psychology of a community facing dissolution, not merely individual stories. The village itself is a character — its impending loss carries the same grief as a human death.<br><br>
<strong>Historical context:</strong> Written at the beginning of significant demographic movement in Nepal — from hills to Terai, from villages to cities. The patterns it first documented are still reshaping Nepal today.<br><br>
<em>Would you like to explore the novel's relationship to Kirati cultural identity, its narrative structure, or its influence on later Nepali fiction?</em>`
    },
    {
      keywords: ['bhanubhakta','aadikavi','first nepali poet','ramayana nepali'],
      response: `<strong>Bhanubhakta Acharya (1814–1868)</strong> is honored as <em>Aadikavi</em> — the First Poet — of Nepali literature. Not because he was the first to write in Nepali, but because he was the first to make Nepali literature belong to the people rather than the scholarly elite.<br><br>
<strong>His achievement:</strong> Translating the Ramayana into conversational Nepali vernacular — making the Sanskrit epic accessible to those who couldn't read Sanskrit. This democratization of sacred literature was a cultural revolution of the first order.<br><br>
<strong>The grass-cutter story:</strong> Bhanubhakta was inspired by meeting a humble grass-cutter who planned to build a rest-house as his contribution to the world. He asked himself: what am I contributing? The answer became the Nepali Ramayana — a contribution to every Nepali who could now access their epic tradition.<br><br>
<strong>Legacy:</strong> He established Nepali as a literary medium worthy of epic — not merely administrative or conversational use. Every major Nepali writer owes him this foundation. His birthday (Ashar 29) is celebrated as Nepali Language Day.<br><br>
<em>Shall I discuss specific changes he made to Valmiki's text, his biographical struggles, or his broader cultural significance?</em>`
    },
    {
      keywords: ['bp koirala','sumnima','teen ghumti','prime minister writer'],
      response: `<strong>BP Koirala (1914–1982)</strong> holds a unique position in world literature: simultaneously Nepal's first democratically elected Prime Minister and one of its greatest novelists — writing fiction in prison and in exile.<br><br>
<strong>Sumnima (1984)</strong> is his most radical work — a retelling of a Kirant myth with frank explorations of sexuality and spiritual freedom unprecedented in Nepali literature. Written during political exile, it channels powerlessness into radical artistic freedom.<br><br>
<strong>Teen Ghumti (1968)</strong> follows three women at life's crossroads in Kathmandu — a sharp, nuanced critique of patriarchal society with female interiority at its center. Groundbreaking for its time.<br><br>
<strong>His literary philosophy:</strong> Koirala believed fiction accessed truths that political speech could not — that the novel was uniquely suited to the complexity of human experience. His imprisonment and exile gave him the time, and perhaps the necessity, to explore this fully.<br><br>
<em>I can discuss his political biography alongside his literary work, or focus on any specific novel in depth.</em>`
    },
    // ── MUSIC & INSTRUMENTS ──────────────────────────────────────────────────
    {
      keywords: ['sarangi','gandharba','gandharva','gaine','oral history instrument'],
      response: `The <strong>Sarangi</strong> is Nepal's most emotionally resonant traditional instrument, historically wielded by the <em>Gandharba</em> (Gaine) community — itinerant musicians who served simultaneously as oral historians and living newspapers.<br><br>
<strong>Construction:</strong> Carved from a single block of wood (typically simal or khirro), with four playing strings and up to 11 sympathetic resonance strings that vibrate in harmonic response. Played with a horsehair bow, it produces a sound between a cello and the human voice — perfectly suited to narrative song.<br><br>
<strong>Social function:</strong> Gandharbas traveled village to village, singing news, genealogies, and legends. Before printing, radio, or digital media, they were the information network of the hills — their songs carried royal announcements, local gossip, and mythology with equal craft.<br><br>
<strong>Endangered tradition:</strong> Younger Gandharba community members increasingly migrate to cities, and the knowledge of instrument-making and the vast oral repertoire is being lost. Documentation efforts are ongoing but urgent.<br><br>
<em>Interested in other Nepali folk instruments, the Gandharba community's current situation, or the Sarangi's role in modern fusion music?</em>`
    },
    {
      keywords: ['madal','nepali drum','national drum','percussion nepal'],
      response: `The <strong>Madal</strong> is Nepal's national drum — the rhythmic heartbeat of Nepali folk music. A double-headed cylindrical drum held horizontally in the lap and played with both hands, its right-hand bass and left-hand treble create the characteristic Nepali folk rhythm.<br><br>
<strong>Cultural ubiquity:</strong> The Madal appears at virtually every Nepali celebration — Teej, Tihar, weddings, community festivals. Hearing it triggers deep associative emotion across all Nepali backgrounds, regardless of region or ethnicity.<br><br>
<strong>Regional variants:</strong> The Tamang use the damphu (flat frame drum with sacred significance), Newars have elaborate percussion ensembles for temple music, and many hill communities have their own distinct drum traditions.<br><br>
<strong>Modern use:</strong> The Madal has successfully entered contemporary pop, folk-rock, and fusion genres, demonstrating traditional percussion's extraordinary adaptability.<br><br>
<em>Would you like to explore specific regional drum traditions, the damphu's sacred role, or the Madal's history?</em>`
    },
    {
      keywords: ['bansuri','bamboo flute','nepali flute','krishna flute'],
      response: `The <strong>Bansuri</strong> — bamboo flute — carries one of South Asia's oldest musical lineages, associated with Krishna whose music could enchant animals, humans, and the divine alike.<br><br>
<strong>Construction:</strong> Made from a single bamboo tube with six or seven finger holes. The embouchure (mouth position for blowing) determines tone quality — a skill requiring years to master. A fine Nepali bansuri can produce microtonal intervals unavailable on Western instruments, allowing expression of emotional nuances outside Western musical vocabulary.<br><br>
<strong>In Nepali music:</strong> The bansuri is essential across shepherd music, pastoral folk songs, and classical ragas. It conveys solitude, longing, or devotion with equal conviction — qualities embedded in its deep cultural associations.<br><br>
<strong>Contemporary use:</strong> Fusion artists have incorporated the bansuri into jazz, electronic, and ambient compositions, where its natural harmonics create distinctive texture against modern production.<br><br>
<em>Shall I discuss the classical raga tradition associated with bansuri, specific Nepali folk styles, or its role in fusion music?</em>`
    },
    {
      keywords: ['damphu','tamang drum','tamang music','tamang selo','tamang culture'],
      response: `The <strong>Damphu</strong> is the sacred frame drum of the Tamang people — one of Nepal's largest indigenous ethnic groups. Round and flat, held in one hand and struck with the other, it is not merely a musical instrument but a ritual object.<br><br>
<strong>Sacred significance:</strong> In Tamang shamanic practice, the Damphu is the vehicle through which the shaman (Bombo) communicates with spirits. Specific rhythms correspond to specific spiritual states and entities — the drum is a map of the spirit world.<br><br>
<strong>Festival role:</strong> During Tamang Selo festivals, the Damphu drives circular dances that can last entire nights. The songs performed with it encode Tamang history, mythology, and social wisdom in forms that have survived centuries of political marginalization.<br><br>
<strong>Tamang Selo as genre:</strong> Characterized by the Damphu's distinctive rhythm — upbeat, communal, dealing with love, seasonal work, celebration. Has gained mainstream Nepali recognition and influenced contemporary fusion.<br><br>
<em>Interested in the Tamang shamanic tradition, Tamang Selo's modern evolution, or the broader landscape of ethnic music in Nepal?</em>`
    },
    {
      keywords: ['dohori','call and response','lok dohori','improvisational song'],
      response: `<strong>Dohori</strong> (meaning "two-sided") is Nepal's great improvisational folk singing tradition — a structured contest where two performers compose verses in real time, each responding to the other's poetic challenges.<br><br>
<strong>Structure:</strong> Traditionally between a man and a woman, following strict metrical rules while the content is improvised. Topics range from romantic pursuit to philosophical debate. The best dohori singers are celebrated as masters of both melody and lightning-fast wit.<br><br>
<strong>Social function:</strong> Dohori was the context for courtship, community storytelling, and transmission of cultural knowledge. A skilled performer could hold an audience for hours through the combination of music, improvisation, and narrative — Nepal's oldest entertainment technology.<br><br>
<strong>Modern dohori:</strong> Now performed in concert venues and TV competitions. Stars like Jhalak Man Gandharba became household names. The debate continues whether professionalization preserves or dilutes the tradition's authentic communal character.<br><br>
<em>Shall I discuss specific regional dohori styles, the improvisation techniques, or the tension between folk authenticity and commercialization?</em>`
    },
    {
      keywords: ['narayan gopal','swar samrat','nepali classic singer','adhunik music'],
      response: `<strong>Narayan Gopal Gurubacharya (1939–1990)</strong> is Nepal's most beloved vocalist — known as <em>Swar Samrat</em> (Emperor of Voice). His death was treated as a national mourning across Nepal.<br><br>
<strong>His voice:</strong> A rich warm baritone of exceptional range, capable of conveying profound melancholy without sentimentality. His trademark was inhabiting a song completely — finding its exact emotional register and living inside it.<br><br>
<strong>Artistic range:</strong> Most closely associated with adhunik (modern Nepali romantic ballads), but equally masterful in classical and folk-influenced forms. Recordings like "Kehi Mitho Baat Gara" and "Utai Deu Mukut" remain canonical across generations.<br><br>
<strong>Legacy:</strong> He established the aesthetic standard for Nepali adhunik music — the genre that became the primary vehicle for Nepali emotional expression in the late 20th century. His recordings play daily in virtually every Nepali home, taxi, and restaurant worldwide.<br><br>
<em>I can discuss specific songs, his musical training, his influence on subsequent singers, or the adhunik genre's full history.</em>`
    },
    // ── HISTORY ──────────────────────────────────────────────────────────────
    {
      keywords: ['prithvi narayan shah','gorkha unification','unification nepal','divya upadesh'],
      response: `<strong>Prithvi Narayan Shah (1723–1775)</strong> unified what is now Nepal between 1744 and 1769 — forging a nation from over 52 competing kingdoms across the central Himalayan region.<br><br>
<strong>Strategy:</strong> His campaign combined military force with shrewd diplomacy. He prioritized blocking trade routes to weaken opponents economically before engaging militarily, studied each city's defenses, and incorporated conquered territories by offering positions to former rulers — building loyalty rather than just submission.<br><br>
<strong>The Divya Upadesh (1774):</strong> His political testament describes Nepal as "a yam between two boulders" — China and British India — arguing that survival required self-reliance, strict limits on foreign influence, and cultural unity. This strategic thinking shaped Nepali foreign policy for two centuries.<br><br>
<strong>Contemporary reassessment:</strong> Modern historiography examines both the achievement and its costs — forced assimilation of ethnic minorities, imposition of Hindu caste hierarchy, suppression of local autonomy. The full legacy is contested and complex.<br><br>
<em>Would you like to explore the specific military campaigns, cultural policies, or the ongoing debates about his historical legacy?</em>`
    },
    {
      keywords: ['rana period','jung bahadur rana','rana oligarchy','rana palace','singha durbar','rana architecture'],
      response: `<strong>The Rana Period (1846–1951)</strong> was a century in which hereditary Prime Ministers from the Rana family held effective power, reducing the Shah kings to figureheads in a sophisticated oligarchic arrangement.<br><br>
<strong>Jung Bahadur's 1850 European tour</strong> was decisive — he returned determined to build palaces rivaling Versailles. Singha Durbar, Narayanhiti, Seto Durbar feature Baroque and Neoclassical facades, Corinthian columns, and imported Italian marble. This was deliberate political theater: projecting modernity to legitimize autocratic rule.<br><br>
<strong>Paradox:</strong> The Ranas simultaneously closed Nepal's borders (preventing colonization but also modernization), introduced modern institutions, and preserved cultural traditions by keeping the country isolated from external influence.<br><br>
<strong>End of Rana rule:</strong> The 1950 revolution — backed by India and enabled by King Tribhuvan's dramatic defection to the Indian embassy — ended Rana rule. The 1951 democratic transition opened Nepal to the world for the first time in a century.<br><br>
<em>I can discuss specific Rana figures, the architecture in detail, or the 1950 revolution's complex legacy.</em>`
    },
    {
      keywords: ['licchavi','malla','ancient nepal','medieval nepal','kathmandu valley history'],
      response: `Nepal's ancient and medieval periods reveal extraordinary civilizational depth:<br><br>
<strong>Licchavi Period (c. 300–880 CE):</strong> Nepal's first documented historical era. The inscriptions of King Manadeva (5th century) are the oldest dated Nepali documents. Characterized by Sanskrit culture, Hindu-Buddhist synthesis, and vigorous trans-Himalayan trade between India and China.<br><br>
<strong>Malla Period (1200–1768 CE):</strong> The golden age of Newari civilization. The three Kathmandu Valley kingdoms — Kathmandu, Patan, Bhaktapur — became rival cultural centers. Their competition in patronizing temples, palaces, and art produced the Durbar Squares, Nyatapola Temple, and the extraordinary carved woodwork that defines Newari heritage.<br><br>
<strong>Key artistic achievements:</strong> The peacock window at Bhaktapur; the five-tiered Nyatapola (completed 1702); the Pashupatinath temple complex's expansion; hundreds of stone water fountains (dhunge dharas) still functioning today.<br><br>
<em>Which period would you like to explore in depth — Licchavi inscriptions, Malla court culture, or specific monuments?</em>`
    },
    {
      keywords: ['maoist','people war','nepal civil war','1996 2006','insurgency'],
      response: `<strong>The Maoist People's War (1996–2006)</strong> was Nepal's defining modern conflict — a decade-long insurgency killing approximately 17,000 people and fundamentally transforming the country's political structure.<br><br>
<strong>Origins:</strong> The Communist Party of Nepal (Maoist), led by Pushpa Kamal Dahal (Prachanda), launched in Rolpa district in 1996, citing persistent inequality, caste discrimination, and neglect of rural Nepal. The grievances were real and documented — the violent response was what divided opinion.<br><br>
<strong>The conflict:</strong> Spread from remote western districts across the country, establishing parallel governments in many villages. The royal massacre of 2001 and King Gyanendra's 2005 autocratic takeover further complicated the political landscape.<br><br>
<strong>Resolution:</strong> The 2006 Comprehensive Peace Agreement ended fighting. The 2008 Constituent Assembly abolished the monarchy and declared Nepal a Federal Democratic Republic. Former Maoists became a mainstream political party — one of history's more successful post-conflict political transformations.<br><br>
<strong>Cultural legacy:</strong> Produced extraordinary literature and film — Palpasa Cafe, documentary work, poetry, journalism — still being processed by the national imagination.<br><br>
<em>I can discuss the peace process, the political transformation, specific cultural responses, or regional impacts of the conflict.</em>`
    },
    {
      keywords: ['2015 earthquake','gorkha earthquake','nepal earthquake','reconstruction heritage'],
      response: `The <strong>2015 Gorkha Earthquake</strong> (April 25, magnitude 7.8) was Nepal's most devastating natural disaster in 80 years — nearly 9,000 dead, 22,000 injured, epicenter near Barpak in Gorkha.<br><br>
<strong>Heritage damage:</strong> Dharahara Tower collapsed entirely. Kasthamandap — possibly the world's oldest wooden building, built according to tradition from a single tree — was destroyed. Temples across Kathmandu's Durbar Squares were severely damaged.<br><br>
<strong>The reconstruction:</strong> Kasthamandap was rebuilt by 2021 through community effort using traditional Newari construction methods. International conservation experts collaborated with local craftsmen to reconstruct using original techniques and materials wherever possible.<br><br>
<strong>Unexpected cultural benefit:</strong> The earthquake became a catalyst for documenting traditional construction knowledge — master craftsmen's techniques were systematically recorded for the first time, creating a heritage archive that will outlast any specific building. A disaster that paradoxically accelerated cultural preservation.<br><br>
<em>Shall I discuss ongoing reconstruction challenges, specific buildings, or Nepal's broader seismic history?</em>`
    },
    // ── FESTIVALS & CULTURE ──────────────────────────────────────────────────
    {
      keywords: ['dashain','vijaya dashami','tika nepal','biggest festival'],
      response: `<strong>Dashain</strong> (Vijaya Dashami) is Nepal's longest and most significant festival — 15 days in September-October celebrating Durga's victory over the buffalo demon Mahishasura, the triumph of dharma over adharma.<br><br>
<strong>Key ritual moments:</strong><br>
• <em>Ghatasthapana (Day 1):</em> Sacred earthen vessel installed; barley seedlings planted for jamara (ceremonial grass).<br>
• <em>Maha Ashtami & Kali Puja (Days 8-9):</em> The most intense ritual period; major animal sacrifices.<br>
• <em>Vijaya Dashami (Day 10):</em> The sacred tika — red, white, and yellow paste applied by elders to younger family members. The festival's most beloved and emotionally charged moment.<br><br>
<strong>Cultural depth:</strong> Dashain is the primary occasion when scattered family members return home across Nepal and from abroad. For diaspora Nepalis, the inability to receive tika from aging parents is one of migration's most painful costs — making it both a festival of connection and a measure of absence.<br><br>
<em>Shall I describe Tihar, Teej, Indra Jatra, or other Nepali festivals in detail?</em>`
    },
    {
      keywords: ['tihar','festival of lights','bhai tika','kukur tihar','deepawali nepal'],
      response: `<strong>Tihar</strong> (Yama Panchak / Deepawali) is Nepal's Festival of Lights — five days honoring crows, dogs, cows, goddess Laxmi, and the brother-sister bond.<br><br>
<strong>Five days:</strong><br>
• <em>Kaag Tihar:</em> Crows fed offerings — messengers of Yama, god of death.<br>
• <em>Kukur Tihar:</em> Dogs garlanded, given tika and special food — guardians of the underworld and faithful companions.<br>
• <em>Gai Tihar / Laxmi Puja:</em> Cows worshipped; oil lamps light every home to welcome Laxmi.<br>
• <em>Mha Puja (Newari New Year):</em> Newars perform self-worship — a ritual honoring the divine self within.<br>
• <em>Bhai Tika:</em> Sisters place seven-colored tika on brothers' foreheads, pray for their long lives; brothers give gifts.<br><br>
<strong>Deusi Reh tradition:</strong> Groups of young people go house-to-house singing Deusi (boys) and Bhailo (girls) songs in exchange for money and food — a beautiful blend of entertainment, community, and ritual.<br><br>
<em>Would you like details on Indra Jatra, the Kumari festivals, or other Kathmandu Valley celebrations?</em>`
    },
    {
      keywords: ['kumari','living goddess','royal kumari','kumari ghar','living deity'],
      response: `The <strong>Kumari</strong> (Living Goddess) is one of Nepal's most extraordinary institutions — a pre-pubescent girl selected through rigorous ritual examination to embody the goddess Taleju, a form of Durga.<br><br>
<strong>Selection process:</strong> Candidates from the Newari Shakya caste undergo examination for 32 physical perfections, fearlessness tests (spending a night with heads of sacrificed animals), and final recognition — the girl who recognizes the previous Kumari's possessions is confirmed.<br><br>
<strong>Life during service:</strong> The Royal Kumari lives in Kumari Ghar in Kathmandu's Durbar Square, her feet never touching the ground in public. She is carried on a palanquin during festivals. The President must receive her blessing — a remarkable inversion of temporal and sacred power.<br><br>
<strong>Return to ordinary life:</strong> When a Kumari reaches puberty or bleeds for any reason, she returns to civilian status. The psychological complexity of this transition has generated significant debate and some legislative protection for former Kumaris.<br><br>
<em>Shall I discuss the philosophical foundations of the Kumari tradition, the debates about children's rights, or the specific festival of Indra Jatra?</em>`
    },
    {
      keywords: ['teej','teej songs','teej festival','teej geet','women singing festival'],
      response: `<strong>Teej</strong> is one of Nepal's most fascinating festivals — ostensibly celebrating Parvati's devotion to Shiva, but containing a powerful subversive oral tradition running beneath its devotional surface.<br><br>
<strong>The fast:</strong> Married women fast rigorously — some without water — for their husbands' long lives. Unmarried women fast for good husbands. Followed by elaborate feasting and ritual bathing in sacred rivers.<br><br>
<strong>The songs (Teej Geet):</strong> The most remarkable dimension. Women gather to sing compositions expressing:<br>
• Complaints about difficult mothers-in-law and domestic labor<br>
• Grief about leaving natal homes after marriage<br>
• Critiques of patriarchal norms embedded in devotional framing<br>
• Sexual desire expressed through carefully constructed metaphor<br><br>
The religious framing creates a protected space — criticism that would be censored in other forms passes through devotional song unchallenged. This is one of South Asia's most sophisticated examples of cultural resistance encoded in ritual.<br><br>
<em>I can discuss other women's cultural traditions, the sociological analysis of Teej songs, or women's oral literary traditions across Nepal.</em>`
    },
    // ── RELIGION & PHILOSOPHY ────────────────────────────────────────────────
    {
      keywords: ['boudhanath','boudha stupa','stupa','buddhism nepal','lumbini','buddha birthplace'],
      response: `Nepal stands at Buddhism's origin — <strong>Lumbini</strong> in what is now Rupandehi district is the birthplace of Siddhartha Gautama, born around 563 BCE to the Shakya clan. The Ashoka Pillar erected by Emperor Ashoka in 249 BCE marks the site and confirms it as the world's oldest authenticated archaeological Buddhist site.<br><br>
<strong>Boudhanath Stupa:</strong> One of the world's largest stupas, spiritual center of Tibetan Buddhism in Nepal, UNESCO World Heritage Site. The all-seeing eyes painted on four cardinal faces are Nepal's most internationally recognized symbol. Rebuilt after earthquake damage, it remains a living place of worship for tens of thousands daily.<br><br>
<strong>Swayambhunath:</strong> Predates Boudhanath — origins in the Licchavi period. Contains both Hindu and Buddhist shrines in peaceful coexistence — a model of the religious synthesis that defines Nepali spiritual culture.<br><br>
<strong>Nepal's Buddhist traditions:</strong> Multiple distinct streams coexist — Theravada (practiced by Newars in traditional form), Tibetan Vajrayana (northern districts and refugee communities), and unique Newar Buddhist traditions that blend Hindu and Buddhist elements in ways scholars still debate.<br><br>
<em>Shall I discuss Lumbini's archaeological history, the theology of specific Buddhist traditions, or the relationship between Hinduism and Buddhism in Nepal?</em>`
    },
    {
      keywords: ['pashupatinath','shiva temple','bagmati river','hindu nepal','cremation ghaat'],
      response: `<strong>Pashupatinath Temple</strong> is Nepal's most sacred Hindu site and among the world's most important Shiva temples. Located on the Bagmati river in Kathmandu, it has functioned as a center of worship for at least 1,500 documented years.<br><br>
<strong>Sacred geography:</strong> The Bagmati at Pashupatinath is Nepal's Ganges — cremation ghats line both banks. Dying Hindus seek to have their last rites performed here, believing it ensures liberation. The smoke from the ghats, the golden shikhara of the main temple, and orange-robed sadhus create one of the world's most powerful sacred environments.<br><br>
<strong>The mythology:</strong> Shiva is said to have taken the form of a deer (Pashupati — Lord of Animals) here. When the gods searched for him, they found him by his horns. The main shrine contains a four-faced Shiva lingam covered in gold.<br><br>
<strong>Maha Shivaratri:</strong> The great Shiva Night festival brings hundreds of thousands of pilgrims and thousands of sadhus from across South Asia. The area around Pashupatinath transforms into one of the world's largest gatherings of Hindu holy men — extraordinary to witness.<br><br>
<em>Would you like to discuss Maha Shivaratri, the sadhus who live near the temple, or the relationship between Nepal's Hindu and Buddhist traditions?</em>`
    },
    // ── ARCHITECTURE & ART ───────────────────────────────────────────────────
    {
      keywords: ['newari architecture','pagoda','durbar square','wood carving','kathmandu valley temples'],
      response: `<strong>Newari architecture</strong> is one of the world's great building traditions — developed over a millennium in the Kathmandu Valley with extraordinary technical and artistic sophistication.<br><br>
<strong>The pagoda form:</strong> The multi-tiered pagoda temple achieved extraordinary refinement in the Malla period (1200–1768). The Nyatapola Temple in Bhaktapur — five tiers, built 1702, survived the 2015 earthquake — is its supreme expression. Its proportions and the diminishing scale of each tier follow mathematical relationships derived from cosmological principles.<br><br>
<strong>Woodcarving tradition:</strong> Reached its peak in the 13th–18th centuries. The peacock window at Bhaktapur's Pujari Math is the finest example — a composition of such intricacy it required generations. The carved mithuna (erotic art) on temple struts serves protective functions according to tradition — Kumari goddesses are said to be repelled by it, preventing lightning.<br><br>
<strong>Post-2015:</strong> Reconstruction using traditional methods has itself become a living heritage documentation. Master craftsmen's techniques were recorded for the first time — the disaster paradoxically accelerated cultural preservation.<br><br>
<em>Shall I discuss specific monuments, woodcarving iconography, or the reconstruction process?</em>`
    },
    {
      keywords: ['thangka','paubha','nepali painting','tibetan art nepal','mandala'],
      response: `<strong>Thangka</strong> (Tibetan) and <strong>Paubha</strong> (Newari) are Nepal's two great Buddhist painting traditions — both depicting deities, mandalas, and narrative scenes according to strict iconographic rules passed from master to student over centuries.<br><br>
<strong>Paubha tradition:</strong> Developed by Newari artists in the Kathmandu Valley, following mathematical proportions for each deity established in Sanskrit texts. Traditional pigments — crushed lapis lazuli for blue, malachite for green, vermillion for red — produce colors of extraordinary depth unfaded after centuries.<br><br>
<strong>Thangka tradition:</strong> Developed under Tibetan Buddhist influence, with elongated proportions and elaborate landscape backgrounds. Concentrated in Boudhanath and Swayambhunath areas, where Tibetan Buddhist communities have maintained the tradition.<br><br>
<strong>Function:</strong> These are not decorative objects but meditation supports. Creating one begins with ritual purification and proceeds as a devotional act. The mandala at the center is a cosmological map — the visual equivalent of a mantra, designed to focus and dissolve the meditating mind.<br><br>
<em>I can discuss specific iconographic systems, the differences between Paubha and Thangka traditions, or the contemporary art market for traditional Nepali paintings.</em>`
    },
    // ── GEOGRAPHY & NATURE ───────────────────────────────────────────────────
    {
      keywords: ['everest','sagarmatha','chomolungma','highest mountain','himalaya','eight thousanders'],
      response: `<strong>Mount Everest</strong> — <em>Sagarmatha</em> (Forehead of the Sky) in Nepali, <em>Chomolungma</em> (Goddess Mother of the World) in Tibetan — stands at 8,848.86 meters, the world's highest point above sea level.<br><br>
<strong>First summit:</strong> Tenzing Norgay Sherpa and Edmund Hillary reached the summit on May 29, 1953 — a moment of extraordinary symbolic importance for Nepal, for the Sherpa community, and for human ambition. Tenzing became an immediate global hero; his achievement did more to put Nepal on the world map than any diplomatic effort.<br><br>
<strong>Nepal's mountains:</strong> Eight of the world's 14 eight-thousanders are in Nepal — including Kangchenjunga, Lhotse, Makalu, Cho Oyu, Dhaulagiri, Manaslu, and Annapurna. The Himalayan range was formed by the collision of the Indian and Eurasian tectonic plates still ongoing today, meaning Nepal is literally rising — Everest grows approximately 4mm per year.<br><br>
<strong>Sherpa culture:</strong> The Sherpa people of the Solukhumbu region have lived in Everest's shadow for centuries. Their mountaineering skills, built from generations of high-altitude living, are not genetic luck but refined cultural knowledge. The commercialization of Everest has both enriched and complicated their relationship with their sacred mountain.<br><br>
<em>Shall I discuss the Sherpa culture in depth, the history of Himalayan exploration, or Nepal's conservation efforts in mountain regions?</em>`
    },
    {
      keywords: ['sherpa','sherpa culture','khumbu','solukhumbu','tenzing norgay'],
      response: `The <strong>Sherpa</strong> people of Nepal's Solukhumbu district are one of the world's most remarkable high-altitude communities — their name has become a byword for mountain expertise, though their culture extends far beyond guiding.<br><br>
<strong>Origins:</strong> The Sherpa (meaning "people from the east") migrated from eastern Tibet approximately 500 years ago, settling in the high valleys of the Khumbu region. They brought Tibetan Buddhist traditions that remain central to their identity, including the monasteries of Tengboche and Thyangboche.<br><br>
<strong>Physiological adaptation:</strong> Sherpas have a genetic variant in the EPAS1 gene (acquired through ancient admixture with Denisovan humans) that allows their bodies to process oxygen more efficiently at altitude. This is not mere endurance — it's a distinct biological adaptation shaped by millennia of high-altitude living.<br><br>
<strong>Cultural life:</strong> Sherpa culture centers on Tibetan Buddhism, community solidarity (lhakpa — communal work), distinctive textile traditions, and the sacred geography of the Khumbu — Sagarmatha is not a trophy to conquer but a goddess deserving reverence.<br><br>
<strong>Tenzing Norgay (1914–1986):</strong> Born in a Tibetan village, raised in Nepal's hills, trained in the Khumbu. His 1953 summit with Hillary made him a hero across three nations — India, Nepal, and Tibet — each claiming him. He became a diplomat of the mountains.<br><br>
<em>Shall I discuss Sherpa Buddhism, the ethics of Everest commercialization, or other Himalayan communities in Nepal?</em>`
    },
    // ── LANGUAGE ──────────────────────────────────────────────────────────────
    {
      keywords: ['nepali language','nepali literature history','devnagari','nepali script','language nepal'],
      response: `The <strong>Nepali language</strong> is an Indo-Aryan language written in the Devanagari script, closely related to Hindi and Sanskrit. It is the official language of Nepal and a lingua franca across diverse ethnic communities.<br><br>
<strong>Historical development:</strong> Nepali (historically called Gorkhali or Khas Kura) developed as the language of the Khas people of the western hills. It became the unifying administrative language of the unified Nepal state from the late 18th century, and its literary tradition was established by Bhanubhakta Acharya's 19th-century Ramayana translation.<br><br>
<strong>Linguistic diversity:</strong> Nepal is home to over 123 languages — Nepali, Maithili, Bhojpuri, Tharu, Tamang, Newari, Rai, Limbu, and dozens more. Newari (Nepal Bhasa) has a literary tradition dating to the 12th century. The 2015 constitution recognized Nepal as a multilingual state, though Nepali remains privileged in education and administration.<br><br>
<strong>Script:</strong> Devanagari is one of the world's most systematically designed scripts — each character represents a precise sound, including distinctions (aspirated/unaspirated consonants, dental/retroflex) that European scripts cannot represent.<br><br>
<em>Would you like to explore specific regional languages, Nepali's relationship to Sanskrit, or the politics of language in Nepal?</em>`
    },
    {
      keywords: ['newari language','nepal bhasa','newari','newar people','newa culture'],
      response: `<strong>Newari (Nepal Bhasa)</strong> is the language of the Newar people — the indigenous civilization of the Kathmandu Valley — with a literary tradition dating to the 12th century CE, predating most European vernacular literatures.<br><br>
<strong>Historical significance:</strong> During the Malla period (1200–1768), Newari was the court language of Kathmandu Valley kingdoms. Literature, religious texts, legal codes, and historical chronicles were written in Nepal Bhasa, creating a rich textual heritage distinct from Sanskrit.<br><br>
<strong>Linguistic family:</strong> Newari is a Sino-Tibetan language — linguistically distinct from the Indo-Aryan Nepali. This makes the Newars linguistically related to Tibetan and Burmese peoples despite centuries of deep cultural exchange with South Asian Hindu civilization. This unique position explains the extraordinary Hindu-Buddhist synthesis in Newar culture.<br><br>
<strong>Endangered status:</strong> After the Gorkha unification, Nepali replaced Newari as the administrative language. Urbanization and the prestige associated with Nepali education have accelerated language shift. Preservation efforts — Newari language schools, media, and literature — are ongoing but face structural challenges.<br><br>
<em>Shall I discuss Newari literature in depth, the cultural institutions working to preserve it, or the relationship between language and Newar identity?</em>`
    },
    // ── FOOD & DAILY LIFE ─────────────────────────────────────────────────────
    {
      keywords: ['dal bhat','nepali food','nepali cuisine','thakali kitchen','sel roti','chiura'],
      response: `<strong>Dal Bhat</strong> — lentil soup with rice — is Nepal's national dish and daily foundation. More than mere food, it is a cultural anchor: the phrase "dal bhat power, 24 hour" captures both its nutritional centrality and its cultural affection.<br><br>
<strong>The composition:</strong> Steamed rice, lentil dal (varying by region and season), tarkari (vegetable curry), achar (pickle), papad, and often a small serving of meat. The meal is typically served twice daily on a round thali plate, and refills (tarkari, dal) are expected and encouraged.<br><br>
<strong>Regional variations:</strong> Thakali cuisine from the Mustang region is celebrated across Nepal for its sophisticated use of spices and its Tibetan-influenced dishes. Newari cuisine — chiura (beaten rice), chatamari (rice crepe), choila (spiced grilled meat) — is its own sophisticated culinary tradition. Terai cuisine shares influences with Bihar and UP across the southern border.<br><br>
<strong>Sel Roti:</strong> The iconic ring-shaped deep-fried rice flour bread prepared for Dashain and Tihar — its aroma is one of the most powerful sensory triggers of Nepali cultural memory for the diaspora.<br><br>
<em>Shall I discuss specific regional cuisines, the cultural rituals around food preparation and serving, or Nepali food's journey into global restaurants?</em>`
    },
    // ── GENERAL / BROAD HISTORY ───────────────────────────────────────────────
    {
      keywords: ['history nepal','brief history','timeline nepal','nepal history','ancient modern nepal'],
      response: `A chronological overview of Nepal's civilizational history:<br><br>
<strong>c. 563 BCE</strong> — Lumbini: birthplace of Siddhartha Gautama, the Buddha.<br>
<strong>c. 300–880 CE</strong> — Licchavi Period: Sanskrit culture, Hindu-Buddhist synthesis, trans-Himalayan trade.<br>
<strong>1200–1768</strong> — Malla Period: Golden age of Newari art, architecture, and the iconic Durbar Squares.<br>
<strong>1768–1769</strong> — Prithvi Narayan Shah unifies Nepal from Gorkha.<br>
<strong>1814–1816</strong> — Anglo-Nepalese War; the Sugauli Treaty reduces Nepal's territory but preserves independence.<br>
<strong>1846–1951</strong> — Rana oligarchy: hereditary prime ministers, European-style palaces, closed borders.<br>
<strong>1950–51</strong> — Democratic revolution; monarchy restored; Nepal opens to the world.<br>
<strong>1960</strong> — King Mahendra dissolves Parliament, institutes Panchayat system.<br>
<strong>1990</strong> — People's Movement restores multiparty democracy.<br>
<strong>1996–2006</strong> — Maoist People's War and civil conflict.<br>
<strong>2001</strong> — Royal Massacre; King Birendra and royal family killed.<br>
<strong>2006</strong> — Comprehensive Peace Agreement ends conflict.<br>
<strong>2008</strong> — Nepal declared a Federal Democratic Republic; monarchy abolished.<br>
<strong>2015</strong> — Gorkha Earthquake; new Constitution promulgated.<br><br>
<em>Which period would you like to explore in depth?</em>`
    },
  ];

  /** Find matching response for a given query string */
  function findResponse(query) {
    const q = query.toLowerCase();
    for (const entry of CHAT_RESPONSES) {
      if (entry.keywords.some(kw => q.includes(kw))) {
        return typeof entry.response === 'function' ? entry.response() : entry.response;
      }
    }
    return null;
  }

  /** Intelligent fallback — suggests most relevant topic */
  function buildFallback(query) {
    const suggestions = [
      { trigger: ['music','song','sing'], suggest: 'Narayan Gopal or the Sarangi tradition' },
      { trigger: ['book','novel','story','fiction'], suggest: 'Muna Madan or Karnali Blues' },
      { trigger: ['history','king','war','battle'], suggest: 'the Gorkha Unification or the Maoist conflict' },
      { trigger: ['festival','celebrate','puja'], suggest: 'Dashain or Tihar' },
      { trigger: ['art','paint','architecture','temple'], suggest: 'Newari architecture or Thangka painting' },
      { trigger: ['language','speak','write'], suggest: 'the Nepali language or Newari Nepal Bhasa' },
    ];
    const q = query.toLowerCase();
    let suggest = 'Muna Madan, the Sarangi, Rana architecture, or Nepal\'s history';
    for (const s of suggestions) {
      if (s.trigger.some(t => q.includes(t))) { suggest = s.suggest; break; }
    }
    return `I have deep knowledge of Nepali cultural heritage, but my indexed knowledge doesn't cover <em>"${escHtml(query)}"</em> specifically.<br><br>
Based on your question, you might be interested in asking about <strong>${suggest}</strong>. You can also try the quick question buttons above.<br><br>
My expertise covers: Nepali literature and poets, traditional music and instruments, history from the Licchavi period to the Republic, festivals and rituals, religious traditions (Hindu and Buddhist), architecture, art, geography, language, food culture, and the living folk traditions of Nepal's 100+ ethnic communities.<br><br>
<em>Please rephrase your question using an author name, title, instrument, festival, historical figure, or cultural topic and I will do my best to answer thoroughly.</em>`;
  }

  /** Public: triggered by preset buttons and free-type input */
  window.triggerChat = function (query) {
    if (!chatBody) return;
    // Append user message — insert before typing indicator
    const userMsg = document.createElement('div');
    userMsg.className = 'msg user';
    userMsg.innerText = query;
    chatBody.insertBefore(userMsg, typingEl);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Show typing indicator
    if (typingEl) typingEl.classList.add('visible');
    chatBody.scrollTop = chatBody.scrollHeight;

    // Simulate processing time proportional to response length
    const delay = 1200 + Math.random() * 800;
    setTimeout(() => {
      if (typingEl) typingEl.classList.remove('visible');
      const responseHtml = findResponse(query) || buildFallback(query);
      const botMsg = document.createElement('div');
      botMsg.className = 'msg bot';
      botMsg.innerHTML = responseHtml;
      chatBody.insertBefore(botMsg, typingEl);
      chatBody.scrollTop = chatBody.scrollHeight;
    }, delay);
  };

  // ─── Init ─────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => { renderBooks(ARCHIVES); });
  if (document.readyState !== 'loading') renderBooks(ARCHIVES);

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();

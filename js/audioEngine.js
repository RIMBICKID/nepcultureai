/**
 * NepCulture — audioEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Web Audio API synthesizer: generates a UNIQUE, deterministic audio loop for
 * every genre × mood combination (19 genres × 14 moods = 266 distinct sounds).
 *
 * No audio files required — all sound is synthesized in the browser.
 *
 * Architecture:
 *   • GENRE_PROFILES  → timbre (oscillator type, filter, octave, rhythm grid, effects)
 *   • MOOD_PROFILES   → musical feel (scale, BPM, dynamics, attack/release)
 *   • combo hash      → unique note sequence + rhythm variation per combo
 *   • 16-step lookahead sequencer with proper Web Audio scheduling
 *
 * Public API:
 *   NepAudio.load(genre, mood, tempo, musicalKey)
 *   NepAudio.play()
 *   NepAudio.pause()
 *   NepAudio.stop()
 *   NepAudio.seek(ratio 0–1)
 *   NepAudio.isPlaying()     → bool
 *   NepAudio.getCurrentTime()  → seconds (0 – TRACK_DURATION)
 *   NepAudio.getDuration()     → TRACK_DURATION
 *   NepAudio.onTimeUpdate(fn)  → fn called ~30fps with (currentTime, duration)
 */

window.NepAudio = (function () {
  'use strict';

  // ─── Constants ─────────────────────────────────────────────────────────────
  const TRACK_DURATION  = 200;   // simulated track length in seconds
  const STEPS           = 16;    // sequencer steps per loop
  const LOOKAHEAD_SEC   = 0.12;  // seconds to schedule ahead
  const SCHEDULER_MS    = 30;    // scheduler poll interval (ms)
  const ROOT_NOTES = {
    'C Major': 60, 'C Minor': 60, 'D Major': 62, 'D Minor': 62,
    'E Minor': 64, 'F Major': 65, 'G Major': 67,
    'A Major': 69, 'A Minor': 69, 'B Minor': 71,
  };

  // ─── Genre profiles (timbre / rhythm character) ───────────────────────────
  // beatGrid: 16-step base rhythm (1=note, 0=rest), used as seed for variation
  const GENRE_PROFILES = {
    Rap:      { oscType:'square',   octave:2, fFreq:560,  fQ:4,  fType:'bandpass', subBass:true,  chorus:false, beatGrid:[1,0,0,1,1,0,1,0, 1,0,0,1,1,0,0,1] },
    Rock:     { oscType:'sawtooth', octave:3, fFreq:2200, fQ:7,  fType:'lowpass',  subBass:false, chorus:false, beatGrid:[1,1,0,1,1,0,1,1, 0,1,0,1,1,0,1,0] },
    RnB:      { oscType:'sine',     octave:3, fFreq:1100, fQ:2,  fType:'lowpass',  subBass:false, chorus:true,  beatGrid:[1,0,1,0,0,1,0,1, 1,0,0,1,0,1,0,0] },
    Jazz:     { oscType:'triangle', octave:3, fFreq:1900, fQ:1,  fType:'highpass', subBass:false, chorus:false, beatGrid:[1,0,1,0,1,0,1,0, 0,1,0,1,0,0,1,0] },
    Folk:     { oscType:'triangle', octave:4, fFreq:2100, fQ:1,  fType:'lowpass',  subBass:false, chorus:false, beatGrid:[1,0,0,1,0,0,1,0, 0,1,0,0,1,0,0,1] },
    Tamang:   { oscType:'sine',     octave:4, fFreq:3200, fQ:3,  fType:'bandpass', subBass:false, chorus:false, beatGrid:[1,1,1,0,1,1,1,0, 1,1,0,1,1,1,0,1] },
    Newari:   { oscType:'sine',     octave:5, fFreq:4200, fQ:7,  fType:'bandpass', subBass:false, chorus:false, beatGrid:[1,0,1,0,1,0,0,1, 0,1,0,1,0,0,1,0] },
    Bhajan:   { oscType:'sine',     octave:3, fFreq:850,  fQ:1,  fType:'lowpass',  subBass:false, chorus:true,  beatGrid:[1,0,0,0,1,0,0,0, 1,0,0,0,1,0,0,0] },
    Classical:{ oscType:'sine',     octave:4, fFreq:3100, fQ:1,  fType:'lowpass',  subBass:false, chorus:false, beatGrid:[1,0,0,1,0,0,1,0, 1,0,0,0,1,0,0,1] },
    Dohori:   { oscType:'triangle', octave:4, fFreq:1600, fQ:2,  fType:'lowpass',  subBass:false, chorus:false, beatGrid:[1,0,1,0,1,0,1,0, 0,1,0,1,0,1,0,0] },
    Pop:      { oscType:'sawtooth', octave:4, fFreq:3100, fQ:3,  fType:'lowpass',  subBass:false, chorus:true,  beatGrid:[1,0,1,1,0,1,1,0, 1,0,1,1,0,1,0,1] },
    Lofi:     { oscType:'triangle', octave:3, fFreq:820,  fQ:2,  fType:'lowpass',  subBass:false, chorus:true,  beatGrid:[1,0,0,0,1,0,0,1, 0,0,1,0,0,0,1,0] },
    Fusion:   { oscType:'sawtooth', octave:3, fFreq:1550, fQ:4,  fType:'bandpass', subBass:false, chorus:true,  beatGrid:[1,0,1,0,1,1,0,1, 0,1,0,1,1,0,0,1] },
    Ambient:  { oscType:'sine',     octave:3, fFreq:620,  fQ:1,  fType:'lowpass',  subBass:false, chorus:true,  beatGrid:[1,0,0,0,0,0,1,0, 0,0,0,1,0,0,0,0] },
    Epic:     { oscType:'sawtooth', octave:2, fFreq:2600, fQ:5,  fType:'lowpass',  subBass:true,  chorus:false, beatGrid:[1,1,0,1,0,1,1,0, 1,0,1,0,1,1,0,1] },
    Suspense: { oscType:'sawtooth', octave:2, fFreq:420,  fQ:9,  fType:'bandpass', subBass:false, chorus:false, beatGrid:[1,0,0,1,0,0,0,1, 0,0,1,0,0,0,0,1] },
    Chill:    { oscType:'triangle', octave:4, fFreq:1050, fQ:1,  fType:'lowpass',  subBass:false, chorus:true,  beatGrid:[1,0,0,1,0,0,0,0, 1,0,0,0,0,0,1,0] },
    Happy:    { oscType:'triangle', octave:4, fFreq:3600, fQ:2,  fType:'lowpass',  subBass:false, chorus:false, beatGrid:[1,1,0,1,1,0,1,1, 1,0,1,1,0,1,1,0] },
    Sad:      { oscType:'sine',     octave:3, fFreq:720,  fQ:1,  fType:'lowpass',  subBass:false, chorus:false, beatGrid:[1,0,0,0,1,0,0,0, 0,0,1,0,0,0,0,1] },
  };

  // ─── Mood profiles (musical feel / scale / dynamics) ─────────────────────
  // Scales are intervals in semitones from the root note
  const MOOD_PROFILES = {
    Aggressive: { scale:[0,2,3,5,7,8,10],   bpm:145, attackMs:5,   releaseMs:100,  vel:0.92 },
    Rebellious: { scale:[0,1,3,5,7,8,10],   bpm:136, attackMs:8,   releaseMs:130,  vel:0.85 },
    Passionate: { scale:[0,2,4,5,7,9,11],   bpm:108, attackMs:28,  releaseMs:380,  vel:0.80 },
    Triumphant: { scale:[0,2,4,5,7,9,11],   bpm:128, attackMs:15,  releaseMs:260,  vel:0.88 },
    Reflective: { scale:[0,2,3,5,7,9,10],   bpm:82,  attackMs:42,  releaseMs:520,  vel:0.65 },
    Melancholic:{ scale:[0,2,3,5,7,8,10],   bpm:64,  attackMs:65,  releaseMs:720,  vel:0.58 },
    Nostalgic:  { scale:[0,2,4,7,9],         bpm:88,  attackMs:38,  releaseMs:460,  vel:0.68 },
    Longing:    { scale:[0,2,3,5,7,8,10],   bpm:67,  attackMs:75,  releaseMs:820,  vel:0.56 },
    Mysterious: { scale:[0,2,4,6,8,10],     bpm:73,  attackMs:95,  releaseMs:640,  vel:0.52 },
    Uplifting:  { scale:[0,2,4,5,7,9,11],   bpm:130, attackMs:12,  releaseMs:210,  vel:0.82 },
    Romantic:   { scale:[0,2,4,6,7,9,11],   bpm:90,  attackMs:48,  releaseMs:560,  vel:0.72 },
    Playful:    { scale:[0,2,4,7,9],         bpm:148, attackMs:8,   releaseMs:105,  vel:0.78 },
    Peaceful:   { scale:[0,2,4,5,7,9,11],   bpm:56,  attackMs:130, releaseMs:950,  vel:0.48 },
    Spiritual:  { scale:[0,1,4,5,7,8,11],   bpm:60,  attackMs:160, releaseMs:1300, vel:0.52 },
  };

  // ─── Engine state ─────────────────────────────────────────────────────────
  let ctx           = null;
  let masterGain    = null;
  let reverbNode    = null;
  let reverbGain    = null;
  let dryGain       = null;
  let profile       = null;
  let _playing      = false;
  let schedulerTimer= null;
  let currentStep   = 0;
  let nextNoteTime  = 0;
  let playStartWall = 0;   // wall clock ms when play() was last called
  let virtualOffset = 0;   // accumulated virtual seconds before current play() call
  let timeUpdateCb  = null;
  let rafHandle     = null;

  // ─── Utilities ────────────────────────────────────────────────────────────

  /** Deterministic 32-bit hash of a string (djb2 variant) */
  function hashString(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  /** Linear Congruential Generator step — used to derive per-step parameters */
  function lcg(seed) {
    return Math.abs((seed * 1664525 + 1013904223) | 0);
  }

  /** MIDI note number → Hz */
  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /** Create a simple impulse-response reverb */
  function createReverb(audioCtx, durationSec, decay) {
    const rate = audioCtx.sampleRate;
    const len  = Math.floor(rate * durationSec);
    const buf  = audioCtx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    const conv = audioCtx.createConvolver();
    conv.buffer = buf;
    return conv;
  }

  // ─── Profile builder — creates all synthesis params for a genre×mood combo ─

  function buildProfile(genre, mood, tempo, musicalKey) {
    const gp   = GENRE_PROFILES[genre]  || GENRE_PROFILES.Fusion;
    const mp   = MOOD_PROFILES[mood]    || MOOD_PROFILES.Reflective;
    const seed = hashString(genre + '_' + mood);

    // Tempo: user-specified > mood default, clamped 40–220
    const bpm  = Math.min(220, Math.max(40, tempo || mp.bpm));
    // 8th-note step duration in seconds
    const stepDuration = 60 / bpm / 2;

    // Root MIDI: from key selection + genre octave shift
    const keyMidi  = ROOT_NOTES[musicalKey] || 60;
    const rootMidi = keyMidi + (gp.octave - 4) * 12;

    // Filter frequency: genre base + unique offset derived from seed
    const filterFreqFinal = gp.fFreq + (seed % 380);
    const filterQFinal    = gp.fQ   + ((seed >> 8) % 5) * 0.4;

    // Detune in cents: unique per combo
    const detune = (seed >> 4) % 50;

    // Reverb level: more for ambient/spiritual/classical genres/moods
    const reverbyGenres  = ['Ambient','Bhajan','Classical','Suspense','Lofi'];
    const reverbMoods    = ['Spiritual','Peaceful','Mysterious','Melancholic'];
    const baseReverb = (reverbyGenres.includes(genre) || reverbMoods.includes(mood)) ? 0.45 : 0.18;
    const reverbAmt  = baseReverb + (seed % 20) * 0.01;

    // Build unique 16-step rhythm from genre grid + combo seed
    const rhythm = buildRhythm(gp.beatGrid, seed);

    // Build unique 16-note melody sequence from mood scale + combo seed
    const noteSeq = buildNoteSequence(mp.scale, rootMidi, seed, 16);

    // Envelope times (seconds) — blend of genre and mood, shifted by seed fraction
    const attackTime  = (mp.attackMs  + (seed % 20))              / 1000;
    const releaseTime = (mp.releaseMs + ((seed >> 6) % 200))      / 1000;

    return {
      genre, mood, bpm, stepDuration,
      oscType:    gp.oscType,
      subBass:    gp.subBass,
      chorus:     gp.chorus,
      filterFreq: filterFreqFinal,
      filterQ:    filterQFinal,
      filterType: gp.fType,
      detune,
      reverbAmt,
      rhythm,
      noteSeq,
      attackTime,
      releaseTime,
      velocity:   mp.vel,
    };
  }

  /** Build a 16-step rhythm — genre grid xor'd with seed-derived bits */
  function buildRhythm(baseGrid, seed) {
    return baseGrid.map((beat, i) => {
      // 72% chance to keep genre's base rhythm; 28% flipped by seed
      const keep = (Math.abs(lcg(seed + i * 31)) % 100) < 72;
      return keep ? beat : ((seed >> i) & 1);
    });
  }

  /** Build a 16-note melodic sequence using the mood scale + LCG seeding */
  function buildNoteSequence(scale, rootMidi, seed, count) {
    const notes = [];
    let h = seed;
    for (let i = 0; i < count; i++) {
      h = lcg(h + i * 17);
      const scaleIdx   = Math.abs(h) % scale.length;
      const octaveVar  = (Math.abs(lcg(h + 999)) % 3) - 1; // -1, 0, or +1 octave
      notes.push(rootMidi + scale[scaleIdx] + octaveVar * 12);
    }
    return notes;
  }

  // ─── Audio graph init ─────────────────────────────────────────────────────

  function initAudioGraph() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.72;

    // Reverb chain
    reverbNode  = createReverb(ctx, 2.2, 0.65);
    reverbGain  = ctx.createGain();
    dryGain     = ctx.createGain();

    masterGain.connect(dryGain);
    masterGain.connect(reverbNode);
    reverbNode.connect(reverbGain);

    dryGain.connect(ctx.destination);
    reverbGain.connect(ctx.destination);
  }

  function updateReverbMix(amt) {
    if (!reverbGain || !dryGain) return;
    const t = ctx.currentTime + 0.02;
    reverbGain.gain.linearRampToValueAtTime(amt,       t);
    dryGain.gain.linearRampToValueAtTime(1 - amt * 0.5, t);
  }

  // ─── Note playback ────────────────────────────────────────────────────────

  /**
   * Schedule a single note at `startTime` with full synthesis chain.
   */
  function playNote(freq, startTime, attackTime, releaseTime, velocity, oscType, filterType, filterFreq, filterQ, detune, isSubBass) {
    if (!ctx || !masterGain) return;

    const totalDur = attackTime + releaseTime + 0.05;

    // Create nodes
    const osc    = ctx.createOscillator();
    const gain   = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type            = oscType;
    osc.frequency.value = freq;
    osc.detune.value    = detune;

    filter.type            = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value         = filterQ;

    // Gain envelope
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(velocity, startTime + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attackTime + releaseTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + totalDur);

    // Sub-bass: one octave down, pure sine
    if (isSubBass) {
      const subOsc  = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type            = 'sine';
      subOsc.frequency.value = freq / 2;
      subGain.gain.setValueAtTime(0.0001, startTime);
      subGain.gain.linearRampToValueAtTime(velocity * 0.55, startTime + attackTime * 1.5);
      subGain.gain.exponentialRampToValueAtTime(0.0001, startTime + attackTime + releaseTime * 1.2);
      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(startTime);
      subOsc.stop(startTime + totalDur + 0.1);
    }
  }

  /**
   * Play a note with optional chorus (slightly detuned second voice).
   */
  function playNoteWithChorus(freq, startTime, p) {
    playNote(freq, startTime, p.attackTime, p.releaseTime, p.velocity,
      p.oscType, p.filterType, p.filterFreq, p.filterQ, p.detune, p.subBass);

    if (p.chorus) {
      playNote(freq, startTime + 0.008,
        p.attackTime * 1.15, p.releaseTime * 0.85, p.velocity * 0.38,
        'sine', 'lowpass', p.filterFreq * 1.4, p.filterQ * 0.5,
        p.detune + 18, false);
    }
  }

  // ─── Sequencer ────────────────────────────────────────────────────────────

  function scheduleStep(step, time) {
    if (!profile) return;
    const idx = step % STEPS;
    if (!profile.rhythm[idx]) return; // rest
    const midi = profile.noteSeq[idx];
    const freq = midiToFreq(Math.max(24, Math.min(108, midi))); // clamp to audible range
    playNoteWithChorus(freq, time, profile);
  }

  function advanceStep() {
    currentStep = (currentStep + 1) % STEPS;
    nextNoteTime += profile.stepDuration;
  }

  function scheduler() {
    if (!_playing || !profile) return;
    while (nextNoteTime < ctx.currentTime + LOOKAHEAD_SEC) {
      scheduleStep(currentStep, nextNoteTime);
      advanceStep();
    }
    schedulerTimer = setTimeout(scheduler, SCHEDULER_MS);
  }

  // ─── RAF-based time update callback ──────────────────────────────────────

  function startRaf() {
    stopRaf();
    function tick() {
      if (!_playing) return;
      if (timeUpdateCb) {
        timeUpdateCb(getCurrentTime(), TRACK_DURATION);
      }
      rafHandle = requestAnimationFrame(tick);
    }
    rafHandle = requestAnimationFrame(tick);
  }

  function stopRaf() {
    if (rafHandle) { cancelAnimationFrame(rafHandle); rafHandle = null; }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Load a genre×mood combination — builds the synthesis profile.
   * Must be called before play().
   * @param {string} genre      e.g. "Rap"
   * @param {string} mood       e.g. "Aggressive"
   * @param {number} tempo      BPM, or 0 to use mood default
   * @param {string} musicalKey e.g. "C Major"
   */
  function load(genre, mood, tempo, musicalKey) {
    stop();
    initAudioGraph();
    profile = buildProfile(genre, mood, tempo || 0, musicalKey || 'C Major');
    updateReverbMix(profile.reverbAmt);
  }

  /**
   * Start (or resume) playback.
   */
  function play() {
    if (!profile) return;
    if (_playing) return;
    initAudioGraph();

    // Resume AudioContext if suspended (required by browser autoplay policy)
    if (ctx.state === 'suspended') ctx.resume();

    _playing      = true;
    playStartWall = performance.now();

    // Align sequencer to correct step based on virtual time
    const virtualSec  = virtualOffset % (STEPS * profile.stepDuration);
    currentStep       = Math.floor(virtualSec / profile.stepDuration) % STEPS;
    nextNoteTime      = ctx.currentTime + 0.04; // small startup gap

    scheduler();
    startRaf();
  }

  /**
   * Pause playback, preserving position.
   */
  function pause() {
    if (!_playing) return;
    _playing = false;
    clearTimeout(schedulerTimer);
    stopRaf();
    virtualOffset += (performance.now() - playStartWall) / 1000;
  }

  /**
   * Stop playback and reset to beginning.
   */
  function stop() {
    _playing = false;
    clearTimeout(schedulerTimer);
    stopRaf();
    virtualOffset = 0;
    currentStep   = 0;
    nextNoteTime  = 0;
  }

  /**
   * Seek to a position in the virtual track.
   * @param {number} ratio  0.0 to 1.0
   */
  function seek(ratio) {
    const wasPlaying = _playing;
    if (wasPlaying) pause();
    virtualOffset = Math.max(0, Math.min(TRACK_DURATION - 0.1, ratio * TRACK_DURATION));
    if (wasPlaying) play();
  }

  /** @returns {boolean} */
  function isPlaying() { return _playing; }

  /** @returns {number} current virtual playback position in seconds */
  function getCurrentTime() {
    let t = virtualOffset;
    if (_playing) t += (performance.now() - playStartWall) / 1000;
    return Math.min(TRACK_DURATION, t) % TRACK_DURATION;
  }

  /** @returns {number} total virtual track duration */
  function getDuration() { return TRACK_DURATION; }

  /**
   * Register a callback to receive time updates (~30fps).
   * @param {function(currentTime, duration)} fn
   */
  function onTimeUpdate(fn) { timeUpdateCb = fn; }

  /** Format seconds as M:SS */
  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /** Return the formatted total duration string */
  function getDurationString() {
    return formatTime(TRACK_DURATION);
  }

  console.info('[NepAudio] audioEngine.js loaded — 266 unique combo sounds ready.');

  return { load, play, pause, stop, seek, isPlaying, getCurrentTime, getDuration, getDurationString, onTimeUpdate, formatTime };

})();

/* TC QUEST v12 — original looping 8-bit adventure BGM.
   Generated in-browser with Web Audio; no third-party recordings or downloads. */
(() => {
  'use strict';
  const HALF_BEAT = 60 / 132 / 2;
  const MELODY = [
    [74,null,76,78,81,null,78,76],
    [74,null,69,74,76,78,76,null],
    [79,null,81,83,81,79,78,null],
    [76,null,78,76,73,69,71,null],
    [74,76,78,81,78,null,76,null],
    [74,71,74,78,76,null,74,null],
    [71,74,76,79,78,76,74,71],
    [73,null,76,78,76,73,69,null],
    [79,null,78,76,74,null,76,78],
    [81,null,78,76,74,71,74,null],
    [76,78,79,83,81,79,78,76],
    [73,76,78,null,76,73,71,69],
    [78,null,81,83,81,78,76,null],
    [79,78,76,74,71,null,74,76],
    [73,76,78,81,83,81,78,76],
    [74,null,69,74,78,null,74,null]
  ].flat();
  // D major: D – Bm – G – A / D – Bm – Em – A / G – D – Em – A / Bm – G – A – D.
  const CHORDS = [
    [50,62,66,69],[47,59,62,66],[43,55,59,62],[45,57,61,64],
    [50,62,66,69],[47,59,62,66],[40,52,55,59],[45,57,61,64],
    [43,55,59,62],[50,62,66,69],[40,52,55,59],[45,57,61,64],
    [47,59,62,66],[43,55,59,62],[45,57,61,64],[50,62,66,69]
  ];
  let context = null, bus = null, timer = null;
  let enabled = true, active = false, paused = false;
  let position = 0, nextTime = 0;

  function ensureAudio() {
    if (context) return true;
    const AudioContextType = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextType) return false;
    try {
      context = new AudioContextType();
      bus = context.createGain();
      bus.gain.value = 0;
      bus.connect(context.destination);
      return true;
    } catch (err) {
      console.warn('TC QUEST BGM not supported', err);
      context = null;
      return false;
    }
  }
  function volume(target) {
    if (!context || !bus) return;
    const t = context.currentTime;
    bus.gain.cancelScheduledValues(t);
    bus.gain.setTargetAtTime(target, t, 0.045);
  }
  function midiHz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  function note(midi, at, duration, level, wave = 'triangle') {
    if (!context || !bus) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(midiHz(midi), at);
    const attack = Math.min(0.022, duration * 0.16);
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.linearRampToValueAtTime(level, at + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope);
    envelope.connect(bus);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
  }
  function drum(at, deep) {
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(deep ? 106 : 230, at);
    oscillator.frequency.exponentialRampToValueAtTime(deep ? 47 : 95, at + (deep ? 0.15 : 0.06));
    envelope.gain.setValueAtTime(deep ? 0.026 : 0.009, at);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + (deep ? 0.16 : 0.065));
    oscillator.connect(envelope); envelope.connect(bus);
    oscillator.start(at); oscillator.stop(at + (deep ? 0.17 : 0.075));
  }
  function step(i, at) {
    const local = i % 8, bar = Math.floor(i / 8) % CHORDS.length;
    const chord = CHORDS[bar];
    const lead = MELODY[i % MELODY.length];
    if (lead !== null) {
      note(lead, at, HALF_BEAT * (local === 7 ? 1.7 : 0.88), 0.048, 'triangle');
      if (local === 0 || local === 4) note(lead - 12, at, HALF_BEAT * 1.2, 0.009, 'sine');
    }
    if (local === 0) {
      // Sustained chord provides a gentle fantasy-style pad underneath the melody.
      for (let n = 1; n < 4; n++) note(chord[n], at, HALF_BEAT * 5.7, 0.007, 'sine');
    }
    if (local === 0 || local === 4) {
      note(chord[0], at, HALF_BEAT * 1.7, 0.032, 'triangle');
      drum(at, true);
    } else if (local === 2 || local === 6) {
      drum(at, false);
    }
    if (local % 2 === 1) {
      note(chord[1 + ((local - 1) / 2) % 3] + 12, at, HALF_BEAT * 0.82, 0.014, 'sine');
    }
  }
  function schedule() {
    if (!active || paused || !enabled || !context || context.state !== 'running' || document.hidden) return;
    let guard = 0;
    while (nextTime < context.currentTime + 0.27 && guard++ < 8) {
      step(position++, nextTime);
      nextTime += HALF_BEAT;
    }
  }
  function halt() {
    if (timer !== null) { clearInterval(timer); timer = null; }
    volume(0);
  }
  function wake() {
    if (!active || paused || !enabled || document.hidden || !ensureAudio()) return;
    const p = context.resume();
    if (p && typeof p.catch === 'function') p.catch(() => {});
    nextTime = context.currentTime + 0.07;
    volume(0.52); // BGM is intentionally quieter than in-game SFX.
    if (timer !== null) clearInterval(timer);
    timer = setInterval(schedule, 70);
    schedule();
  }
  window.TCQuestBGM = {
    play() { active = true; paused = false; position = 0; wake(); },
    pause() { paused = true; halt(); },
    resume() { paused = false; wake(); },
    stop() { active = false; paused = false; halt(); },
    setEnabled(value) { enabled = !!value; if (!enabled) halt(); else if (active && !paused) wake(); },
    get enabled() { return enabled; }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) halt();
    else if (active && enabled && !paused) wake();
  });
})();

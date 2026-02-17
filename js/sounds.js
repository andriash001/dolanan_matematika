"use strict";
/* ============================================
   DOLANAN MATEMATIKA - SOUND EFFECTS (Web Audio API)
   Zero external audio files — all generated programmatically.
   ============================================ */

const SFX = (() => {
    let ctx = null;
    let muted = false;

    // Restore mute preference
    try {
        muted = localStorage.getItem('dolanan_muted') === '1';
    } catch (e) { /* ignore */ }

    function ensureContext() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    function isMuted() { return muted; }

    function toggleMute() {
        muted = !muted;
        try { localStorage.setItem('dolanan_muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
        return muted;
    }

    // --- Low-level helpers ---
    function playTone(freq, duration, type, volume, rampDown) {
        if (muted) return;
        const c = ensureContext();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume || 0.15, c.currentTime);
        if (rampDown !== false) {
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        }
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + duration);
    }

    function playNoise(duration, volume) {
        if (muted) return;
        const c = ensureContext();
        const bufferSize = c.sampleRate * duration;
        const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = c.createBufferSource();
        source.buffer = buffer;
        const gain = c.createGain();
        gain.gain.setValueAtTime(volume || 0.05, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        const filter = c.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        source.start();
    }

    // --- Sound effects ---

    /** Cell claimed — bright pop */
    function place() {
        playTone(880, 0.12, 'sine', 0.12);
        setTimeout(() => playTone(1100, 0.08, 'sine', 0.08), 50);
    }

    /** Coin flip — metallic whoosh */
    function coinFlip() {
        if (muted) return;
        const c = ensureContext();
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                playTone(2000 + Math.random() * 1500, 0.06, 'triangle', 0.04);
            }, i * 80);
        }
    }

    /** Coin result reveal */
    function coinResult() {
        playTone(523, 0.15, 'sine', 0.1);
        setTimeout(() => playTone(659, 0.15, 'sine', 0.1), 120);
        setTimeout(() => playTone(784, 0.2, 'sine', 0.12), 240);
    }

    /** Win celebration — happy ascending jingle */
    function win() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => playTone(freq, 0.25, 'sine', 0.12), i * 150);
        });
        // Sparkle on top
        setTimeout(() => {
            playTone(1568, 0.3, 'triangle', 0.06);
            playTone(2093, 0.4, 'triangle', 0.05);
        }, 600);
    }

    /** Timer warning tick */
    function timerTick() {
        playTone(1000, 0.06, 'square', 0.06);
    }

    /** Timer urgent (≤3s) */
    function timerUrgent() {
        playTone(1200, 0.08, 'square', 0.08);
        setTimeout(() => playTone(1200, 0.08, 'square', 0.08), 100);
    }

    /** Turn start — subtle notification */
    function turnStart() {
        playTone(660, 0.1, 'sine', 0.06);
    }

    /** Invalid / auto-lose — low buzz */
    function error() {
        playTone(200, 0.2, 'sawtooth', 0.08);
        setTimeout(() => playTone(180, 0.25, 'sawtooth', 0.06), 100);
    }

    /** Draw — neutral tone */
    function draw() {
        playTone(440, 0.2, 'sine', 0.08);
        setTimeout(() => playTone(350, 0.3, 'sine', 0.08), 200);
    }

    /** Click / select on side board */
    function click() {
        playTone(600, 0.06, 'sine', 0.08);
    }

    return {
        isMuted,
        toggleMute,
        ensureContext,
        place,
        coinFlip,
        coinResult,
        win,
        timerTick,
        timerUrgent,
        turnStart,
        error,
        draw,
        click
    };
})();

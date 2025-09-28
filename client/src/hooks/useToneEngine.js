import { eye } from '@tensorflow/tfjs';
import { useRef } from 'react';
import * as Tone from 'tone';

const DBG = false;

export function useToneEngine() {

    // === Hooks declared first (stable order) ===
    const drumSamplerRef  = useRef(null);
    const sensitivityRef  = useRef(0.55); // velocity threshold
    const drumGainRef     = useRef(null);


    // === Gain for mute/volume ===
    if (!drumGainRef.current) {
        drumGainRef.current = new Tone.Gain(1);
        // don’t connect yet — we’ll allow LoopsPage to attach both to speakers & recorder
    }

    // === Sampler (connect separately) ===
    if (!drumSamplerRef.current) {
        drumSamplerRef.current = new Tone.Sampler({
            urls: {
                C1: "tambor.mp3",
                D1: "snare.mp3",
                E1: "hihat-open.mp3"
            },
            baseUrl: "/samples/drums/",
            onload: () => {
                drumsLoadedRef.current = true;
                if (DBG) console.log("[Tone] Drum samples loaded");
            }
        });
        drumSamplerRef.current.connect(drumGainRef.current);
    }
    const drum = drumSamplerRef.current;

    // STRINGS
    const stringSamplerRef = useRef(null);
    if (!stringSamplerRef.current) {
        stringSamplerRef.current = new Tone.Sampler({
            urls: {
                "A2": "Nice_Akai_Strings_A2.wav",
                "A2m": "Nice_Akai_Strings_A2m.wav",
                "A#2": "Nice_Akai_Strings_A#2.wav",
                "A#2m": "Nice_Akai_Strings_A#2m.wav",
                "B2": "Nice_Akai_Strings_B2.wav",
                "B2m": "Nice_Akai_Strings_B2m.wav",
                "C2": "Nice_Akai_Strings_C2.wav",
                "C2m": "Nice_Akai_Strings_C2m.wav",
                "C#2": "Nice_Akai_Strings_C#2.wav",
                "C#2m": "Nice_Akai_Strings_C#2m.wav",
                "D2": "Nice_Akai_Strings_D2.wav",
                "D2m": "Nice_Akai_Strings_D2m.wav",
                "D#2": "Nice_Akai_Strings_D#2.wav",
                "D#2m": "Nice_Akai_Strings_D#2m.wav",
                "E2": "Nice_Akai_Strings_E2.wav",
                "E2m": "Nice_Akai_Strings_E2m.wav",
                "F2": "Nice_Akai_Strings_F2.wav",
                "F2m": "Nice_Akai_Strings_F2m.wav",
                "F#2": "Nice_Akai_Strings_F#2.wav",
                "F#2m": "Nice_Akai_Strings_F#2m.wav",
                "G2": "Nice_Akai_Strings_G2.wav",
                "G2m": "Nice_Akai_Strings_G2m.wav",
                "G#2": "Nice_Akai_Strings_G#2.wav",
                "G#2m": "Nice_Akai_Strings_G#2m.wav",
            },
            baseUrl: "/samples/strings/",
            onload: () => {
                if (DBG) console.log("[Tone] String samples loaded");
            }
        }).toDestination();
    }
    const strings = stringSamplerRef.current;

    // Ready Flags
    const audioStartedRef = useRef(false);
    const drumsLoadedRef  = useRef(false);
    const stringsLoadedRef = useRef(false);

    const startAudio = async () => { 
        await Tone.start(); 
        audioStartedRef.current = true;
        if (DBG) console.log("[Tone] AudioContext started");
    };

    function ensureReady(name) {
        if (!audioStartedRef.current) {
            if (DBG) console.warn(`[${name}] blocked: audio not started`);
            return false;
        }
        if (!drumsLoadedRef.current) {
            if (DBG) console.warn(`[${name}] blocked: samples not loaded`);
            return false;
        }
        return true;
    }

    // PLAY HELPERS
    function playLow()   { if (!ensureReady()) return;  drum.triggerAttackRelease("C1", "8n"); }
    function playMid()   { if (!ensureReady()) return;  drum.triggerAttackRelease("D1", "8n"); }
    function playHigh()  { if (!ensureReady()) return;  drum.triggerAttackRelease("E1", "8n"); }
    function playChord(name, dur = "2n") {
        if (!ensureReady("Strings")) return;
        strings.triggerAttackRelease(name, dur);
    }

    // === Volume & mute ===
    function setMuted(isMuted) {
        drumGainRef.current?.gain.rampTo(isMuted ? 0 : 1, 0.05);
    }
    function setVolume(vol) {
        drumGainRef.current?.gain.rampTo(vol, 0.05); // expect [0,1]
    }
    function setSensitivity(val) {
        sensitivityRef.current = val; // expect [0,1]
    }

    // === Allow LoopsPage to hook drums into its recorder ===
    function connectTo(node) {
        if (drumGainRef.current && node) {
            drumGainRef.current.connect(node);
        }
    }

    // === Gesture detection ===
    const lastR = useRef({ y: null, t: 0, lastTrig: 0, lastZone: null });
    const lastL = useRef({ y: null, t: 0, lastTrig: 0, lastZone: null });

    const refractoryMS = 150;
    function clamp(v) { return Math.min(1, Math.max(0, v)); }

    const EDGE_LOW = 0.72;
    const EDGE_MID = 0.48;
    const HYST = 0.035;

    function zoneFromYBasic(y) {
        if (y > EDGE_LOW) return "low";
        if (y > EDGE_MID) return "mid";
        return "high";
    }

    function zoneFromYWithHyst(y, prevZone) {
        if (!prevZone) return zoneFromYBasic(y);

        if (prevZone === "low") {
            if (y <= EDGE_LOW - HYST) return "mid";
            return "low";
        }
        if (prevZone === "mid") {
            if (y >= EDGE_LOW + HYST) return "low";
            if (y <= EDGE_MID - HYST) return "high";
            return "mid";
        }
        if (y >= EDGE_MID + HYST) return "mid";
        return "high";
    }

    function triggerZone(zone) {
        if (zone === "low") playLow();
        else if (zone === "mid") playMid();
        else playHigh();
    }

    function handleHand(y, state, lines) {
        const { eyeY, shoulderY, midY } = lines || {};
        if (eyeY == null || shoulderY == null || midY == null) {
            state.y = y;
            state.t = performance.now();
            return;
        }

        const now = performance.now();
        const prevY = state.y;
        if (y > 1) y = clamp(y);

        if (prevY != null) {
            const dt = Math.max(1, now - state.t);
            const dy = y - prevY;
            const vel = (Math.abs(dy) / dt) * 1000;
            const fastEnough = vel > sensitivityRef.current;

            let fired = false;

            if (!fired && fastEnough && prevY > eyeY && y <= eyeY) {
                playHigh(); state.lastTrig = now; fired = true;
            }
            if (!fired && fastEnough && prevY < shoulderY && y >= shoulderY) {
                playMid(); state.lastTrig = now; fired = true;
            }
            if (!fired && fastEnough && prevY < midY && y >= midY) {
                playLow(); state.lastTrig = now; fired = true;
            }
        }

        state.y = y;
        state.t = now;
    }

    function detectHit({ yL, yR, eyeY, shoulderY, midY }) {
        const lines = { eyeY, shoulderY, midY };

        // Drum detection
        if (typeof yR === "number") handleHand(yR, lastR.current, lines);
        if (typeof yL === "number") handleHand(yL, lastL.current, lines);

        // Chord logic
        if (typeof yL === "number" && typeof yR === "number") {
            const syncThreshold = 0.15; // how close yL and yR need to be to count as "sync"
            const diff = Math.abs(yL - yR);

            if (diff < syncThreshold) {
            // Both arms moving together → major chord
            playChord("C2"); // later: pick dynamically
            } else {
            // Arms apart → minor chord
            playChord("Am2"); // later: pick dynamically
            }
        }
    }

    return {
        startAudio,
        setMuted,
        setVolume,
        setSensitivity,
        connectTo, // ✅ new: lets LoopsPage attach to recordingBus
        playLow, playMid, playHigh, playChord,
        detectHit,
        get audioStarted() { return audioStartedRef.current; },
        get drumsLoaded()  { return drumsLoadedRef.current; }
    };
}

import { useRef } from 'react';
import * as Tone from 'tone';

const DBG = false;

export function useToneEngine() {
    // === Hooks declared first (stable order) ===
    const audioStartedRef = useRef(false);
    const drumsLoadedRef  = useRef(false);
    const drumGainRef     = useRef(null);
    const drumSamplerRef  = useRef(null);
    const sensitivityRef  = useRef(0.55); // velocity threshold

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

    // === Core control ===
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

    // === Play helpers ===
    function playLow()  { if (!ensureReady("playLow")) return; drum.triggerAttackRelease("C1", "8n"); }
    function playMid()  { if (!ensureReady("playMid")) return; drum.triggerAttackRelease("D1", "8n"); }
    function playHigh() { if (!ensureReady("playHigh")) return; drum.triggerAttackRelease("E1", "8n"); }

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
        if (typeof yR === "number") handleHand(yR, lastR.current, lines);
        if (typeof yL === "number") handleHand(yL, lastL.current, lines);
    }

    return {
        startAudio,
        setMuted,
        setVolume,
        setSensitivity,
        connectTo, // ✅ new: lets LoopsPage attach to recordingBus
        playLow, playMid, playHigh,
        detectHit,
        get audioStarted() { return audioStartedRef.current; },
        get drumsLoaded()  { return drumsLoadedRef.current; }
    };
}

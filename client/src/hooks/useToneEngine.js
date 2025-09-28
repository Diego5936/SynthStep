import { useRef } from 'react';
import * as Tone from 'tone';

const DBG = false;

export function useToneEngine() {
    // DRUMS
    const drumSamplerRef = useRef(null);
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
        }).toDestination();
    }
    const drum = drumSamplerRef.current;

    // Ready Flags
    const audioStartedRef = useRef(false);
    const drumsLoadedRef  = useRef(false);

    const startAudio = async () => { 
        await Tone.start(); 
        audioStartedRef.current = true;
        if (DBG) console.log("[Tone] AudioContext started");
    };

    function ensureReady(name){
        if (!audioStartedRef.current) { 
            if (DBG) console.warn(`[${name}] blocked: audio not started`); 
            return false; 
        }
        if (!drumsLoadedRef.current)  { 
            if (DBG) console.warn(`[${name}] blocked: samples not loaded`); 
            return false; 
        }
        return true;
    }

    // PLAY HELPERS
    function playLow()   { if (!ensureReady()) return;  drum.triggerAttackRelease("C1", "8n"); }
    function playMid()   { if (!ensureReady()) return;  drum.triggerAttackRelease("D1", "8n"); }
    function playHigh()  { if (!ensureReady()) return;  drum.triggerAttackRelease("E1", "8n"); }

    // Gesture detection
    const lastR = useRef({ y: null, t: 0, lastTrig: 0, lastZone: null });
    const lastL = useRef({ y: null, t: 0, lastTrig: 0, lastZone: null });

    // Height thresholds
    const HEIGHTS = { low: 0.75, mid: 0.5, high: 0.25 };

    // Adjustables
    const velocityThreshold = 0.55;
    const refractoryMS = 150; // min time between hits per hand

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
            if (y <= EDGE_LOW - HYST)  
                return "mid";
            return "low";
        }
        if (prevZone === "mid") {
            if (y >= EDGE_LOW + HYST) 
                return "low";
            if (y <= EDGE_MID - HYST) 
                return "high";
            return "mid";
        }
        if (y >= EDGE_MID + HYST) 
            return "mid";
        return "high";
    }

    function triggerZone(zone) {
        if (zone === "low") 
            playLow();
        else if (zone === "mid") 
            playMid();
        else 
            playHigh();
    }

  function handleHand(y, state) {
    const now = performance.now();

    // Guard
    if (y > 1) 
        y = clamp(y);

    // Velocity for gesture strength
    if (state.y !== null) {
        const dt = Math.max(1, now - state.t);
        const dy = Math.abs(y - state.y);
        const vel = (dy / dt) * 1000;

        // Next zone
        const nextZone = zoneFromYWithHyst(y, state.lastZone);

        // Fire on zone transition w enough velocity
        const zoneChanged = state.lastZone && nextZone !== state.lastZone;
        const canFire = zoneChanged & vel > velocityThreshold && (now - state.lastTrig) > refractoryMS;

        if (canFire && ensureReady()) {
            triggerZone(nextZone);
            state.lastTrig = now;
        }
        state.lastZone = nextZone;
    }
    else {
        state.lastZone = zoneFromYBasic(y);
    }

    state.y = y;
    state.t = now;
    }

    function detectHit({ yL, yR }) {
        // Either/both hands can trigger. Call both detectors each frame.
        if (typeof yR === "number") handleHand(yR, lastR.current);
        if (typeof yL === "number") handleHand(yL, lastL.current);
    }

    return { 
        // Controls
        startAudio,
        // Sounds 
        playLow, playMid, playHigh,
        // Mapping
        detectHit,
    
        get audioStarted() { return audioStartedRef.current; },
        get drumsLoaded()  { return drumsLoadedRef.current;  }
    };
}
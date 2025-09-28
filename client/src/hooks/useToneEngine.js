import { eye } from '@tensorflow/tfjs';
import { useRef } from 'react';
import * as Tone from 'tone';

const DBG = true;

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

    // STRINGS
    const stringRef = useRef(null);
    if (!stringRef.current) {
        stringRef.current = new Tone.Players({
            "A2": "/samples/strings/Nice_Akai_Strings_A2.wav",
            "A2m": "/samples/strings/Nice_Akai_Strings_A2m.wav",
            "A#2": "/samples/strings/Nice_Akai_Strings_A#2.wav",
            "A#2m": "/samples/strings/Nice_Akai_Strings_A#2m.wav",
            "B2": "/samples/strings/Nice_Akai_Strings_B2.wav",
            "B2m": "/samples/strings/Nice_Akai_Strings_B2m.wav",
            "C2": "/samples/strings/Nice_Akai_Strings_C2.wav",
            "C2m": "/samples/strings/Nice_Akai_Strings_C2m.wav",
            "C#2": "/samples/strings/Nice_Akai_Strings_C#2.wav",
            "C#2m": "/samples/strings/Nice_Akai_Strings_C#2m.wav",
            "D2": "/samples/strings/Nice_Akai_Strings_D2.wav",
            "D2m": "/samples/strings/Nice_Akai_Strings_D2m.wav",
            "D#2": "/samples/strings/Nice_Akai_Strings_D#2.wav",
            "D#2m": "/samples/strings/Nice_Akai_Strings_D#2m.wav",
            "E2": "/samples/strings/Nice_Akai_Strings_E2.wav",
            "E2m": "/samples/strings/Nice_Akai_Strings_E2m.wav",
            "F2": "/samples/strings/Nice_Akai_Strings_F2.wav",
            "F2m": "/samples/strings/Nice_Akai_Strings_F2m.wav",
            "F#2": "/samples/strings/Nice_Akai_Strings_F#2.wav",
            "F#2m": "/samples/strings/Nice_Akai_Strings_F#2m.wav",
            "G2": "/samples/strings/Nice_Akai_Strings_G2.wav",
            "G2m": "/samples/strings/Nice_Akai_Strings_G2m.wav",
            "G#2": "/samples/strings/Nice_Akai_Strings_G#2.wav",
            "G#2m": "/samples/strings/Nice_Akai_Strings_G#2m.wav",
        }).toDestination();
    }
    const strings = stringRef.current;

    // Ready Flags
    const audioStartedRef = useRef(false);
    const drumsLoadedRef  = useRef(false);
    const stringsLoadedRef = useRef(false);d
    const lastChordTime = useRef(0);
    const chordCooldown = 500; // ms

    stringsLoadedRef.current = true;

    const startAudio = async () => { 
        await Tone.start(); 
        audioStartedRef.current = true;
        if (DBG) console.log("[Tone] AudioContext started");
    };

    function ensureReady(name){
        if (!audioStartedRef.current) { return false; }

        if (name === "drums" && !drumsLoadedRef.current) return false;
        if (name === "strings" && !stringsLoadedRef.current) return false;

        return true;
    }

    // PLAY HELPERS
    function playLow()   { if (!ensureReady()) return;  drum.triggerAttackRelease("C1", "8n"); }
    function playMid()   { if (!ensureReady()) return;  drum.triggerAttackRelease("D1", "8n"); }
    function playHigh()  { if (!ensureReady()) return;  drum.triggerAttackRelease("E1", "8n"); }
    function playChord(name, dur = "1n") {
        if (!ensureReady("strings")) return;

        const player = strings.player(name);
        if (!player) {
            if (DBG) console.warn(`[Tone] No string sample for chord: ${name}`);
            return;
        }

        player.fadeIn = 0.01;
        player.fadeOut = 0.05;

        const now = Tone.now();
        player.start(now);

        const stopAt = Tone.Time(dur).toSeconds();
        player.stop(now + stopAt);
    }

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

    function handleHand(y, state, lines) {
        const { eyeY, shoulderY, midY } = lines || {};
        if (eyeY == null || shoulderY == null || midY == null) {
            state.y = y;
            state.t = performance.now();
            return;
        }

        const now = performance.now();
        const prevY = state.y;
        if (y > 1)
            y = clamp(y);
        if (prevY != null) {
            const dt = Math.max(1, now - state.t);
            const dy = y - prevY; // signed, positive = down
            const vel = (Math.abs(dy) / dt) * 1000;

            const fastEnough = vel > velocityThreshold;

            let fired = false;

            // High
            if (!fired && fastEnough && prevY > eyeY && y <= eyeY) {
                playHigh();
                state.lastTrig = now;
                fired = true;
            }

            // Mid
            if (!fired && fastEnough && prevY < shoulderY && y >= shoulderY) {
                playMid();
                state.lastTrig = now;
                fired = true;
            }

            // Low
            if (!fired && fastEnough && prevY < midY && y >= midY) {
                playLow();
                state.lastTrig = now;
                fired = true;
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
            const now = performance.now();
            if (now - lastChordTime.current < chordCooldown) return; // cooldown guard

            const avgY = (yL + yR) / 2;
            const diff = Math.abs(yL - yR);
            const syncThreshold = 0.15; // how close yL and yR need to be to count as "synced"
            
            let chord = "C2"; // default chord

            if (avgY < eyeY) {
                chord = "G2";   // high arms → G major
            } else if (avgY < shoulderY) {
                chord = "C2";   // mid arms → C major
            } else if (avgY < midY) {
                chord = "F2";   // low arms → F major
            }

            if (diff >= syncThreshold && !chord.endsWith("m")) {
                if (chord.endsWith("2")) chord += "m";
            }

            if (DBG) console.log("[Chord triggered]", chord);
            playChord(chord);
            lastChordTime.current = now;
        }
    }

    return { 
        // Controls
        startAudio,
        // Sounds 
        playLow, playMid, playHigh, playChord,
        // Mapping
        detectHit,
    
        get audioStarted() { return audioStartedRef.current; },
        get drumsLoaded()  { return drumsLoadedRef.current;  }
    };
}
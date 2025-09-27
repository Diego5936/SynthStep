import { useRef } from 'react';
import * as Tone from 'tone';

const DBG = true;

export function useToneEngine() {
    // DRUMS
    const drumSamplerRef = useRef(null);
    if (!drumSamplerRef.current) {
        drumSamplerRef.current = new Tone.Sampler({
            urls: {
                C1: "cymbal.mp3",
                D1: "drum.mp3",
                E1: "hihat-open.mp3",
                F1: "hihat-quick.mp3",
                G1: "snare.mp3"
            },
            baseUrl: "/samples/drums/",
            onload: () => {
                drumsLoadedRef.current = true; 
                if (DBG) console.log("[Tone] Drum samples loaded");
            }
        }).toDestination();
    }
    const drum = drumSamplerRef.current;
    const audioStartedRef = useRef(false);
    const drumsLoadedRef  = useRef(false);

    // PLAY HELPERS
    function ensureReady(name){
    if (!audioStartedRef.current) { if (DBG) console.warn(`[${name}] blocked: audio not started`); return false; }
    if (!drumsLoadedRef.current)  { if (DBG) console.warn(`[${name}] blocked: samples not loaded`); return false; }
    return true;
    }

    function playCymbal()      { if (!ensureReady("playCymbal")) return;        drum.triggerAttackRelease("C1", "8n"); }
    function playDrum()        { if (!ensureReady("playDrum")) return;          drum.triggerAttackRelease("D1", "8n"); }
    function playHihatOpen()   { if (!ensureReady("playHihatOpen")) return;     drum.triggerAttackRelease("E1", "8n"); }
    function playHihatQuick()  { if (!ensureReady("playHihatQuick")) return;    drum.triggerAttackRelease("F1", "8n"); }
    function playSnare()       { if (!ensureReady("playSnare")) return;         drum.triggerAttackRelease("G1", "8n"); }

    // Gesture detection
    const lastR = useRef({ y: null, t: 0, lastTrig: 0});
    const lastL = useRef({ y: null, t: 0, lastTrig: 0});

    // Height thresholds
    const HEIGHTS = { low: 0.75, mid: 0.5, high: 0.25 };

    // Adjustables
    const velocityThreshold = 0.7;
    const refractoryMS = 160; // min time between hits per hand

    const startAudio = async () => { 
        await Tone.start(); 
        audioStartedRef.current = true;
        if (DBG) console.log("[Tone] AudioContext started");
    };

    function clamp(v) { return Math.min(1, Math.max(0, v)); }

    function detectDrumHit({ yL, yR }) {
        if (DBG) console.log(`[pose] yL=${yL?.toFixed?.(3)} yR=${yR?.toFixed?.(3)}`);
        if (!audioStartedRef.current || !drumsLoadedRef.current) {
            if (DBG) console.warn("[detect] blocked: audioStarted:", audioStartedRef.current, "drumsLoaded:", drumsLoadedRef.current);
        }

        const now = performance.now();
        
        // Normalize
        if (yR > 1) yR = clamp(yR);
        if (yL > 1) yL = clamp(yL);

        // Right hand
        if (lastR.current.y !== null) {
            const dt = Math.max(1, now - lastR.current.t);
            const dy = Math.abs(yR - lastR.current.y);
            const vel = (dy / dt) * 1000;
            if (DBG) console.log(`[right] y=${yR.toFixed(3)} dy=${dy.toFixed(3)} dt=${dt.toFixed(1)}ms vel=${vel.toFixed(2)} thr=${velocityThreshold}`);

            const canFire = vel > velocityThreshold && (now - lastR.current.lastTrig) > refractoryMS;
            if (canFire && audioStartedRef.current && drumsLoadedRef.current) {
                if ( yR > HEIGHTS.low ) playDrum();           // low = drum
                else if ( yR > HEIGHTS.mid ) playSnare();     // mid = snare
                else playCymbal();                          // high = cymbal

                lastR.current.lastTrig = now;
            }
            else {
                if (DBG) console.log(`[right] no-fire: ${(vel<=velocityThreshold)?"vel<thr":""} ${(now-lastR.current.lastTrig<=refractoryMS)?"refractory":""}`);
            }
        }
        lastR.current.y = yR;
        lastR.current.t = now;

        // Left hand
        if (lastL.current.y !== null) {
            const dt = Math.max(1, now - lastL.current.t);
            const dy = Math.abs(yL - lastL.current.y);
            const vel = (dy / dt) * 1000;
            if (DBG) console.log(`[left]  y=${yL.toFixed(3)} dy=${dy.toFixed(3)} dt=${dt.toFixed(1)}ms vel=${vel.toFixed(2)} thr=${velocityThreshold}`);

            const canFire = vel > velocityThreshold && (now - lastL.current.lastTrig) > refractoryMS;
            if (canFire && audioStartedRef.current && drumsLoadedRef.current) {
                if ( yL > HEIGHTS.mid ) playHihatQuick();        // lower = hihat quick
                else playHihatOpen();                           // higher = hihat open
                
                lastL.current.lastTrig = now;
            }
            else {
                if (DBG) console.log(`[left]  no-fire: ${(vel<=velocityThreshold)?"vel<thr":""} ${(now-lastL.current.lastTrig<=refractoryMS)?"refractory":""}`);
            }
        }
        lastL.current.y = yL;
        lastL.current.t = now;
    }

    return { 
        // Controls
        startAudio,
        // Test 
        playCymbal, playDrum, playHihatOpen, playHihatQuick, playSnare, 
        // Mapping
        detectDrumHit,
    
        get audioStarted() { return audioStartedRef.current; },
        get drumsLoaded()  { return drumsLoadedRef.current;  }
    };
}
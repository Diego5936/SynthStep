import { use, useEffect, useRef } from 'react';
import * as Tone from 'tone';

export function useToneEngine() {
    // DRUMS
    const drumSampler = new Tone.Sampler({
        urls: {
            C1: "cymbal.mp3",
            D1: "drum.mp3",
            E1: "hihat-open.mp3",
            F1: "hihat-quick.mp3",
            G1: "snare.mp3",
            A1: "tambor.mp3"
        },
        baseUrl: "/samples/drums/",
    }).toDestination();

    // PLAY HELPERS
    function playCymbal() { drumSampler.triggerAttackRelease("C1", "8n"); }
    function playDrum() { drumSampler.triggerAttackRelease("D1", "8n"); }
    function playHihatOpen() { drumSampler.triggerAttackRelease("E1", "8n"); }
    function playHihatQuick() { drumSampler.triggerAttackRelease("F1", "8n"); }
    function playSnare() { drumSampler.triggerAttackRelease("G1", "8n"); }
    function playTambor() { drumSampler.triggerAttackRelease("A1", "8n"); }

    // Return
    return { playCymbal, playDrum, playHihatOpen, playHihatQuick, playSnare, playTambor  };
}
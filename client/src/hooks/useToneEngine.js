import { use, useEffect, useRef } from 'react';
import * as Tone from 'tone';

export function useToneEngine() {
    const synthRef = useRef(null);
    const gainRef = useRef(null);

    useEffect(() => {
        const gain = new Tone.Gain(0).toDestination();
        const synth = new Tone.Synth().connect(gain);
        synthRef.current = synth;
        gainRef.current = gain;
        return () => {
            synth.dispose();
            gain.dispose();
        }
    }, []);

    return {
        start: async (freqHz) => {
            await Tone.start();
            if (!synthRef.current) return;
            synthRef.current.triggerAttack(freqHz);
        },
        stop: () => {
            synthRef.current?.triggerRelease();
        },
        setVolume: (value) => {
            if (!gainRef.current) return;
            const clamped = Math.min(1, Math.max(0, value));
            gainRef.current.gain.rampTo(clamped, 0.05);
        },
        setPitch: (freqHz) => {
            if (!synthRef.current) return;
            synthRef.current.frequency.rampTo(freqHz, 0.05);
        }
    };
}
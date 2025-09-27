import * as Tone from "tone";

export default function SoundButton({ label, instrument, note, duration }) {
    const playSound = async () => {
        await Tone.start(); // Required for browser

        let synth;
        switch (instrument) {
            case "drum":
                synth = new Tone.MembraneSynth().toDestination();
                break;
            case "noise":
                synth = new Tone.NoiseSynth().toDestination();
                break;
            case "fm":
                synth = new Tone.FMSynth().toDestination();
                break;
            default:
                synth = new Tone.Synth().toDestination();
        }
        
        synth.triggerAttackRelease(note, duration);
    }

    return <button onClick={playSound}>{label}</button>;
}
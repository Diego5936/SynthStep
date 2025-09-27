import * as Tone from "tone";

export default function SynthTest() {
    const playNote = async () => {
        await Tone.start();
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("C4", "8n");
    }

    return <button onClick={playNote}>Play</button>
}
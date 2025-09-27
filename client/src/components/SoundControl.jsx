import { useState } from 'react'

const scale = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"];
const durations = ["32n", "16n", "8n", "4n", "2n", "1n"];
{/* 
  n : note length duration 2secs 
  4n : 1/4 of a whole note. 
  Default tempo: 120bpm 
*/}

export default function SoundControl({ onChange }) {
    const [noteIdx, setNoteIdx] = useState(0);
    const [durationIdx, setDurationIdx] = useState(2);
    
    const handleUpdate = (newNoteIdx, newDurationIdx) => {
        onChange({
            note: scale[newNoteIdx],
            duration: durations[newDurationIdx],
        });
    }

    return (
        <div style={{ marginBottom: "1rem" }}>
            <h4>Note: {scale[noteIdx]}</h4>
            <input
                type="range"
                min="0"
                max={scale.length - 1}
                value={noteIdx}
                onChange={(e) => {
                    const value = Number(e.target.value);
                    setNoteIdx(value);
                    handleUpdate(value, durationIdx);
                }}
            />

            <h4>Duration: {durations[durationIdx]}</h4>
            <input
                type="range"
                min="0"
                max={durations.length - 1}
                value={durationIdx}
                onChange={(e) => {
                    const value = Number(e.target.value);
                    setDurationIdx(value);
                    handleUpdate(noteIdx, value);
                }}
            />
        </div>
    );   
}
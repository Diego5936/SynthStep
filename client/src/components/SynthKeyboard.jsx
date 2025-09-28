import React, { useEffect, useState } from "react";
import * as Tone from "tone";

// White keys (~2 octaves)
const WHITE_KEYS = [
  "C3", "D3", "E3", "F3", "G3", "A3", "B3",
  "C4", "D4", "E4", "F4", "G4", "A4", "B4",
  "C5", "D5"
];

// Black keys, mapped to white anchors
const BLACK_KEYS = {
  C3: "C#3", D3: "D#3",
  F3: "F#3", G3: "G#3", A3: "A#3",
  C4: "C#4", D4: "D#4",
  F4: "F#4", G4: "G#4", A4: "A#4",
  C5: "C#5"
};

// Map computer keys to notes (one octave)
const KEY_MAP = {
  a: "C4", s: "D4", d: "E4", f: "F4",
  g: "G4", h: "A4", j: "B4", k: "C5"
};

export default function SynthKeyboard({ instrument }) {
  const [activeNotes, setActiveNotes] = useState({});

  const getSynth = () => {
    switch (instrument) {
      case "drum": return new Tone.MembraneSynth().toDestination();
      case "fm": return new Tone.FMSynth().toDestination();
      case "noise": return new Tone.NoiseSynth().toDestination();
      default: return new Tone.Synth().toDestination();
    }
  };

  const triggerNote = async (note) => {
    if (!note) return;
    await Tone.start();
    const synth = getSynth();
    if (synth instanceof Tone.NoiseSynth) {
      synth.triggerAttackRelease("16n");
    } else {
      synth.triggerAttackRelease(note, "8n");
    }
    setTimeout(() => synth.dispose(), 300);
  };

  const pressNote = (note) => {
    triggerNote(note);
    setActiveNotes((prev) => ({ ...prev, [note]: true }));
  };

  const releaseNote = (note) => {
    setActiveNotes((prev) => {
      const copy = { ...prev };
      delete copy[note];
      return copy;
    });
  };

  // Handle computer keyboard input
  useEffect(() => {
    const downHandler = (e) => {
      const note = KEY_MAP[e.key];
      if (note && !activeNotes[note]) {
        pressNote(note);
      }
    };
    const upHandler = (e) => {
      const note = KEY_MAP[e.key];
      if (note) releaseNote(note);
    };
    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, [activeNotes]);

  return (
    <div className="synth-body">
      <div className="synth-top">
        <div className="synth-knobs">
          <div className="knob cyan" />
          <div className="knob green" />
          <div className="knob pink" />
          <div className="knob orange" />
        </div>
        <div className="synth-display">SYNTHSTEP-01</div>
      </div>

      <div className="keyboard">
        {WHITE_KEYS.map((note) => (
          <div key={note} className="white-key-wrapper">
            {/* White key */}
            <button
              className={`white-key ${activeNotes[note] ? "active" : ""}`}
              onMouseDown={() => pressNote(note)}
              onMouseUp={() => releaseNote(note)}
              onMouseLeave={() => releaseNote(note)}
            >
              {note}
            </button>

            {/* Black key if exists */}
            {BLACK_KEYS[note] && (
              <button
                className={`black-key ${activeNotes[BLACK_KEYS[note]] ? "active" : ""}`}
                onMouseDown={() => pressNote(BLACK_KEYS[note])}
                onMouseUp={() => releaseNote(BLACK_KEYS[note])}
                onMouseLeave={() => releaseNote(BLACK_KEYS[note])}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

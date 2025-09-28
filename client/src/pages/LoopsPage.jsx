import React, { useEffect, useRef, useState } from "react";
import "./LoopsPage.css";
import Camera from "../components/Camera";
import * as Tone from "tone";

const SCALE = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"];

export default function LoopsPage() {
  const [sliders, setSliders] = useState({ a: 50, b: 70, c: 85 }); // pitch, volume, tbd
  const [pads, setPads] = useState([false, false, false, false]); // active instrument highlight
  const [activeInstr, setActiveInstr] = useState(null);
  const [synth, setSynth] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const masterGain = useRef(null);

  // setup master gain
  useEffect(() => {
    masterGain.current = new Tone.Gain(0.8).toDestination();
    return () => masterGain.current?.dispose();
  }, []);

  // select instrument (no sound yet)
  function selectInstrument(idx) {
    setActiveInstr(idx);
    setPads((p) => p.map((_, i) => i === idx));
  }

  // start sound
  async function startInstrument() {
    await Tone.start();

    if (synth) {
      synth.dispose();
      setSynth(null);
    }
    if (activeInstr === null) return;

    let newSynth;
    switch (activeInstr) {
      case 0: {
        const s = new Tone.Synth().connect(masterGain.current);
        s.triggerAttack("C4");
        newSynth = s;
        break;
      }
      case 1: {
        const s = new Tone.FMSynth().connect(masterGain.current);
        s.triggerAttack("C4");
        newSynth = s;
        break;
      }
      case 2: {
        const s = new Tone.MembraneSynth().connect(masterGain.current);
        s.triggerAttack("C2");
        newSynth = s;
        break;
      }
      case 3: {
        const s = new Tone.NoiseSynth().connect(masterGain.current);
        s.triggerAttack();
        newSynth = s;
        break;
      }
      default:
        return;
    }

    setSynth(newSynth);
    setIsPlaying(true);
  }

  // stop sound
  function stopInstrument() {
    if (synth) {
      synth.dispose();
      setSynth(null);
    }
    setIsPlaying(false);
  }

  // pitch control (slider A)
  useEffect(() => {
    if (!synth) return;
    if (activeInstr === 3) {
      if (!synth.filter) {
        synth.filter = new Tone.Filter(800, "bandpass").toDestination();
        synth.disconnect();
        synth.connect(synth.filter);
      }
      const freq = 200 + (sliders.a / 100) * 2000;
      synth.filter.frequency.rampTo(freq, 0.05);
    } else {
      const noteIndex = Math.round((sliders.a / 100) * (SCALE.length - 1));
      const note = SCALE[noteIndex];
      synth.setNote?.(note);
    }
  }, [sliders.a, synth, activeInstr]);

  // volume control (slider B)
  useEffect(() => {
    if (!synth) return;
    const gain = Math.max(0.001, sliders.b / 100);
    synth.volume.rampTo(Tone.gainToDb(gain), 0.05);
  }, [sliders.b, synth]);

  return (
    <div className="loops2">
      <div className="top">
        {/* Camera + Start/Stop */}
        <div className="camera2">
          <div className="camera2__bg" />
          <div className="camera2__center">
            <Camera width={640} height={360} mirrored onPose={() => {}} />
          </div>
          <div className="camera2__foot">
            <button
              className="btn"
              onClick={startInstrument}
              disabled={isPlaying || activeInstr === null}
            >
              ▶ Start
            </button>
            <button
              className="btn btn--stop"
              onClick={stopInstrument}
              disabled={!isPlaying}
            >
              ⏹ Stop
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="side">
          {/* Sliders */}
          <div className="faders">
            <div className="fader">
              <span>Pitch</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliders.a}
                onChange={(e) =>
                  setSliders((s) => ({ ...s, a: parseInt(e.target.value, 10) }))
                }
              />
            </div>
            <div className="fader">
              <span>Volume</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliders.b}
                onChange={(e) =>
                  setSliders((s) => ({ ...s, b: parseInt(e.target.value, 10) }))
                }
              />
            </div>
            <div className="fader">
              <span>TBD</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliders.c}
                onChange={(e) =>
                  setSliders((s) => ({ ...s, c: parseInt(e.target.value, 10) }))
                }
              />
            </div>
          </div>

          {/* Instrument selector pads */}
          <div className="pads">
            {["Synth", "FM", "Drum", "Noise"].map((label, idx) => (
              <button
                key={idx}
                className={pads[idx] ? "pad pad--on" : "pad"}
                onClick={() => selectInstrument(idx)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

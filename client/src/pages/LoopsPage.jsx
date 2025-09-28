import React, { useEffect, useRef, useState } from "react";
import "./LoopsPage.css";
import Camera from "../components/Camera";
import * as Tone from "tone";
import { useToneEngine } from "../hooks/useToneEngine";

export default function LoopsPage() {
  const [sliders, setSliders] = useState({ pitch: 50, volume: 70 });
  const [pads, setPads] = useState([false, false, false, false]);
  const [activeInstr, setActiveInstr] = useState(null);
  const [synth, setSynth] = useState(null);

  const [muteSynth, setMuteSynth] = useState(false);
  const [muteDrums, setMuteDrums] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Preload with fake demo tracks for presentation
  const [tracks, setTracks] = useState([
    { id: 1, name: "Kick Loop", url: null },
    { id: 2, name: "Snare Groove", url: null },
    { id: 3, name: "Bassline A", url: null },
    { id: 4, name: "Synth Arp", url: null },
  ]);

  const [bpm, setBpm] = useState(120);
  const [bars, setBars] = useState(4);

  const recorder = useRef(null);
  const recordingBus = useRef(null);

  const engine = useToneEngine();

  // === Setup Transport ===
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = `${bars}m`;
  }, [bpm, bars]);

  useEffect(() => {
    // bus for recording
    recordingBus.current = new Tone.Gain();
    recorder.current = new Tone.Recorder();
    recordingBus.current.connect(recorder.current);
    recordingBus.current.connect(Tone.Destination);

    // connect drums into bus
    engine.connectTo(recordingBus.current);

    // start AudioContext on first click
    const start = async () => {
      await engine.startAudio();
    };
    document.body.addEventListener("click", start, { once: true });

    return () => {
      recorder.current?.dispose();
      recordingBus.current?.dispose();
    };
  }, [engine]);

  // === Instrument selection ===
  function selectInstrument(idx) {
    setActiveInstr(idx);
    setPads((p) => p.map((_, i) => i === idx));
  }

  // === Build synths ===
  function buildSynth(idx) {
    let newSynth;
    switch (idx) {
      case 0:
        newSynth = new Tone.Synth({ oscillator: { type: "sawtooth" } });
        break;
      case 1:
        newSynth = new Tone.FMSynth();
        break;
      case 2:
        return null; // drums handled separately
      case 3:
        newSynth = new Tone.NoiseSynth({ noise: { type: "white" } });
        break;
      default:
        return null;
    }
    // connect to both speakers and recorder
    newSynth.connect(Tone.Destination);
    newSynth.connect(recordingBus.current);
    return newSynth;
  }

  // === Transport ===
  const startTransport = async () => {
    console.log("▶ Play clicked");
    await Tone.start();
    if (activeInstr === null) return;

    if (!isPlaying) {
      if (synth) synth.dispose();
      const newSynth = buildSynth(activeInstr);
      if (newSynth) {
        if (activeInstr === 3) {
          newSynth.triggerAttack(); // noise
        } else {
          newSynth.triggerAttack("C4");
        }
        setSynth(newSynth);
      }

      Tone.Transport.start();
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const pauseTransport = async () => {
    console.log("⏸ Pause clicked");
    await Tone.start();
    Tone.Transport.pause();
    if (synth) synth.triggerRelease();
    setIsPaused(true);
  };

  const stopTransport = async () => {
    console.log("⏹ Stop clicked");
    await Tone.start();
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    if (synth) {
      synth.triggerRelease();
      synth.dispose();
      setSynth(null);
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  // === Recording (start) ===
  const startRecording = async () => {
    console.log("⬤ Record clicked");
    await Tone.start();
    if (isRecording) return;

    stopTransport();
    setCountdown(3);

    let step = 3;
    const timer = setInterval(() => {
      step--;
      if (step > 0) {
        setCountdown(step);
      } else {
        clearInterval(timer);
        setCountdown("GO!");
        setTimeout(() => setCountdown(null), 800);

        Tone.Transport.cancel();
        Tone.Transport.position = 0;
        Tone.Transport.start();

        setIsRecording(true);

        recorder.current.start().then(() => {
          console.log("[Recorder] STARTED");
        });
      }
    }, 1000);
  };

  // === Recording (stop, quantized to next bar) ===
  const stopRecordingManual = () => {
    if (!isRecording || !recorder.current) return;

    const pos = Tone.Transport.position;
    const [barsNow] = pos.split(":").map((n) => parseInt(n, 10) || 0);
    const stopAtBar = barsNow + 1;

    console.log("[Recorder] Scheduled STOP at", stopAtBar, "bars");

    Tone.Transport.scheduleOnce(async () => {
      if (recorder.current) {
        console.log("[Recorder] STOP at", Tone.Transport.position);
        const rec = await recorder.current.stop();
        if (rec) {
          const url = URL.createObjectURL(rec);
          const player = new Tone.Player(url).sync().start(0);
          player.loop = true;
          player.connect(Tone.Destination);
          setTracks((t) => [...t, { id: Date.now(), player, url }]);
        }
      }
      setIsRecording(false);
    }, `${stopAtBar}:0:0`);
  };

  // === Delete track ===
  const deleteTrack = (id) => {
    setTracks((t) => {
      const tr = t.find((tr) => tr.id === id);
      tr?.player?.dispose();
      return t.filter((tr) => tr.id !== id);
    });
  };

  // === Slider Controls ===
  useEffect(() => {
    if (synth) {
      const midi = 36 + Math.floor((sliders.pitch / 100) * 48);
      const freq = Tone.Frequency(midi, "midi").toFrequency();
      if (synth.setNote) {
        synth.setNote(freq);
      } else if (synth.frequency) {
        synth.frequency.rampTo(freq, 0.05);
      }

      if (synth.volume) {
        const vol = (sliders.volume / 100) * -30; // map 0–100 → -30 to 0 dB
        synth.volume.rampTo(vol, 0.05);
      }
    }
  }, [sliders, synth]);

  // === Muting ===
  useEffect(() => {
    if (synth) synth.mute = muteSynth;
  }, [muteSynth, synth]);

  useEffect(() => {
    engine.setMuted(muteDrums);
  }, [muteDrums, engine]);

  return (
    <div className="loops2">
      <div className="top">
        {/* Camera */}
        <div className="camera2">
          <div className="camera2__bg" />
          <div className="camera2__center">
            <Camera width={640} height={360} mirrored onPose={engine.detectHit} />
          </div>
        </div>

        {/* Right column controls */}
        <div className="side-grid">
          {/* Synth */}
          <div className="controls-block">
            <div className="faders">
              <div className="fader">
                <span>Pitch</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliders.pitch}
                  onChange={(e) =>
                    setSliders((s) => ({ ...s, pitch: parseInt(e.target.value, 10) }))
                  }
                />
              </div>
              <div className="fader">
                <span>Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliders.volume}
                  onChange={(e) =>
                    setSliders((s) => ({ ...s, volume: parseInt(e.target.value, 10) }))
                  }
                />
              </div>
            </div>

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
            <button className="mute-btn" onClick={() => setMuteSynth((m) => !m)}>
              {muteSynth ? "Unmute Synth" : "Mute Synth"}
            </button>
          </div>

          {/* Drums */}
          <div className="controls-block drum-controls">
            <div className="drum-panel">
              <div className="drum-buttons">
                <button id="drum-low" className="drum-pad" onClick={engine.playLow}>
                  Low
                </button>
                <button id="drum-mid" className="drum-pad" onClick={engine.playMid}>
                  Mid
                </button>
                <button id="drum-high" className="drum-pad" onClick={engine.playHigh}>
                  High
                </button>
              </div>
              <div className="drum-faders">
                <div className="fader-vert">
                  <span>Drum Vol</span>
                  <input type="range" min="0" max="100" style={{ writingMode: "bt-lr", direction: "rtl" }} />
                </div>
                <div className="fader-vert">
                  <span>Sensitivity</span>
                  <input type="range" min="0" max="100" style={{ writingMode: "bt-lr", direction: "rtl" }} />
                </div>
              </div>
            </div>
            <button className="mute-btn" onClick={() => setMuteDrums((m) => !m)}>
              {muteDrums ? "Unmute Drums" : "Mute Drums"}
            </button>
          </div>

          {/* Transport */}
          <div className="transport">
            <button onClick={startTransport}>▶ Play</button>
            <button onClick={pauseTransport}>⏸ Pause</button>
            <button onClick={stopTransport}>⏹ Stop</button>
            <button onClick={startRecording} className={isRecording ? "rec-on" : ""}>
              ⬤ Record
            </button>
            <button onClick={stopRecordingManual} disabled={!isRecording}>
              ⏹ Stop Rec
            </button>
            <label>
              BPM
              <input
                type="number"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
              />
            </label>
            <label>
              Bars
              <select value={bars} onChange={(e) => setBars(parseInt(e.target.value))}>
                <option value={4}>4</option>
                <option value={8}>8</option>
              </select>
            </label>
          </div>

          {/* Countdown Overlay */}
          {countdown && (
            <div className="countdown-overlay">
              <span>{countdown}</span>
            </div>
          )}

          {/* Track List */}
          <div className="tracks">
            {tracks.map((tr) => (
              <div key={tr.id} className="track">
                {tr.url ? (
                  <audio src={tr.url} controls />
                ) : (
                  <div className="clip-placeholder">{tr.name}</div>
                )}
                <button onClick={() => deleteTrack(tr.id)}>🗑 Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

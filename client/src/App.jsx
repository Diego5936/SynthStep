import { useState } from 'react';
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import * as Tone from 'tone';

import './App.css';

import LoopsPage from "./pages/LoopsPage.jsx";
import SoundButton from './components/SoundButton';
import SoundControl from './components/SoundControl';
import Camera from './components/Camera';

function SynthStep() {
  const [settings, setSettings] = useState({ note: "C4", duration: "8n" });
  const [cameraOn, setCameraOn] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const enableAudio = async () => {
    await Tone.start();
    setAudioReady(true);
    console.log("Audio ready");
  };

  return (
    <div>
      <h1>SynthStep</h1>

      {!audioReady && (
        <p style={{ marginBottom: 12 }}>
          <button onClick={enableAudio}>Enable Audio</button>
        </p>
      )}

      <SoundControl onChange={setSettings} />

      <div>
        <SoundButton label="Drum"  instrument="drum"  {...settings}/>
        <SoundButton label="Synth" instrument="synth" {...settings}/>
        <SoundButton label="FM"    instrument="fm"    {...settings}/>
        <SoundButton label="Noise" instrument="noise" {...settings}/>
      </div>

      <p style={{ marginTop: 12 }}>
        <Link to="/loopspage">Go to Loops Page →</Link>
      </p>

      {/* Camera */}
      <button onClick={() => setCameraOn((prev) => !prev)}>
        {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
      </button>

      {cameraOn && <Camera />}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SynthStep />} />
      <Route path="/loopspage" element={<LoopsPage />} />
      <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
    </Routes>
  );
}

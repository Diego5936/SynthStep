import { useState } from "react";
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import * as Tone from "tone";

import "./App.css";

import LoopsPage from "./pages/LoopsPage.jsx";
import FreeflowPage from "./pages/FreeflowPage.jsx";
import SynthKeyboard from "./components/SynthKeyboard";

function SynthStep() {
  const [audioReady, setAudioReady] = useState(false);
  const [instrument, setInstrument] = useState("synth");

  const enableAudio = async () => {
    await Tone.start();
    setAudioReady(true);
    console.log("Audio ready");
  };

  return (
    <div className="home">
      <h1>SynthStep</h1>
      <p className="tagline">
        the recording studio where <strong>YOU</strong> are the music
      </p>


      {!audioReady && (
        <p>
          <button onClick={enableAudio}>Enable Audio</button>
        </p>
      )}

      <SynthKeyboard instrument={instrument} />

      <div className="nav-buttons">
        <Link to="/loopspage" className="nav-tile">🎛 Loopstation</Link>
        <Link to="/freeflow" className="nav-tile">🎶 Freeflow Jam</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SynthStep />} />
      <Route path="/loopspage" element={<LoopsPage />} />
      <Route path="/freeflow" element={<FreeflowPage />} />
      <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
    </Routes>
  );
}

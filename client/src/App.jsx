import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// Pages
import './App.css';
import LoopsPage from './pages/LoopsPage.jsx';

// Hooks
import { useToneEngine } from './hooks/useToneEngine.js';

// Components
import SoundButton from './components/SoundButton';
import Camera from './components/Camera';

function SynthStep() {
  const engine = useToneEngine();
  const { 
    startAudio,
    playLow, playMid, playHigh,
    detectHit,
  } = engine;

  const [cameraOn, setCameraOn] = useState(false);

  const [lastYL, setLastYL] = useState(null);
  const [lastYR, setLastYR] = useState(null);
  
  return (
    <div className="App">
      <h1>SynthStep</h1>

      {/* Required by browsers to unlock audio */}
      <button onClick={startAudio}>Start Audio</button>

      {/* Sound Test */}
      <div>
        <SoundButton label="Low (Tambor)" onClick={playLow} />
        <SoundButton label="Mid (Snare)" onClick={playMid} />
        <SoundButton label="High (Hi-hat)" onClick={playHigh} />
      </div>

      <p style={{ marginTop: 12 }}>
        <Link to="/loopspage">Go to Loops Page →</Link>
      </p>

      {/* Camera */}
      <button onClick={() => setCameraOn((prev) => !prev)}>
        {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
      </button>

      {cameraOn && (
        <Camera 
          onPose={({ yL, yR, eyeY, shoulderY, midY }) => {
            setLastYL(yL); 
            setLastYR(yR);
            detectHit({ yL, yR , eyeY, shoulderY, midY});
          }}
        />
      )}
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

import { useState } from 'react'
import { useToneEngine } from './hooks/useToneEngine'

import Camera from './components/Camera'
import SoundButton from './components/SoundButton'

import './App.css'

function App() {
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

export default App;

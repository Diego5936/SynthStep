import { useState } from 'react'
import { useToneEngine } from './hooks/useToneEngine'

import Camera from './components/Camera'
import SoundButton from './components/SoundButton'

import './App.css'

function App() {
  const engine = useToneEngine();
  const { 
    startAudio,
    playCymbal, playDrum, playHihatOpen, playHihatQuick, playSnare, 
    detectDrumHit, 
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
        <SoundButton label="Cymbal" onClick={playCymbal} />
        <SoundButton label="Drum" onClick={playDrum} />
        <SoundButton label="Hihat Open" onClick={playHihatOpen} />
        <SoundButton label="Hihat Quick" onClick={playHihatQuick} />
        <SoundButton label="Snare" onClick={playSnare} />
      </div>

      {/* Camera */}
      <button onClick={() => setCameraOn((prev) => !prev)}>
        {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
      </button>

      <p style={{fontFamily:"monospace"}}>
        audioStarted: {String(engine.audioStarted)} | drumsLoaded: {String(engine.drumsLoaded)}<br/>
        yL: {lastYL?.toFixed?.(3) ?? "-"} | yR: {lastYR?.toFixed?.(3) ?? "-"}
      </p>

      {cameraOn && (
        <Camera 
          onPose={({ yL, yR }) => {
            console.log(`[pose->App] yL=${yL?.toFixed?.(3)} yR=${yR?.toFixed?.(3)}`);
            setLastYL(yL); 
            setLastYR(yR);
            detectDrumHit({ yL, yR });
          }}
        />
      )}
    </div>
  );
}

export default App;

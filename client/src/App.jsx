import { useEffect, useState } from 'react'
import { useToneEngine } from './hooks/useToneEngine'

import SoundButton from './components/SoundButton'
import SoundControl from './components/SoundControl'
import Camera from './components/Camera'

import './App.css'
import { yToVolume, yToPitchHz } from './vision/wristMappings'

function App() {
  const [cameraOn, setCameraOn] = useState(false);
  const [vol, setVol] = useState(0.5);
  const [pitch, setPitch] = useState(440);
  const engine = useToneEngine();

  useEffect(() => {
    let running = true;
    (async () => {
      if (cameraOn) {
        await engine.start(440);
      }
      else {
        engine.stop();
      }
    })();

    return () => {
      running = false;
    };
  }, [cameraOn]);
  
  return (
    <div>
      <h1>SynthStep</h1>

      {/* Camera */}
      <button onClick={() => setCameraOn((prev) => !prev)}>
        {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
      </button>

      {cameraOn && (
        <Camera 
          onPose={({ yL, yR }) => {
            console.log("Pose:", yL, yR);
            const v = yToVolume(yL);
            const p = yToPitchHz(yR);
            setVol(v.toFixed(2));
            setPitch(Math.round(p));

            // Left wrist - volume
            engine.setVolume( v );
            // Right wrist - pitch
            engine.setPitch( p );
          }}
        />
      )}

      <p>Volume: {vol} | Pitch: {pitch} Hz</p>
    </div>
  );
}

export default App;

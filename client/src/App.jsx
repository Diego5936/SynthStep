import { useEffect, useState } from 'react'
import { useToneEngine } from './hooks/useToneEngine'

import Camera from './components/Camera'
import SoundButton from './components/SoundButton'

import './App.css'
import { yToVolume, yToPitchHz } from './vision/wristMappings'

function App() {
  const { playCymbal, playDrum, playHihatOpen, 
          playHihatQuick, playSnare, playTambor } = useToneEngine();
  const [cameraOn, setCameraOn] = useState(false);
  const engine = useToneEngine();

  async function startAudio() {
    await Tone.start();
    console.log('Audio is ready');
  }
  
  return (
    <div className="App">
      <h1>SynthStep</h1>

      {/* Sound Test */}
      <div>
        <SoundButton label="Cymbal" onClick={playCymbal} />
        <SoundButton label="Drum" onClick={playDrum} />
        <SoundButton label="Hihat Open" onClick={playHihatOpen} />
        <SoundButton label="Hihat Quick" onClick={playHihatQuick} />
        <SoundButton label="Snare" onClick={playSnare} />
        <SoundButton label="Tambor" onClick={playTambor} />
      </div>

      {/* Camera */}
      <button onClick={() => setCameraOn((prev) => !prev)}>
        {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
      </button>

      {cameraOn && <Camera />}
    </div>
  );
}

export default App;

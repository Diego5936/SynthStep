import { useState } from 'react'
import './App.css'

import SoundButton from './components/SoundButton'
import SoundControl from './components/SoundControl'
import Camera from './components/Camera'


function App() {
  const [settings, setSettings] = useState({ note: "C4", duration: "8n" });
  const [cameraOn, setCameraOn] = useState(false);
  
  return (
    <div>
      <h1>SynthStep</h1>
      <SoundControl onChange={setSettings} />

      <div>
        <SoundButton label="Drum" instrument="drum" {...settings}/>
        <SoundButton label="Synth" instrument="synth" {...settings}/>
        <SoundButton label="FM" instrument="fm" {...settings}/>
        <SoundButton label="Noise" instrument="noise" {...settings}/>
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

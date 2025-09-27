import { useState } from 'react'
import * as Tone from "tone";

import './App.css'

import SoundButton from './components/SoundButton'
import SoundControl from './components/SoundControl'


function App() {
  const [settings, setSettings] = useState({ note: "C4", duration: "8n" });
  
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
    </div>
  );
}

export default App;

import React, { useMemo, useState } from "react";
import "./LoopsPage.css";

// 
// Loops Page
// - Top left: big camera panel
// - Right column: view tabs, record/stop/settings, 3 sliders, 2×2 pads, 2 mini channel rows
// - Bottom: 3 colorful loop lanes spanning full width
//

const TRACKS_INIT = [
  { id: "drums",  name: "Drums",  color: "amber",  clips: [] },
  { id: "lead",   name: "Lead",   color: "sky",    clips: [] },
  { id: "chords", name: "Chords", color: "emerald", clips: [] },
];

export default function LoopsPage() {
  const [view, setView] = useState("view1");
  const [recording, setRecording] = useState(false);
  const [loopLen, setLoopLen] = useState(4); // bars
  const [activeTrackId, setActiveTrackId] = useState("drums");
  const [tracks, setTracks] = useState(TRACKS_INIT);

  // right-side control state
  const [sliders, setSliders] = useState({ a: 70, b: 45, c: 85 });
  const [pads, setPads] = useState([false, false, false, false]);
  const [chan, setChan] = useState({ one: { mute: false, val: 60 }, two: { mute: false, val: 40 } });

  const activeTrack = useMemo(() => tracks.find(t => t.id === activeTrackId) || tracks[0], [tracks, activeTrackId]);

  function toggleRecord() {
    setRecording(v => !v);
  }
  function stopAndCommit() {
    if (!recording) return;
    // mock: add a clip of loopLen bars to the active track, appended after existing
    const start = activeTrack.clips.reduce((acc, c) => acc + c.len, 0) % loopLen; // simple wrap
    const newClip = { id: Math.random().toString(36).slice(2), start, len: loopLen };
    setTracks(prev => prev.map(t => t.id === activeTrack.id ? { ...t, clips: [...t.clips, newClip] } : t));
    setRecording(false);
  }

  function clearTrack(id) {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, clips: [] } : t));
  }

  return (
    <div className="loops2">
      {/* TOP GRID */}
      <div className="top">
        {/* Camera panel */}
        <div className="camera2">
          <div className="camera2__bg" />
          <div className="camera2__center">
            <div className="camera2__placeholder">Camera Feed / Pose Overlay</div>
          </div>
          <div className="camera2__foot">
            <div className="footbtn" />
            <div className="footbtn" />
            <div className="footbtn" />
          </div>
        </div>

        {/* Right controls column */}
        <div className="side">
          <div className="side__topbar">
            <div className="seg">
              <button className={view === "view1" ? "seg__btn seg__btn--on" : "seg__btn"} onClick={() => setView("view1")}>view 1</button>
              <button className={view === "view2" ? "seg__btn seg__btn--on" : "seg__btn"} onClick={() => setView("view2")}>view 2</button>
            </div>
            <div className="btnrow">
              <button className={recording ? "btn btn--rec on" : "btn btn--rec"} onClick={toggleRecord}>rec</button>
              <button className="btn" onClick={stopAndCommit}>stop</button>
              <button className="btn">settings</button>
            </div>
          </div>

          {/* 3 horizontal sliders */}
          <div className="faders">
            {(["a","b","c"]).map((k, i) => (
              <div className="fader" key={k}>
                <input type="range" min="0" max="100" value={sliders[k]} onChange={e => setSliders(s => ({...s, [k]: parseInt(e.target.value)}))} />
              </div>
            ))}
          </div>

          {/* 2×2 pads */}
          <div className="pads">
            {pads.map((on, idx) => (
              <button key={idx} className={on ? "pad pad--on" : "pad"} onMouseDown={() => setPads(p => p.map((v,i)=>i===idx?true:v))} onMouseUp={() => setPads(p => p.map((v,i)=>i===idx?false:v))} />
            ))}
          </div>

          {/* two mini channels */}
          <div className="channels">
            {["one","two"].map((key) => (
              <div key={key} className="chan">
                <button className={chan[key].mute ? "square square--on" : "square"} onClick={() => setChan(c => ({...c, [key]: {...c[key], mute: !c[key].mute}}))} />
                <input className="chan__slider" type="range" min="0" max="100" value={chan[key].val} onChange={e => setChan(c => ({...c, [key]: {...c[key], val: parseInt(e.target.value)}}))} />
              </div>
            ))}
          </div>

          {/* active track select + loop len */}
          <div className="side__meta">
            <label>
              track
              <select value={activeTrackId} onChange={e => setActiveTrackId(e.target.value)}>
                {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label>
              bars
              <select value={loopLen} onChange={e => setLoopLen(parseInt(e.target.value))}>
                {[2,4,8].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* BOTTOM: loop lanes */}
      <div className="lanes2">
        {tracks.map((t) => (
          <Lane key={t.id} track={t} loopLen={loopLen} onClear={() => clearTrack(t.id)} />
        ))}
      </div>
    </div>
  );
}

function Lane({ track, loopLen, onClear }) {
  // width math: each lane visual spans 100% = loopLen bars
  return (
    <div className={`lane2 lane2--${track.color}`}>
      <div className="lane2__head">
        <div className="lane2__name">{track.name}</div>
        <div className="lane2__actions">
          <button className="btn btn--ghost" onClick={onClear}>clear</button>
        </div>
      </div>
      <div className="lane2__timeline">
        {/* grid ticks */}
        {Array.from({ length: loopLen + 1 }).map((_, i) => (
          <div key={i} className="tick" style={{ left: `${(i/loopLen)*100}%` }} />
        ))}
        {/* clips */}
        {track.clips.map((c) => (
          <div key={c.id} className="clip2" style={{ left: `${(c.start/loopLen)*100}%`, width: `${(c.len/loopLen)*100}%` }} />
        ))}
      </div>
    </div>
  );
}

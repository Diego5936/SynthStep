# SynthStep
Inspiration
We were inspired by the idea of making music more playful and accessible. Instead of needing an instrument or controller, we wanted people to be able to step in front of a camera and create sounds with simple movements. The goal was to capture the fun of experimenting with music in a way that feels natural and intuitive.

What it does
SynthStep is an interactive loop station that turns hand and body movement into sound. Users can select instruments, adjust pitch and volume with sliders, and start or stop playback. The camera detects movement and translates it into beats and melodies, letting anyone “play” music just by moving. It also has a freeflow state that removes all the sliders and buttons and allows the user to "flow" and make music.

How we built it
We built SynthStep using React for the interface and Tone.js for real-time sound synthesis. The camera feed connects to motion tracking, which we mapped to different instruments and sound controls. We designed a clean UI with start/stop buttons, instrument pads, and sliders to make the experience simple and responsive.

Challenges we ran into
One of the hardest parts was getting movement detection and sound timing to sync up so that the music felt responsive. We also ran into roadblocks with audio recording and looping features and we weren’t able to fully figure those out in time for the demo.

Accomplishments that we're proud of
We’re proud of creating a working prototype that lets people make music with movement. The visual design of the interface, the real-time sound controls, and the ability to play different instruments without touching anything are all milestones that we were excited to bring together.

What we learned
We learned a lot about real-time sound synthesis, gesture mapping, and building interactive experiences that feel natural to use. We also learned how important timing and responsiveness are in music based projects, and how tricky browser audio can be when it comes to stability and recording.

What's next for SynthStep
Next, we’d like to finish the looping and recording features so users can layer sounds and build full tracks. We also want to refine the motion detection to make it smoother and add more instruments and effects. Another goal is to have the Freeflow page be completely hands free and allow users to create music that follows not just their gestures, but their dance moves! In the future, this could scale up to be a game or tool for everyone to enjoy.
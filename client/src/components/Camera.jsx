import { useRef, useEffect } from 'react';
import { createMoveNet } from '../vision/loadDetector';
import { mapWristY } from '../vision/wristMappings';

export default function Camera({ width = "80%", onPose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const detectorRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        let isActive = true;

        // Start the camera
        navigator.mediaDevices.getUserMedia({ video: true }).then(async (mediaStream) => {
            if (!isActive) { 
                mediaStream.getTracks().forEach((track) => track.stop());
                return;
            }

            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                console.log("Camera started");

                await new Promise((resolve) => {
                    const v = videoRef.current;
                    if (!v) return resolve();
                    if (v.readyState >= 2 && v.videoHeight > 0) return resolve();
                    v.onloadedmetadata = () => resolve();
                });

                await videoRef.current.play();
                console.log("[camera] video size:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);        
                
                if (canvasRef.current) {
                    canvasRef.current.width = videoRef.current.videoWidth;
                    canvasRef.current.height = videoRef.current.videoHeight;
                }
            }
        })
        .catch((err) => console.error("Error opening camera:", err));

        // Load the model
        (async () => {
            detectorRef.current = await createMoveNet();
            if (!isActive) return;

            // Pose loop
            const loop = async () => {
                // guards
                if (!videoRef.current || !detectorRef.current) {
                    rafRef.current = requestAnimationFrame(loop);
                    return;
                }

                const v = videoRef.current;

                if (!v.videoWidth || !v.videoHeight) {
                    rafRef.current = requestAnimationFrame(loop);
                    return;
                }

                try {
                    const poses = await detectorRef.current.estimatePoses(v);
                    if (poses?.[0]) {
                        const pose = poses[0];

                        // Body lines
                        const kp = pose.keypoints;
                        const h = v.videoHeight || 1;
                        const safe = (k) => k && typeof k.y === "number";
                        const le = kp[1], re = kp[2];           // eyes
                        const ls = kp[5], rs = kp[6];           // shoulders
                        const lh = kp[11], rh = kp[12];         // hips

                        // Guards
                        let eyeY = null, shoulderY = null, midY = null;
                        if (safe(le) && safe(re)) {
                            eyeY = ((le.y + re.y) / 2) / h;
                        }
                        if (safe(ls) && safe(rs)) {
                            shoulderY = ((ls.y + rs.y) / 2) / h;
                        }
                        if (shoulderY != null && safe(lh) && safe(rh)) {
                            const hipY = ((lh.y + rh.y) / 2) / h;
                            midY = (shoulderY + hipY) / 2;
                        }
                        
                        // Draw overlay
                        const c = canvasRef.current;
                        if (c) {
                            const ctx = c.getContext('2d');
                            const W = c.width, H = c.height;
                            ctx.clearRect(0, 0, W, H);
                            ctx.lineWidth = 2;

                            function drawLine(yNorm, color, label) {
                                if (yNorm == null) return;
                                const y = Math.max(0, Math.min(H, yNorm * H));
                                ctx.strokeStyle = color;
                                ctx.globalAlpha = 0.9;
                                ctx.beginPath();
                                ctx.moveTo(0, y);
                                ctx.lineTo(W, y);
                                ctx.stroke();
                                ctx.globalAlpha = 1.0;
                                ctx.fillStyle = color;
                                ctx.font = '14px sans-serif';
                                ctx.fillText(label, 8, Math.max(14, y - 6));
                            }

                            drawLine(eyeY,      '#34a853', 'Eye level');      // green
                            drawLine(shoulderY, '#4285f4', 'Shoulders');      // blue
                            drawLine(midY,      '#fbbc05', 'Mid torso');      // yellow
                        }

                        // Map wrists
                        const wrists = mapWristY(pose, h);
                        if (wrists && onPose) {
                            onPose({ ...wrists, eyeY, shoulderY, midY });
                        }
                    }
                } catch (err) {
                    console.error("[pose] estimatePoses error:", err);
                }

                rafRef.current = requestAnimationFrame(loop);
                };
            rafRef.current = requestAnimationFrame(loop);
        })();

        // Stop the camera
        return () => {
            isActive = false;
            cancelAnimationFrame(rafRef.current);
            detectorRef.current?.dispose?.();

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                console.log("Camera stopped");
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, []);

    return (
        <div style={{ textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block", width }}>
                <video 
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: "100%", border: "2px solid black", display: "block" }}
                />
                <canvas
                    ref={canvasRef}
                    style={{ 
                        position: "absolute", 
                        top: 0, left: 0, 
                        width: "100%", height: "100%",
                        pointerEvents: "none",
                    }}
                />
            </div>
        </div>
    )
}
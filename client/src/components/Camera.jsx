import { useRef, useEffect } from 'react';
import { createMoveNet } from '../vision/loadDetector';
import { mapWristY } from '../vision/wristMappings';

export default function Camera({ width = "80%", onPose }) {
    const videoRef = useRef(null);
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
            }
        })
        .catch((err) => console.error("Error opening camera:", err));

        // Load the model
        (async () => {
            detectorRef.current = await createMoveNet();
            if (!isActive) return;

            // Pose loop
            const loop = async () => {
                // guard: detector & video exist
                if (!videoRef.current || !detectorRef.current) {
                    rafRef.current = requestAnimationFrame(loop);
                    return;
                }

                const v = videoRef.current;

                // guard: video has real dimensions (prevents 0x0 texture error)
                if (!v.videoWidth || !v.videoHeight) {
                    rafRef.current = requestAnimationFrame(loop);
                    return;
                }

                try {
                    const poses = await detectorRef.current.estimatePoses(v);
                    if (poses?.[0]) {
                    const kp = poses[0].keypoints;
                    // raw wrists from MoveNet indices
                    const lw = kp[9];
                    const rw = kp[10];
                    console.log("[raw wrists]", { lw, rw, h: v.videoHeight });

                    const h = v.videoHeight || 1;
                    const wrists = mapWristY(poses[0], h);
                    if (wrists && onPose) {
                        console.log("[pose] wrists:", wrists);
                        onPose(wrists);
                    } else {
                        console.warn("[pose] wrists null this frame");
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
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width, border: "2px solid black" }}
            />
        </div>
    )
}
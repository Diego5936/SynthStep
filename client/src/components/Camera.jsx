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
        navigator.mediaDevices.getUserMedia({ video: true }).then((mediaStream) => {
            if (!isActive) { 
                mediaStream.getTracks().forEach((track) => track.stop());
                return;
            }

            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                console.log("Camera started");
            }
        })
        .catch((err) => console.error("Error opening camera:", err));

        // Load the model
        (async () => {
            detectorRef.current = await createMoveNet();
            if (!isActive) return;

            // Pose loop
            const loop = async () => {
                if (!videoRef.current || !detectorRef.current) {
                    rafRef.current = requestAnimationFrame(loop);
                    return;
                }

                const poses = await detectorRef.current.estimatePoses(videoRef.current);
                if (poses?.[0]) {
                    console.log("Pose keypoints:", poses[0].keypoints.map(k => k.name || k.part));
                    const h = videoRef.current.videoHeight || videoRef.current.clientHeight || 1;
                    const wrists = mapWristY(poses[0], h);
                    if (wrists && onPose) {
                        console.log("Detected wrists:", wrists);
                        onPose(wrists);
                    }
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
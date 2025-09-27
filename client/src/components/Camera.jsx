import { useRef, useEffect } from 'react';

export default function Camera({ width = "80%" }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        let isActive = true;

        // Start the camera
        navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((mediaStream) => {
            if (isActive) {
                streamRef.current = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
                console.log("Camera started");
            }
            else {
                mediaStream.getTracks().forEach((track) => track.stop());
            }
        })
        .catch((err) => console.error("Error opening camera:", err));

        // Stop the camera
        return () => {
            isActive = false;
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
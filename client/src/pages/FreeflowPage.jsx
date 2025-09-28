import React, { useState } from "react";
import Camera from "../components/Camera";

export default function FreeflowPage() {
  const [cameraOn, setCameraOn] = useState(true);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100vh",
      background: "linear-gradient(160deg, #0b0c0e 0%, #1e1f24 40%, #232833 100%)",
      color: "#fff",
    }}>
      <h2 style={{
        fontSize: "2.5rem",
        marginBottom: "1rem",
        background: "linear-gradient(90deg, #38bdf8, #34d399, #f472b6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>
        🎶 Freeflow Jam
      </h2>

      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        maxWidth: "1200px",
        marginBottom: "1.5rem",
      }}>
        {cameraOn ? (
          <Camera width="100%" />
        ) : (
          <p style={{ color: "#aaa" }}>Camera is off</p>
        )}
      </div>

      <button
        onClick={() => setCameraOn((prev) => !prev)}
        style={{
          padding: "0.8rem 1.5rem",
          borderRadius: "10px",
          border: "none",
          fontSize: "1rem",
          fontWeight: "600",
          background: "linear-gradient(135deg, #34d399, #38bdf8, #f472b6)",
          color: "#fff",
          cursor: "pointer",
          marginBottom: "2rem",
        }}
      >
        {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
      </button>
    </div>
  );
}

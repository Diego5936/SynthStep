export function mapWristY(pose, videoHeight) {
    if (!pose?.keypoints?.length || !videoHeight) return null;

    const by = (k) => (k.name || k.part || "").toLowerCase();
    const left = pose.keypoints.find((k) => by(k).includes("left_wrist"));
    const right = pose.keypoints.find((k) => by(k).includes("right_wrist"));
    if (!left || !right) return null;

    const yL = Math.min(1, Math.max(0, left.y / videoHeight));
    const yR = Math.min(1, Math.max(0, right.y / videoHeight));
    return { yL, yR };
}

export function yToVolume(y) {
    // y = 0 (top) => 1, and vice versa
    return 1 - y;
}

export function yToPitchHz(y) {
    const topHz = 880; // A5
    const bottomHz = 110; // A2
    const t = 1 - y;
    return bottomHz + (topHz - bottomHz) * t;
}
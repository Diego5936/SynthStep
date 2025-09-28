export function mapWristY(pose, videoHeight) {
    if (!pose?.keypoints?.length || !videoHeight) return null;

    const kp = pose.keypoints;
    const getName = (k) => (k.name || k.part || "").toLowerCase();

    // Prefer named, fall back to MoveNet indices (9 = left_wrist, 10 = right_wrist)
    let left  = kp.find((k) => getName(k).includes("left_wrist"))  || kp[9];
    let right = kp.find((k) => getName(k).includes("right_wrist")) || kp[10];

    if (!left || !right) return null;

    // Confidence guard (some builds include .score)
    const MIN_SCORE = 0.2;
    const lScore = (left.score  ?? 1);
    const rScore = (right.score ?? 1);
    if (lScore < MIN_SCORE || rScore < MIN_SCORE) return null;

    if (typeof left.y !== "number" || typeof right.y !== "number") return null;

    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    const yL = clamp01(left.y  / videoHeight);
    const yR = clamp01(right.y / videoHeight);

    // Debug
    // console.log("[mapWristY]", { videoHeight, leftY:left.y, rightY:right.y, yL, yR, lScore, rScore });

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
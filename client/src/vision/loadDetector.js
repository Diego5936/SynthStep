import * as posedetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

export async function createMoveNet() {
    await tf.setBackend('webgl');
    await tf.ready();

    const detector = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet,
        {modelType: 'SinglePose.Lightning'}
    );
    return detector;
}
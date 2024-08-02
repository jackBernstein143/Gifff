// // @ts-ignore
// import { GIF } from "./gif"

const videoElement = document.getElementById('video');
const gifImg = document.getElementById('gif');
const startButton = document.getElementById('startRecording');
const canvas = document.getElementById('canvas');
const downloadLink = document.getElementById('downloadLink');

let isRecording = false;
let recordingFrames = [];
const squareSize = 320;

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: squareSize }, height: { ideal: squareSize } }
        });
        videoElement.srcObject = stream;
        await videoElement.play();

        canvas.width = squareSize;
        canvas.height = squareSize;
    } catch (error) {
        console.error(`Error accessing webcam: ${error}`);
        alert('Unable to access the camera. Please ensure you have granted permission.');
    }
}

startButton.addEventListener('click', () => {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

function startRecording() {
    isRecording = true;
    recordingFrames = [];
    startButton.textContent = 'Stop Recording';
    captureFrame();
}

function stopRecording() {
    isRecording = false;
    startButton.textContent = 'Start Recording';
    createGIF();
}

function captureFrame() {
    if (!isRecording) return;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, squareSize, squareSize);
    recordingFrames.push(canvas.toDataURL('image/jpeg', 0.5));

    if (recordingFrames.length < 50) {  // Limit to 50 frames
        setTimeout(captureFrame, 200);  // Capture a frame every 200ms
    } else {
        stopRecording();
    }
}

function createGIF() {
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: squareSize,
        height: squareSize,
        workerScript: './gif.worker.js'
    });

    recordingFrames.forEach((frame, index) => {
        const img = new Image();
        img.src = frame;
        img.onload = () => {
            gif.addFrame(img, { delay: 200 });
            if (index === recordingFrames.length - 1) {
                gif.render();
            }
        };
    });

    gif.on('finished', (blob) => {
        const gifURL = URL.createObjectURL(blob);
        gifImg.src = gifURL;
        gifImg.style.display = 'block';
        videoElement.style.display = 'none';
        downloadLink.href = gifURL;
        downloadLink.style.display = 'inline';
    });
}

setupCamera();

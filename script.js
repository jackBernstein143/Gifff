// // @ts-ignore
// import { GIF } from "./gif"

const videoElement = document.getElementById('video');
const gifImg = document.getElementById('gif');
const startButton = document.getElementById('startRecording');
const canvas = document.getElementById('canvas');
const downloadLink = document.getElementById('downloadLink');
const logElement = document.getElementById('log');

let isRecording = false;
let recordingFrames = [];
let videoWidth, videoHeight, squareSize;

function logMessage(message) {
    console.log(message);
    logElement.textContent += `${message}\n`;
    logElement.scrollTop = logElement.scrollHeight;
}

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" }
        });
        logMessage('Stream obtained');
        videoElement.srcObject = stream;
        await videoElement.play();
        logMessage('Video started playing');

        // Get the actual video dimensions
        videoWidth = videoElement.videoWidth;
        videoHeight = videoElement.videoHeight;

        // Calculate the size of the square
        squareSize = Math.min(videoWidth, videoHeight);

        // Set canvas dimensions to the square size
        canvas.width = squareSize;
        canvas.height = squareSize;

        logMessage(`Video dimensions: ${videoWidth}x${videoHeight}`);
        logMessage(`Square size: ${squareSize}x${squareSize}`);
    } catch (error) {
        logMessage(`Error accessing webcam: ${error}`);
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
    logMessage('Recording started');
    isRecording = true;
    recordingFrames = [];
    startButton.textContent = 'Stop Recording';
    captureFrame();
}

function stopRecording() {
    logMessage('Recording stopped');
    isRecording = false;
    startButton.textContent = 'Start Recording';
    createGIF();
}

function captureFrame() {
    if (!isRecording) return;

    const ctx = canvas.getContext('2d');
    const xOffset = (videoWidth - squareSize) / 2;
    const yOffset = (videoHeight - squareSize) / 2;

    ctx.drawImage(videoElement, xOffset, yOffset, squareSize, squareSize, 0, 0, squareSize, squareSize);
    recordingFrames.push(canvas.toDataURL('image/jpeg', 0.5));

    if (recordingFrames.length < 50) {  // Limit to 50 frames
        setTimeout(captureFrame, 200);  // Capture a frame every 200ms
    } else {
        stopRecording();
    }
}

function createGIF() {
    logMessage('Creating GIF...');
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

    gif.on('progress', (progress) => {
        logMessage(`GIF creation progress: ${Math.round(progress * 100)}%`);
    });

    gif.on('finished', (blob) => {
        logMessage('GIF creation finished');
        const gifURL = URL.createObjectURL(blob);
        gifImg.src = gifURL;
        gifImg.style.display = 'block';
        videoElement.style.display = 'none';
        downloadLink.href = gifURL;
        downloadLink.style.display = 'inline';
    });
}

setupCamera();

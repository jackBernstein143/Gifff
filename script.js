// // @ts-ignore
// import { GIF } from "./gif"

const videoElement = document.getElementById('video');
const gifImg = document.getElementById('gif');
const startButton = document.getElementById('startRecording');
const canvas = document.getElementById('canvas');
const downloadLink = document.getElementById('downloadLink');
const logElement = document.getElementById('log');

function logMessage(message) {
    console.log(message);
    logElement.textContent += `${message}\n`;
    logElement.scrollTop = logElement.scrollHeight;
}

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let stream;

async function setupCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: 320, height: 240 }
        });
        logMessage('Stream obtained');
        videoElement.srcObject = stream;
        await videoElement.play();
        logMessage('Video started playing');

        const mimeType = getSupportedMimeType();
        mediaRecorder = new MediaRecorder(stream, { mimeType });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        mediaRecorder.onstop = () => {
            const superBuffer = new Blob(recordedChunks, { type: mimeType });
            convertToGIF(superBuffer);
            recordedChunks = [];
        };
    } catch (error) {
        logMessage(`Error accessing webcam: ${error}`);
        alert('Unable to access the camera. Please ensure you have granted permission.');
    }
}

function getSupportedMimeType() {
    const types = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=h264,opus',
        'video/mp4;codecs=h264,aac',
    ];

    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }

    return '';
}

startButton.addEventListener('click', () => {
    if (!isRecording) {
        logMessage('Recording started');
        mediaRecorder.start(1000);  // Capture data every 1000ms
        isRecording = true;
        startButton.textContent = 'Stop Recording';
    } else {
        logMessage('Recording stopped');
        mediaRecorder.stop();
        isRecording = false;
        startButton.textContent = 'Start Recording';
    }
});

async function convertToGIF(videoBlob) {
    logMessage('Converting to GIF...');
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: 320,
        height: 240,
        workerScript: './gif.worker.js'
    });

    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    await video.play();

    const context = canvas.getContext('2d');
    const frameCaptureInterval = 200;  // Capture a frame every 200ms
    const maxFrames = 50;  // Limit to 50 frames (10 seconds at 5 FPS)
    let frameCount = 0;

    while (video.currentTime < video.duration && frameCount < maxFrames) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        gif.addFrame(context, { copy: true, delay: frameCaptureInterval });
        await new Promise(resolve => setTimeout(resolve, frameCaptureInterval));
        await video.play();  // Ensure video keeps playing
        frameCount++;
    }

    logMessage('Frames captured, rendering GIF...');
    gif.render();

    gif.on('progress', (progress) => {
        logMessage(`GIF rendering progress: ${Math.round(progress * 100)}%`);
    });

    gif.on('finished', (blob) => {
        logMessage('GIF rendering finished');
        const gifURL = URL.createObjectURL(blob);
        gifImg.src = gifURL;
        gifImg.style.display = 'block';
        videoElement.style.display = 'none';
        downloadLink.href = gifURL;
        downloadLink.style.display = 'inline';
    });
}

setupCamera();

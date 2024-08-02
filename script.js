const videoElement = document.getElementById('video');
const gifImg = document.getElementById('gif');
const recordButton = document.getElementById('record-button');
const shareButton = document.getElementById('share-button');
const closeButton = document.getElementById('close-button');
const flipButton = document.getElementById('flip-button');
const canvas = document.getElementById('canvas');

let isRecording = false;
let recordingFrames = [];
let recordingInterval;
const squareSize = 320;
const maxRecordingTime = 3000; // 3 seconds in milliseconds
let currentFacingMode = 'user';

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode, width: { ideal: squareSize }, height: { ideal: squareSize } }
        });
        videoElement.srcObject = stream;
        await videoElement.play();
        canvas.width = squareSize;
        canvas.height = squareSize;
        videoElement.style.transform = currentFacingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
    } catch (error) {
        console.error(`Error accessing webcam: ${error}`);
        alert('Unable to access the camera. Please ensure you have granted permission.');
    }
}

function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

function startRecording() {
    isRecording = true;
    recordingFrames = [];
    recordButton.style.transform = 'scale(1.1)';
    recordingInterval = setInterval(captureFrame, 200); // Capture a frame every 200ms
    setTimeout(stopRecording, maxRecordingTime);
}

function stopRecording() {
    if (!isRecording) return;
    isRecording = false;
    clearInterval(recordingInterval);
    recordButton.style.transform = 'scale(1)';
    createGIF();
}

function captureFrame() {
    const ctx = canvas.getContext('2d');
    if (currentFacingMode === 'user') {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, -squareSize, 0, squareSize, squareSize);
        ctx.restore();
    } else {
        ctx.drawImage(videoElement, 0, 0, squareSize, squareSize);
    }
    recordingFrames.push(canvas.toDataURL('image/jpeg', 0.5));
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
        closeButton.style.display = 'block';
        shareButton.style.display = 'block';
        recordButton.style.display = 'none';
        flipButton.style.display = 'none';
    });
}

recordButton.addEventListener('click', toggleRecording);

shareButton.addEventListener('click', () => {
    if (navigator.share) {
        fetch(gifImg.src)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "my_gif.gif", { type: "image/gif" });
                navigator.share({
                    files: [file],
                    title: 'Check out my GIF!',
                    text: 'I made this GIF using the awesome GIF Creator app!'
                }).then(() => console.log('Successful share'))
                    .catch((error) => console.log('Error sharing', error));
            });
    } else {
        console.log('Web Share API not supported');
        alert('Sharing is not supported on this browser.');
    }
});

closeButton.addEventListener('click', () => {
    gifImg.style.display = 'none';
    videoElement.style.display = 'block';
    closeButton.style.display = 'none';
    shareButton.style.display = 'none';
    recordButton.style.display = 'block';
    flipButton.style.display = 'block';
    setupCamera();
});

flipButton.addEventListener('click', () => {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setupCamera();
});

setupCamera();

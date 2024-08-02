const videoElement = document.getElementById('video');
const gifImg = document.getElementById('gif');
const recordButton = document.getElementById('record-button');
const shareButton = document.getElementById('share-button');
const closeButton = document.getElementById('close-button');
const flipButton = document.getElementById('flip-button');
const canvas = document.getElementById('canvas');
const progressRing = document.querySelector('#progress-ring circle');
const captionInput = document.getElementById('caption-input');
const captionDisplay = document.getElementById('caption-display');

let isRecording = false;
let recordingFrames = [];
let recordingInterval;
let recordingTimeout;
let recordingStartTime;
const squareSize = 320;
const maxRecordingTime = 3000; // 3 seconds in milliseconds
let currentFacingMode = 'user';
let finalGifBlob = null;

const circumference = progressRing.r.baseVal.value * 2 * Math.PI;
progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
progressRing.style.strokeDashoffset = circumference;

async function setupCamera() {
    // ... (camera setup code remains the same)
}

function setProgress(percent) {
    // ... (progress setting code remains the same)
}

function startRecording() {
    // ... (recording start code remains the same)
}

function stopRecording() {
    // ... (recording stop code remains the same)
}

function updateProgress() {
    // ... (progress update code remains the same)
}

function captureFrame() {
    // ... (frame capture code remains the same)
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
        finalGifBlob = blob;
        const gifURL = URL.createObjectURL(blob);
        gifImg.src = gifURL;
        gifImg.style.display = 'block';
        videoElement.style.display = 'none';
        closeButton.style.display = 'block';
        shareButton.style.display = 'block';
        recordButton.style.display = 'none';
        flipButton.style.display = 'none';
        showCaptionInput();
    });
}

function showCaptionInput() {
    // ... (caption input display code remains the same)
}

captionInput.addEventListener('input', () => {
    adjustInputWidth();
});

function adjustInputWidth() {
    // ... (input width adjustment code remains the same)
}

captionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        finalizeCaptionInput();
    }
});

function finalizeCaptionInput() {
    if (captionInput.value.trim()) {
        captionDisplay.textContent = captionInput.value;
        captionDisplay.style.display = 'flex';
        captionInput.style.display = 'none';
        updateGIFWithCaption();
    } else {
        captionInput.style.display = 'none';
    }
}

captionDisplay.addEventListener('click', () => {
    captionDisplay.style.display = 'none';
    showCaptionInput();
});

function updateGIFWithCaption() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = squareSize;
    tempCanvas.height = squareSize;
    const ctx = tempCanvas.getContext('2d');

    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: squareSize,
        height: squareSize,
        workerScript: './gif.worker.js'
    });

    // Function to add caption to a frame
    function addCaptionToFrame(imageData) {
        ctx.putImageData(imageData, 0, 0);
        
        const caption = captionInput.value || captionDisplay.textContent;
        if (caption) {
            ctx.font = '20px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(caption, squareSize / 2, squareSize - 20);
        }

        return ctx.getImageData(0, 0, squareSize, squareSize);
    }

    // Read the original GIF and add caption to each frame
    const reader = new GIF.Reader(new Uint8Array(finalGifBlob));
    
    reader.addEventListener('frame', (frame) => {
        const frameWithCaption = addCaptionToFrame(frame.image);
        gif.addFrame(frameWithCaption, { delay: frame.delay });
    });

    reader.addEventListener('end', () => {
        gif.render();
    });

    gif.on('finished', (blob) => {
        finalGifBlob = blob;
        const gifURL = URL.createObjectURL(blob);
        gifImg.src = gifURL;
    });

    reader.read();
}

// ... (event listeners for recordButton, shareButton, closeButton, and flipButton remain the same)

setupCamera();

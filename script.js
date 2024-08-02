const videoElement = document.getElementById('video');
const gifImg = document.getElementById('gif');
const recordButton = document.getElementById('record-button');
const shareButton = document.getElementById('share-button');
const closeButton = document.getElementById('close-button');
const flipButton = document.getElementById('flip-button');
const canvas = document.getElementById('canvas');
const captionInput = document.getElementById('caption-input');
const captionDisplay = document.getElementById('caption-display');

let isRecording = false;
let recordingFrames = [];
let recordingInterval;
const squareSize = 320;
const maxRecordingTime = 3000; // 3 seconds in milliseconds
let currentFacingMode = 'user';
let finalGifBlob = null;

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

function startRecording() {
    if (isRecording) return;
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
    if (recordingFrames.length > 0) {
        createGIF();
    }
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
        workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
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
        captionInput.style.display = 'block';
    });
}

function addCaptionToGIF() {
    const caption = captionInput.value.trim();
    if (!caption) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = squareSize;
    tempCanvas.height = squareSize;
    const ctx = tempCanvas.getContext('2d');

    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: squareSize,
        height: squareSize,
        workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
    });

    const reader = new FileReader();
    reader.onload = function(e) {
        const gifReader = new GIF.Parser(new Uint8Array(e.target.result));
        gifReader.onParse = function(parsedGif) {
            parsedGif.frames.forEach((frame) => {
                ctx.putImageData(frame.imageData, 0, 0);
                ctx.font = '20px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(caption, squareSize / 2, squareSize - 20);
                gif.addFrame(ctx, { delay: frame.delay, copy: true });
            });
            gif.render();
        };
        gifReader.parse();
    };
    reader.readAsArrayBuffer(finalGifBlob);

    gif.on('finished', (blob) => {
        finalGifBlob = blob;
        const gifURL = URL.createObjectURL(blob);
        gifImg.src = gifURL;
        captionInput.style.display = 'none';
        captionDisplay.textContent = caption;
        captionDisplay.style.display = 'block';
    });
}

recordButton.addEventListener('mousedown', startRecording);
recordButton.addEventListener('mouseup', stopRecording);
recordButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startRecording();
});
recordButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopRecording();
});

shareButton.addEventListener('click', () => {
    if (navigator.share) {
        const file = new File([finalGifBlob], "my_gif.gif", { type: "image/gif" });
        navigator.share({
            files: [file],
            title: 'Check out my GIF!',
            text: 'I made this GIF using the awesome GIF Creator app!'
        }).then(() => console.log('Successful share'))
          .catch((error) => console.log('Error sharing', error));
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
    captionInput.style.display = 'none';
    captionInput.value = '';
    captionDisplay.style.display = 'none';
    captionDisplay.textContent = '';
    setupCamera();
});

flipButton.addEventListener('click', () => {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setupCamera();
});

captionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addCaptionToGIF();
    }
});

setupCamera();

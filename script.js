const videoElement = document.getElementById('video');
const gifImg = document.getElementById('gif');
const recordButton = document.getElementById('record-button');
const shareButton = document.getElementById('share-button');
const closeButton = document.getElementById('close-button');
const flipButton = document.getElementById('flip-button');
const canvas = document.getElementById('canvas');
const progressRing = document.querySelector('#progress-ring circle');
const captionInput = document.getElementById('caption-input');
const captionContainer = document.querySelector('.caption-container');
const captionDisplay = document.getElementById('caption-display');

let isRecording = false;
let recordingFrames = [];
let recordingInterval;
let recordingTimeout;
let recordingStartTime;
const squareSize = 320;
const maxRecordingTime = 3000; // 3 seconds in milliseconds
let currentFacingMode = 'user';

const circumference = progressRing.r.baseVal.value * 2 * Math.PI;
progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
progressRing.style.strokeDashoffset = circumference;

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

function setProgress(percent) {
    const offset = circumference - percent / 100 * circumference;
    progressRing.style.strokeDashoffset = offset;
}

function startRecording() {
    if (isRecording) return;
    isRecording = true;
    recordingFrames = [];
    recordButton.classList.add('recording');
    progressRing.style.display = 'block';
    recordingStartTime = Date.now();
    recordingInterval = setInterval(captureFrame, 200); // Capture a frame every 200ms
    recordingTimeout = setTimeout(stopRecording, maxRecordingTime);
    requestAnimationFrame(updateProgress);
}

function stopRecording() {
    if (!isRecording) return;
    isRecording = false;
    clearInterval(recordingInterval);
    clearTimeout(recordingTimeout);
    recordButton.classList.remove('recording');
    progressRing.style.display = 'none';
    setProgress(0);
    if (recordingFrames.length > 0) {
        createGIF();
    }
}

function updateProgress() {
    if (!isRecording) return;
    const elapsedTime = Date.now() - recordingStartTime;
    const progress = (elapsedTime / maxRecordingTime) * 100;
    setProgress(progress);
    if (progress < 100) {
        requestAnimationFrame(updateProgress);
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
        showCaptionInput();
    });
}

function adjustInputWidth() {
    const padding = 16; // 8px on each side
    const minWidth = 32; // Minimum width when empty
    
    // Create a hidden span to measure text width
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'pre';
    span.style.font = window.getComputedStyle(captionInput).font;
    document.body.appendChild(span);

    // Measure the width of the input text or placeholder
    span.textContent = captionInput.value || captionContainer.dataset.placeholder;
    const textWidth = span.offsetWidth;

    // Remove the temporary span
    document.body.removeChild(span);

    // Calculate and set the new width
    const newWidth = Math.max(textWidth + padding, minWidth);
    captionInput.style.width = `${newWidth}px`;
}

captionInput.addEventListener('input', () => {
    requestAnimationFrame(() => {
        adjustInputWidth();
        captionContainer.classList.toggle('has-content', captionInput.value.length > 0);
    });
});

function showCaptionInput() {
    captionContainer.style.display = 'inline-block';
    captionInput.value = '';
    captionContainer.classList.remove('has-content');
    adjustInputWidth();
    captionInput.focus();
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
        captionContainer.style.display = 'none';
    } else {
        captionContainer.style.display = 'none';
    }
}

captionDisplay.addEventListener('click', () => {
    captionDisplay.style.display = 'none';
    showCaptionInput();
});

recordButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startRecording();
});

recordButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopRecording();
});

// For desktop testing
recordButton.addEventListener('mousedown', startRecording);
recordButton.addEventListener('mouseup', stopRecording);
recordButton.addEventListener('mouseleave', stopRecording);

shareButton.addEventListener('click', () => {
    if (navigator.share) {
        fetch(gifImg.src)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "my_gif.gif", { type: "image/gif" });
                navigator.share({
                    files: [file],
                    title: 'Check out my GIF!',
                    text: captionInput.value || captionDisplay.textContent || 'I made this GIF using the awesome GIF Creator app!'
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
    captionContainer.style.display = 'none';
    captionInput.value = '';
    captionDisplay.style.display = 'none';
    captionDisplay.textContent = '';
    setupCamera();
});

flipButton.addEventListener('click', () => {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setupCamera();
});

setupCamera();

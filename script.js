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
    recordingInterval = setInterval(captureFrame, 100); // Capture a frame every 100ms (10 FPS)
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
            gif.addFrame(img, { delay: 100 }); // 100ms delay (10 FPS)
            if (index === recordingFrames.length - 1) {
                gif.render();
            }
        };
    });

    gif.on('finished', (blob) => {
        const gifURL = URL.createObjectURL(blob);
        gifImg.src = gifURL;
        gifImg.style.display = 'block';
        gifImg.style.width = `${squareSize}px`;
        gifImg.style.height = `${squareSize}px`;
        videoElement.style.display = 'none';
        closeButton.style.display = 'block';
        shareButton.style.display = 'block';
        recordButton.style.display = 'none';
        flipButton.style.display = 'none';
        showCaptionInput();
    });
}

function adjustInputWidth() {
    const padding = 16;
    const minWidth = 32;
    
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'pre';
    span.style.font = getComputedStyle(captionInput).font;
    document.body.appendChild(span);

    span.textContent = captionInput.value || captionInput.placeholder;
    const textWidth = span.offsetWidth;

    document.body.removeChild(span);

    const newWidth = Math.max(textWidth + padding, minWidth);
    captionInput.style.width = `${newWidth}px`;
}

captionInput.addEventListener('input', adjustInputWidth);

captionInput.addEventListener('focus', () => {
    captionInput.placeholder = '';
    adjustInputWidth();
});

captionInput.addEventListener('blur', () => {
    if (!captionInput.value) {
        captionInput.placeholder = 'add a caption';
        adjustInputWidth();
    }
});

function showCaptionInput() {
    captionInput.style.display = 'block';
    captionInput.value = '';
    captionInput.placeholder = 'add a caption';
    adjustInputWidth();
}

captionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        finalizeCaptionInput();
    }
});

function wrapText(text, maxWidth, ctx) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

function createTextCanvas(text, width, height, fontSize = 16) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const padding = 16;
    const maxWidth = width - (padding * 2);
    const lines = wrapText(text, maxWidth, ctx);
    
    const lineHeight = fontSize * 1.2;
    const textHeight = lineHeight * lines.length;
    const bgHeight = textHeight + (padding * 2);
    const bgY = height - padding - bgHeight;

    // Draw rounded rectangle background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.roundRect(padding, bgY, width - (padding * 2), bgHeight, 25);
    ctx.fill();

    // Draw text
    ctx.fillStyle = 'black';
    lines.forEach((line, i) => {
        const y = bgY + padding + (i * lineHeight) + (lineHeight / 2);
        ctx.fillText(line, width / 2, y);
    });

    return canvas;
}

function finalizeCaptionInput() {
    if (captionInput.value.trim()) {
        const textCanvas = createTextCanvas(captionInput.value, squareSize, squareSize);
        captionDisplay.innerHTML = ''; // Clear previous content
        captionDisplay.appendChild(textCanvas);
        captionDisplay.style.display = 'block';
        captionInput.style.display = 'none';
    } else {
        captionInput.style.display = 'none';
    }
}

captionDisplay.addEventListener('click', () => {
    captionDisplay.style.display = 'none';
    showCaptionInput();
    captionInput.focus();
});

recordButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startRecording();
});

recordButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopRecording();
});

recordButton.addEventListener('mousedown', startRecording);
recordButton.addEventListener('mouseup', stopRecording);
recordButton.addEventListener('mouseleave', stopRecording);

shareButton.addEventListener('click', () => {
    const caption = captionInput.value || captionDisplay.textContent || '';
    createGIFForSharing(caption);
});

function createGIFForSharing(caption) {
    const scaleFactor = 2;
    const gifSize = squareSize * scaleFactor;

    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: gifSize,
        height: gifSize,
        workerScript: './gif.worker.js'
    });

    recordingFrames.forEach((frame, index) => {
        const img = new Image();
        img.src = frame;
        img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = gifSize;
            tempCanvas.height = gifSize;
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0, gifSize, gifSize);

            if (caption) {
                const textCanvas = createTextCanvas(caption, gifSize, gifSize, 16 * scaleFactor);
                ctx.drawImage(textCanvas, 0, 0);
            }

            gif.addFrame(tempCanvas, { delay: 100 });

            if (index === recordingFrames.length - 1) {
                gif.render();
            }
        };
    });

    gif.on('finished', (blob) => {
        shareGIF(blob);
    });
}

function shareGIF(blob) {
    if (navigator.share) {
        const file = new File([blob], "my_gif.gif", { type: "image/gif" });
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
}

closeButton.addEventListener('click', () => {
    gifImg.style.display = 'none';
    videoElement.style.display = 'block';
    closeButton.style.display = 'none';
    shareButton.style.display = 'none';
    recordButton.style.display = 'block';
    flipButton.style.display = 'block';
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

setupCamera();

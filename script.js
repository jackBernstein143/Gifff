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
        
        // Clear existing text and start typewriter effect after camera is set up
        const textElement = document.querySelector('.instruction .text');
        textElement.innerHTML = '';
        startTypewriterEffect();
    } catch (error) {
        console.error(`Error accessing webcam: ${error}`);
        alert('Unable to access the camera. Please ensure you have granted permission.');
    }
}

function startTypewriterEffect() {
    const text = "hold to record your gifff 🎬";
    const textElement = document.querySelector('.instruction .text');
    let index = 0;

    textElement.style.opacity = 1; // Make text visible
    textElement.style.fontWeight = 'bold'; // Ensure text is bold

    function typeWriter() {
        if (index < text.length) {
            textElement.innerHTML += text.charAt(index);
            index++;
            setTimeout(typeWriter, 50);
        }
    }

    typeWriter();
}

function updateInstructionAfterGIF() {
    const circleElement = document.querySelector('.instruction .circle');
    const textElement = document.querySelector('.instruction .text');
    
    circleElement.style.backgroundColor = '#FFBD36';
    textElement.innerHTML = ''; // Clear existing text
    textElement.style.opacity = 1;
    textElement.style.fontWeight = 'bold'; // Ensure text stays bold

    const newText = "share with your fraaandz 💕";
    let index = 0;

    function typeWriter() {
        if (index < newText.length) {
            textElement.innerHTML += newText.charAt(index);
            index++;
            setTimeout(typeWriter, 50);
        }
    }

    typeWriter();
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
        updateInstructionAfterGIF();
    });
}

function adjustInputWidth() {
    const padding = 16;
    const minWidth = 32;
    const maxWidth = 288; // Maximum width before wrapping
    
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'pre';
    span.style.font = window.getComputedStyle(captionInput).font;
    document.body.appendChild(span);

    span.textContent = captionInput.value || captionInput.placeholder;
    const textWidth = span.offsetWidth;

    document.body.removeChild(span);

    const newWidth = Math.min(Math.max(textWidth + padding, minWidth), maxWidth);
    captionInput.style.width = `${newWidth}px`;

    // If the text is too long, enable text wrapping
    if (textWidth + padding > maxWidth) {
        captionInput.style.whiteSpace = 'normal';
        captionInput.style.height = 'auto';
        captionInput.style.overflow = 'hidden';
    } else {
        captionInput.style.whiteSpace = 'nowrap';
        captionInput.style.height = '';
    }
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

function finalizeCaptionInput() {
    if (captionInput.value.trim()) {
        captionDisplay.innerHTML = formatCaption(captionInput.value);
        captionDisplay.style.display = 'flex';
        captionInput.style.display = 'none';
    } else {
        captionInput.style.display = 'none';
    }
}

function formatCaption(text) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';
    const maxLineLength = 24; // Adjust this value to change when wrapping occurs

    words.forEach(word => {
        if ((currentLine + word).length > maxLineLength) {
            if (currentLine) lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    });

    if (currentLine) lines.push(currentLine.trim());

    return lines.map(line => `<div class="caption-line">${line}</div>`).join('');
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
    const scaleFactor = 2; // Increase this for even higher resolution
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
                drawWrappedText(ctx, caption, gifSize, scaleFactor);
            }

            gif.addFrame(tempCanvas, { delay: 100 }); // 100ms delay (10 FPS)

            if (index === recordingFrames.length - 1) {
                gif.render();
            }
        };
    });

    gif.on('finished', (blob) => {
        shareGIF(blob);
    });
}

function drawWrappedText(ctx, text, gifSize, scaleFactor) {
    const fontSize = 16 * scaleFactor;
    const lineHeight = fontSize * 1.5; // Increased from 1.2 to add more space between lines
    const maxWidth = 288 * scaleFactor;
    const horizontalPadding = 12 * scaleFactor;
    const verticalPadding = 8 * scaleFactor;

    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth - (horizontalPadding * 2)) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    lines.push(currentLine);

    const totalHeight = lines.length * lineHeight + (verticalPadding * 2);
    const bgY = gifSize - 16 * scaleFactor - totalHeight;

    // Draw background for each line
    lines.forEach((line, index) => {
        const lineWidth = ctx.measureText(line).width;
        const bgWidth = Math.min(lineWidth + (horizontalPadding * 2), maxWidth);
        const bgHeight = lineHeight + (verticalPadding * 2);
        const bgRadius = Math.min(50 * scaleFactor, bgHeight / 2);
        const bgX = (gifSize - bgWidth) / 2;
        const lineY = bgY + (index * lineHeight);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(bgX + bgRadius, lineY);
        ctx.arcTo(bgX + bgWidth, lineY, bgX + bgWidth, lineY + bgHeight, bgRadius);
        ctx.arcTo(bgX + bgWidth, lineY + bgHeight, bgX, lineY + bgHeight, bgRadius);
        ctx.arcTo(bgX, lineY + bgHeight, bgX, lineY, bgRadius);
        ctx.arcTo(bgX, lineY, bgX + bgWidth, lineY, bgRadius);
        ctx.closePath();
        ctx.fill();

        // Draw text
        ctx.fillStyle = 'black';
        ctx.fillText(line, bgX + horizontalPadding, lineY + verticalPadding);
    });
}

function shareGIF(blob) {
    if (navigator.share) {
        const file = new File([blob], "my_gif.gif", { type: "image/gif" });
        navigator.share({
            files: [file],
            title: 'Check out my GIF!',
            text: ':)'
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
    
    // Reset instruction
    const circleElement = document.querySelector('.instruction .circle');
    const textElement = document.querySelector('.instruction .text');
    circleElement.style.backgroundColor = '#04CA95';
    textElement.innerHTML = '';
    textElement.style.opacity = 0;
    textElement.style.fontWeight = 'bold'; // Reset to bold
    
    setupCamera();
});

flipButton.addEventListener('click', () => {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setupCamera();
});

setupCamera();

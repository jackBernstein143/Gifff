let videoStream;
let isRecording = false;
let recordingStartTime;
let currentFacingMode = 'user';
let recordedFrames = [];
const MAX_RECORDING_TIME = 3000; // 3 seconds in milliseconds

const video = document.getElementById('video');
const gifImg = document.getElementById('gif');
const recordButton = document.getElementById('record-button');
const shareButton = document.getElementById('share-button');
const closeButton = document.getElementById('close-button');
const flipButton = document.getElementById('flip-button');

function initCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: {
            facingMode: currentFacingMode,
            width: { ideal: 320 },
            height: { ideal: 320 }
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            videoStream = stream;
            video.srcObject = stream;
            video.style.transform = currentFacingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
        })
        .catch(error => {
            console.error("Error accessing the camera", error);
            alert('Unable to access the camera. Please ensure you have granted permission.');
        });
}

function startRecording() {
    isRecording = true;
    recordingStartTime = Date.now();
    recordedFrames = [];
    captureFrame();
    recordButton.style.transform = 'scale(1.1)';
}

function stopRecording() {
    isRecording = false;
    recordButton.style.transform = 'scale(1)';
    createGIF();
}

function captureFrame() {
    if (!isRecording) return;

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    
    // Flip the image horizontally if using front camera
    if (currentFacingMode === 'user') {
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    recordedFrames.push(canvas.toDataURL('image/jpeg', 0.5));

    const elapsedTime = Date.now() - recordingStartTime;
    if (elapsedTime < MAX_RECORDING_TIME) {
        requestAnimationFrame(captureFrame);
    } else {
        stopRecording();
    }
}

function createGIF() {
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: 320,
        height: 320,
        workerScript: './gif.worker.js'
    });

    recordedFrames.forEach(frame => {
        const img = new Image();
        img.src = frame;
        img.onload = () => {
            gif.addFrame(img, { delay: 100 });
            if (img.src === recordedFrames[recordedFrames.length - 1]) {
                gif.render();
            }
        };
    });

    gif.on('finished', (blob) => {
        const gifURL = URL.createObjectURL(blob);
        gifImg.src = gifURL;
        gifImg.style.display = 'block';
        video.style.display = 'none';
        closeButton.style.display = 'block';
        shareButton.style.display = 'block';
        recordButton.style.display = 'none';
        flipButton.style.display = 'none';
    });
}

recordButton.addEventListener('mousedown', startRecording);
recordButton.addEventListener('mouseup', stopRecording);
recordButton.addEventListener('mouseleave', stopRecording);

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
    video.style.display = 'block';
    closeButton.style.display = 'none';
    shareButton.style.display = 'none';
    recordButton.style.display = 'block';
    flipButton.style.display = 'block';
    initCamera();
});

flipButton.addEventListener('click', () => {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    initCamera();
});

initCamera();

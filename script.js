// // @ts-ignore
// import { GIF } from "./gif"

const videoElement = document.getElementById('video');
const gifImg = document.getElementById('gif');
const startButton = document.getElementById('startRecording');
const stopButton = document.getElementById('stopRecording');
const canvas = document.getElementById('canvas');
const downloadLink = document.getElementById('downloadLink');
const logElement = document.getElementById('log');

function logMessage(message) {
    console.log(message);
    logElement.textContent += `${message}\n`;
}

let mediaRecorder;
let recordedChunks = [];

navigator.mediaDevices.getUserMedia({
    video: {
        facingMode: "user"
    }
})
    .then(stream => {
        logMessage('Stream obtained');
        videoElement.srcObject = stream;

        videoElement.onloadedmetadata = () => {
            logMessage('Video metadata loaded');
            videoElement.play();
        };

        videoElement.addEventListener('loadeddata', () => {
            logMessage('Video loadeddata event');
        });

        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const superBuffer = new Blob(recordedChunks, { type: 'video/webm' });
            convertToGIF(superBuffer);
            recordedChunks = [];
        };
    })
    .catch(error => {
        logMessage(`Error accessing webcam: ${error}`);
        alert('Unable to access the camera. Please ensure you have granted permission.');
    });

startButton.addEventListener('click', () => {
    logMessage('Recording started');
    mediaRecorder.start();
    startButton.disabled = true;
    stopButton.disabled = false;
});

stopButton.addEventListener('click', () => {
    logMessage('Recording stopped');
    mediaRecorder.stop();
    startButton.disabled = false;
    stopButton.disabled = true;
});

function convertToGIF(videoBlob) {
    logMessage('Converting to GIF...');
    const gif = new GIF({
        workers: 2,
        quality: 10
    });

    const url = URL.createObjectURL(videoBlob);
    const video = document.createElement('video');
    video.src = url;
    video.play();

    video.addEventListener('loadeddata', () => {
        logMessage('Video for GIF loaded');
        const interval = setInterval(() => {
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            gif.addFrame(canvas, { copy: true, delay: 100 });
        }, 100);

        video.addEventListener('ended', () => {
            clearInterval(interval);
            logMessage('Video for GIF ended');
            gif.render();
        });
    });

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
    });
}

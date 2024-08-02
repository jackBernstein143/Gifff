const videoElement = document.getElementById('video');
const startButton = document.getElementById('startRecording');
const stopButton = document.getElementById('stopRecording');
const canvas = document.getElementById('canvas');
const gifImg = document.getElementById('gif');
const downloadLink = document.getElementById('downloadLink');

let mediaRecorder;
let recordedChunks = [];

// Access webcam
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        videoElement.srcObject = stream;
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
    });

startButton.addEventListener('click', () => {
    mediaRecorder.start();
    startButton.disabled = true;
    stopButton.disabled = false;
});

stopButton.addEventListener('click', () => {
    mediaRecorder.stop();
    startButton.disabled = false;
    stopButton.disabled = true;
});

function convertToGIF(videoBlob) {
    const gif = new GIF({
        workers: 2,
        quality: 10
    });

    const url = URL.createObjectURL(videoBlob);
    const video = document.createElement('video');
    video.src = url;
    video.play();

    video.addEventListener('loadeddata', () => {
        const interval = setInterval(() => {
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            gif.addFrame(canvas, { copy: true, delay: 100 });
        }, 100);

        video.addEventListener('ended', () => {
            clearInterval(interval);
            gif.render();
        });
    });

    gif.on('finished', (blob) => {
        const gifURL = URL.createObjectURL(blob);
        gifImg.src = gifURL;
        downloadLink.href = gifURL;
    });
}

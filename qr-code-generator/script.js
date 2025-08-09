'use strict';

const inputText = document.getElementById('inputText');
const inputError = document.getElementById('inputError');
const qrSize = document.getElementById('qrSize');
const qrSizeValue = document.getElementById('qrSizeValue');
const qrEcc = document.getElementById('qrEcc');
const btnGenerate = document.getElementById('btnGenerate');
const btnClear = document.getElementById('btnClear');
const btnDownload = document.getElementById('btnDownload');
const qrcodeContainer = document.getElementById('qrcode');
const qrEmpty = document.getElementById('qrEmpty');

const cameraSelect = document.getElementById('cameraSelect');
const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const videoPlaceholder = document.getElementById('videoPlaceholder');
const fileInput = document.getElementById('fileInput');
const scanResult = document.getElementById('scanResult');
const btnCopyResult = document.getElementById('btnCopyResult');
const btnClearResult = document.getElementById('btnClearResult');

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

let qrcodeInstance = null;

function clearQRCode() {
  qrcodeContainer.innerHTML = '';
  qrcodeInstance = null;
  btnDownload.disabled = true;
  if (qrEmpty) qrEmpty.classList.remove('hidden');
}

function generateQRCode() {
  const text = (inputText.value || '').trim();
  if (!text) {
    inputError?.classList.remove('hidden');
    clearQRCode();
    return;
  }
  inputError?.classList.add('hidden');

  const size = Number(qrSize.value) || 256;
  const correctLevelMap = { L: QRCode.CorrectLevel.L, M: QRCode.CorrectLevel.M, Q: QRCode.CorrectLevel.Q, H: QRCode.CorrectLevel.H };
  const correctLevel = correctLevelMap[qrEcc.value] || QRCode.CorrectLevel.M;

  qrcodeContainer.innerHTML = '';
  qrcodeInstance = new QRCode(qrcodeContainer, {
    text,
    width: size,
    height: size,
    colorDark: '#0f172a', // slate-900
    colorLight: '#ffffff',
    correctLevel,
  });

  btnDownload.disabled = false;
  if (qrEmpty) qrEmpty.classList.add('hidden');
}

qrSize.addEventListener('input', () => {
  qrSizeValue.textContent = String(qrSize.value);
});

btnGenerate.addEventListener('click', generateQRCode);

btnClear.addEventListener('click', () => {
  inputText.value = '';
  clearQRCode();
});

btnDownload.addEventListener('click', () => {
  if (!qrcodeContainer) return;
  const img = qrcodeContainer.querySelector('img');
  const canvas = qrcodeContainer.querySelector('canvas');
  let dataUrl = '';
  if (canvas) {
    dataUrl = canvas.toDataURL('image/png');
  } else if (img && img.src) {
    dataUrl = img.src;
  }
  if (!dataUrl) return;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = 'qr-code.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

let mediaStream = null;
let scanIntervalId = null;

async function listCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === 'videoinput');
    cameraSelect.innerHTML = '';
    videoInputs.forEach((device, idx) => {
      const opt = document.createElement('option');
      opt.value = device.deviceId;
      opt.textContent = device.label || `Kamera ${idx + 1}`;
      cameraSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Kamera listesi alınamadı:', err);
  }
}

async function startCamera() {
  try {
    stopCamera();
    const constraints = {
      audio: false,
      video: {
        deviceId: cameraSelect.value ? { exact: cameraSelect.value } : undefined,
        facingMode: 'environment',
      },
    };
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = mediaStream;
    await video.play();
    btnStart.disabled = true;
    btnStop.disabled = false;
    videoPlaceholder.classList.add('hidden');
    beginScanLoop();
  } catch (err) {
    console.error('Kamera başlatılamadı:', err);
    alert('Kamera erişimi reddedildi veya kullanılamıyor. İzinleri kontrol edin.');
  }
}

function stopCamera() {
  if (scanIntervalId) {
    window.clearInterval(scanIntervalId);
    scanIntervalId = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
  btnStart.disabled = false;
  btnStop.disabled = true;
  videoPlaceholder.classList.remove('hidden');
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);
}

function drawBox(location, color = '#22c55e') {
  const ctx = overlay.getContext('2d');
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
  ctx.lineTo(location.topRightCorner.x, location.topRightCorner.y);
  ctx.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
  ctx.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
  ctx.closePath();
  ctx.stroke();
}

function beginScanLoop() {
  const ctx = overlay.getContext('2d');
  const tmpCanvas = document.createElement('canvas');
  const tmpCtx = tmpCanvas.getContext('2d');

  scanIntervalId = window.setInterval(() => {
    if (!video.videoWidth || !video.videoHeight) return;

    overlay.width = video.clientWidth;
    overlay.height = video.clientHeight;

    tmpCanvas.width = video.videoWidth;
    tmpCanvas.height = video.videoHeight;
    tmpCtx.drawImage(video, 0, 0, tmpCanvas.width, tmpCanvas.height);

    const imageData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (code) {
      const scaleX = overlay.width / tmpCanvas.width;
      const scaleY = overlay.height / tmpCanvas.height;
      const mapPoint = (p) => ({ x: p.x * scaleX, y: p.y * scaleY });
      drawBox(
        {
          topLeftCorner: mapPoint(code.location.topLeftCorner),
          topRightCorner: mapPoint(code.location.topRightCorner),
          bottomRightCorner: mapPoint(code.location.bottomRightCorner),
          bottomLeftCorner: mapPoint(code.location.bottomLeftCorner),
        },
        '#22c55e'
      );
      setScanResult(code.data);
    }
  }, 150);
}

function setScanResult(text) {
  scanResult.value = text || '';
  const disabled = !text;
  btnCopyResult.disabled = disabled;
  btnClearResult.disabled = disabled;
}

btnStart.addEventListener('click', startCamera);
btnStop.addEventListener('click', stopCamera);

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode().catch(() => {});

  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, c.width, c.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  });
  if (code) {
    setScanResult(code.data);
  } else {
    alert('QR bulunamadı. Daha net bir görsel deneyin.');
  }
  URL.revokeObjectURL(img.src);
});

btnCopyResult.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(scanResult.value);
  } catch (err) {
    console.error('Kopyalanamadı:', err);
  }
});

btnClearResult.addEventListener('click', () => setScanResult(''));

(async function initDevices() {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((s) => {
      s.getTracks().forEach((t) => t.stop());
    }).catch(() => {});
  } finally {
    await listCameras();
  }
})();


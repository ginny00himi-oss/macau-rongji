(() => {
  const poster = document.getElementById('posterShell');
  const layers = [...document.querySelectorAll('.view-layer')];
  const steps = [...document.querySelectorAll('.view-list li')];
  const viewButtons = [...document.querySelectorAll('[data-view]')];
  const viewCode = document.getElementById('viewCode');
  const readout = document.getElementById('scanReadout');
  const cursor = document.getElementById('handCursor');
  const stateText = document.getElementById('stateText');
  const stateDot = document.getElementById('stateDot');
  const cameraButton = document.getElementById('cameraButton');
  const video = document.getElementById('cameraFeed');
  const cameraFrame = document.getElementById('cameraFrame');
  const labels = ['01 / 正面', '02 / 右前', '03 / 俯視', '04 / 背面', '05 / 側面'];
  let current = 0;
  let scan = 10;
  let cameraReady = false;
  let lastSeen = 0;
  let swipeAnchor = null;
  let lastSwipe = 0;
  let pointerDown = false;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  function setState(text, live = false) {
    stateText.textContent = text;
    stateDot.classList.toggle('is-live', live);
  }
  function setScan(value) {
    scan = clamp(value, 0, 100);
    poster.style.setProperty('--scan', `${scan}%`);
    readout.textContent = `SCAN ${String(Math.round(scan)).padStart(2, '0')}%`;
  }
  function setView(index) {
    current = (index + layers.length) % layers.length;
    poster.classList.add('is-changing');
    window.setTimeout(() => {
      layers.forEach((layer, layerIndex) => layer.classList.toggle('is-active', layerIndex === current));
      steps.forEach((step, stepIndex) => step.classList.toggle('is-current', stepIndex === current));
      viewCode.textContent = labels[current];
      setScan(Math.max(scan, 42));
      window.setTimeout(() => poster.classList.remove('is-changing'), 280);
    }, 160);
  }
  function movePointer(x, y) {
    cursor.style.setProperty('--x', `${clamp(x, 0, 1) * 100}%`);
    cursor.style.setProperty('--y', `${clamp(y, 0, 1) * 100}%`);
    cursor.classList.add('is-visible');
  }
  function isOpenPalm(landmarks) {
    const fingers = [[8, 6], [12, 10], [16, 14], [20, 18]];
    return fingers.filter(([tip, joint]) => landmarks[tip].y < landmarks[joint].y).length >= 3;
  }
  function handleHand(landmarks) {
    const palm = landmarks[9];
    const now = performance.now();
    lastSeen = now;
    movePointer(1 - palm.x, palm.y);
    if (!isOpenPalm(landmarks)) {
      setState('請張開手掌', true);
      return;
    }
    setState('掃描進行中', true);
    setScan(clamp(((palm.y - .12) / .73) * 100, 6, 100));
    if (!swipeAnchor || now - swipeAnchor.time > 650) {
      swipeAnchor = { x: palm.x, y: palm.y, time: now };
      return;
    }
    const dx = palm.x - swipeAnchor.x;
    const dy = palm.y - swipeAnchor.y;
    if (now - lastSwipe > 900 && Math.abs(dx) > .22 && Math.abs(dx) > Math.abs(dy) * 1.55) {
      setView(current + (dx < 0 ? 1 : -1));
      lastSwipe = now;
      swipeAnchor = { x: palm.x, y: palm.y, time: now };
    }
  }
  function onHandResults(results) {
    const hand = results.multiHandLandmarks && results.multiHandLandmarks[0];
    if (hand) handleHand(hand);
  }
  async function activateCamera() {
    if (cameraReady) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('此裝置無法開啟鏡頭');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      video.srcObject = stream;
      await video.play();
      cameraFrame.classList.add('is-visible');
      cameraReady = true;
      cameraButton.textContent = '鏡頭已開啟';
      cameraButton.disabled = true;
      if (!window.Hands || !window.Camera) {
        setState('鏡頭已開啟，可用下方按鈕操作', true);
        return;
      }
      const hands = new window.Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
      hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: .65, minTrackingConfidence: .65 });
      hands.onResults(onHandResults);
      const camera = new window.Camera(video, { onFrame: async () => hands.send({ image: video }), width: 1280, height: 720 });
      camera.start();
      cameraButton.textContent = '手勢掃描已啟動';
      setState('看到手掌即開始掃描', true);
    } catch (error) {
      setState('鏡頭未開啟，仍可手動操作');
    }
  }
  function pointerScan(event) {
    const rect = poster.getBoundingClientRect();
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    movePointer(x, y);
    setScan(y * 100);
    setState('手動掃描中', false);
  }

  cameraButton.addEventListener('click', activateCamera);
  document.getElementById('prevButton').addEventListener('click', () => setView(current - 1));
  document.getElementById('nextButton').addEventListener('click', () => setView(current + 1));
  viewButtons.forEach((button) => button.addEventListener('click', () => setView(Number(button.dataset.view))));
  poster.addEventListener('pointerdown', (event) => { pointerDown = true; poster.setPointerCapture(event.pointerId); pointerScan(event); });
  poster.addEventListener('pointermove', (event) => { if (pointerDown) pointerScan(event); });
  poster.addEventListener('pointerup', () => { pointerDown = false; });
  poster.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); setView(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); setView(current + 1); }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activateCamera(); }
  });
  window.setInterval(() => {
    if (cameraReady && performance.now() - lastSeen > 1500) {
      cursor.classList.remove('is-visible');
      setScan(Math.max(4, scan - 10));
      setState('手勢離開，資料回流中', true);
      swipeAnchor = null;
    }
  }, 520);
  setScan(10);
})();

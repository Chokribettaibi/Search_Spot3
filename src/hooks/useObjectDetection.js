import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

const HISTORY_LIMIT = 20;
const DUPLICATE_COOLDOWN_MS = 4200;
const SEARCH_COOLDOWN_MS = 12000;

function isMobileDevice() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function useObjectDetection({ videoRef, canvasRef, autoSearchEnabled }) {
  const [modelReady, setModelReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeLabel, setActiveLabel] = useState('');
  const [error, setError] = useState('');

  const modelRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(0);
  const lastInferenceTimeRef = useRef(0);
  const duplicateGuardRef = useRef(new Map());
  const autoSearchGuardRef = useRef(new Map());
  const audioContextRef = useRef(null);
  const isMountedRef = useRef(true);
  const autoSearchEnabledRef = useRef(autoSearchEnabled);

  const isMobile = useMemo(() => isMobileDevice(), []);
  const detectionInterval = isMobile ? 320 : 220;
  const minScore = isMobile ? 0.58 : 0.5;
  const maxNumBoxes = isMobile ? 5 : 8;

  const stopStream = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext?.('2d');
    context?.clearRect(0, 0, canvas.width, canvas.height);

    setCameraReady(false);
    setTorchSupported(false);
    setTorchEnabled(false);
    setIsDetecting(false);
  }, [canvasRef, videoRef]);

  const playDetectionSound = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(640, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        980,
        context.currentTime + 0.08,
      );

      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.18);
    } catch {
      // Ignore audio failures on browsers that block autoplay audio contexts.
    }
  }, []);

  const searchForLabel = useCallback((label) => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(
      label,
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const drawDetections = useCallback(
    (nextDetections) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        return;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) {
        return;
      }

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      context.clearRect(0, 0, width, height);
      context.lineWidth = 3;
      context.textBaseline = 'top';

      nextDetections.forEach((prediction, index) => {
        const [x, y, boxWidth, boxHeight] = prediction.bbox;
        const hue = 190 + index * 18;
        const confidence = Math.round(prediction.score * 100);
        const label = `${prediction.class} ${confidence}%`;

        const gradient = context.createLinearGradient(x, y, x + boxWidth, y + boxHeight);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 1)`);
        gradient.addColorStop(1, `hsla(${hue + 36}, 100%, 65%, 0.85)`);

        context.shadowColor = `hsla(${hue}, 100%, 70%, 0.5)`;
        context.shadowBlur = 18;
        context.strokeStyle = gradient;
        context.fillStyle = 'rgba(3, 7, 18, 0.75)';

        context.beginPath();
        context.roundRect(x, y, boxWidth, boxHeight, 18);
        context.stroke();

        const tagWidth = clamp(label.length * 8.4 + 26, 120, 240);
        const tagHeight = 34;
        const tagY = y > 44 ? y - 42 : y + 10;

        context.beginPath();
        context.fillStyle = 'rgba(2, 6, 23, 0.86)';
        context.roundRect(x, tagY, tagWidth, tagHeight, 14);
        context.fill();

        context.shadowBlur = 0;
        context.fillStyle = '#e2f8ff';
        context.font = '600 15px ui-sans-serif, system-ui, sans-serif';
        context.fillText(label, x + 14, tagY + 9);

        context.strokeStyle = 'rgba(125, 211, 252, 0.95)';
        const corner = 22;
        const inset = 6;

        context.beginPath();
        context.moveTo(x + inset, y + corner);
        context.lineTo(x + inset, y + inset);
        context.lineTo(x + corner, y + inset);

        context.moveTo(x + boxWidth - corner, y + inset);
        context.lineTo(x + boxWidth - inset, y + inset);
        context.lineTo(x + boxWidth - inset, y + corner);

        context.moveTo(x + inset, y + boxHeight - corner);
        context.lineTo(x + inset, y + boxHeight - inset);
        context.lineTo(x + corner, y + boxHeight - inset);

        context.moveTo(x + boxWidth - corner, y + boxHeight - inset);
        context.lineTo(x + boxWidth - inset, y + boxHeight - inset);
        context.lineTo(x + boxWidth - inset, y + boxHeight - corner);
        context.stroke();
      });
    },
    [canvasRef, videoRef],
  );

  const registerStableDetections = useCallback(
    (nextDetections) => {
      const now = Date.now();

      nextDetections.forEach((prediction) => {
        const label = prediction.class;
        const confidence = Math.round(prediction.score * 100);
        const duplicateKey = `${label}-${Math.floor(confidence / 10)}`;
        const lastSeen = duplicateGuardRef.current.get(duplicateKey) ?? 0;

        if (now - lastSeen < DUPLICATE_COOLDOWN_MS) {
          return;
        }

        duplicateGuardRef.current.set(duplicateKey, now);
        setActiveLabel(label);
        playDetectionSound();
        setHistory((current) => [
          {
            id: `${label}-${now}`,
            label,
            confidence,
            timestamp: formatTime(new Date(now)),
          },
          ...current,
        ].slice(0, HISTORY_LIMIT));

        // Only stable, non-duplicate detections are allowed to trigger history and search.
        if (!autoSearchEnabledRef.current) {
          return;
        }

        const lastSearch = autoSearchGuardRef.current.get(label) ?? 0;
        if (now - lastSearch < SEARCH_COOLDOWN_MS) {
          return;
        }

        autoSearchGuardRef.current.set(label, now);
        searchForLabel(label);
      });
    },
    [playDetectionSound, searchForLabel],
  );

  const detectionLoop = useCallback(
    async (timestamp) => {
      const video = videoRef.current;
      const model = modelRef.current;

      if (!video || !model || video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      if (timestamp - lastInferenceTimeRef.current < detectionInterval) {
        animationFrameRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      lastInferenceTimeRef.current = timestamp;

      try {
        // Throttled inference keeps the UI responsive on mid-range phones.
        const predictions = await model.detect(video, maxNumBoxes, minScore);
        if (!isMountedRef.current) {
          return;
        }

        setDetections(predictions);
        drawDetections(predictions);
        registerStableDetections(predictions.filter((item) => item.score >= minScore));
      } catch (loopError) {
        if (isMountedRef.current) {
          setError(loopError.message || 'Realtime detection failed.');
        }
      } finally {
        if (isMountedRef.current) {
          animationFrameRef.current = requestAnimationFrame(detectionLoop);
        }
      }
    },
    [
      detectionInterval,
      drawDetections,
      maxNumBoxes,
      minScore,
      registerStableDetections,
      videoRef,
    ],
  );

  const loadModel = useCallback(async () => {
    if (modelRef.current) {
      setModelReady(true);
      return;
    }

    try {
      setError('');
      await tf.ready();
      modelRef.current = await cocoSsd.load({
        base: isMobile ? 'lite_mobilenet_v2' : 'mobilenet_v2',
      });

      if (isMountedRef.current) {
        setModelReady(true);
      }
    } catch (loadError) {
      if (isMountedRef.current) {
        setError(loadError.message || 'Unable to load the AI model.');
      }
    }
  }, [isMobile]);

  const startCamera = useCallback(
    async (facingMode = 'environment') => {
      try {
        setError('');
        stopStream();

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('This browser does not support camera access.');
        }

        // We prefer the environment camera for a Lens-style experience on phones.
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: isMobile ? 1280 : 1920 },
            height: { ideal: isMobile ? 720 : 1080 },
          },
        });

        if (!isMountedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) {
          return;
        }

        streamRef.current = stream;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        await video.play();

        const [videoTrack] = stream.getVideoTracks();
        const capabilities = videoTrack.getCapabilities?.() ?? {};
        setTorchSupported(Boolean(capabilities.torch));
        setCameraReady(true);
        setIsDetecting(true);
        animationFrameRef.current = requestAnimationFrame(detectionLoop);
      } catch (cameraError) {
        if (isMountedRef.current) {
          setError(
            cameraError.message ||
              'Camera access failed. Check permissions and try again.',
          );
        }
      }
    },
    [detectionLoop, isMobile, stopStream, videoRef],
  );

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track?.applyConstraints) {
      return;
    }

    try {
      const nextTorchState = !torchEnabled;
      await track.applyConstraints({
        advanced: [{ torch: nextTorchState }],
      });
      setTorchEnabled(nextTorchState);
    } catch {
      setTorchSupported(false);
    }
  }, [torchEnabled]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return '';
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      return '';
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  }, [videoRef]);

  useEffect(() => {
    autoSearchEnabledRef.current = autoSearchEnabled;
  }, [autoSearchEnabled]);

  useEffect(() => {
    isMountedRef.current = true;
    loadModel();

    return () => {
      isMountedRef.current = false;
      stopStream();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close?.();
      }
    };
  }, [loadModel, stopStream]);

  return {
    activeLabel,
    cameraReady,
    captureFrame,
    detections,
    error,
    history,
    isDetecting,
    modelReady,
    startCamera,
    stopStream,
    torchEnabled,
    torchSupported,
    toggleTorch,
  };
}

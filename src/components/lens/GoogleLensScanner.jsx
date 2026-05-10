import { useEffect, useRef, useState } from 'react';
import DetectionHistorySidebar from './DetectionHistorySidebar';
import { useObjectDetection } from '../../hooks/useObjectDetection';

function GoogleLensScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const barcodeDetectorRef = useRef(null);
  const barcodeFrameRef = useRef(0);
  const barcodeLastScanRef = useRef(0);
  const [facingMode, setFacingMode] = useState('environment');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(true);
  const [capturedImage, setCapturedImage] = useState('');
  const [barcodeScanEnabled, setBarcodeScanEnabled] = useState(false);
  const [barcodeSupported, setBarcodeSupported] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState('619345678901');
  const [barcodeStatus, setBarcodeStatus] = useState('Barcode standby');

  const {
    activeLabel,
    cameraReady,
    captureFrame,
    detections,
    error,
    history,
    isDetecting,
    modelReady,
    startCamera,
    torchEnabled,
    torchSupported,
    toggleTorch,
  } = useObjectDetection({
    autoSearchEnabled,
    canvasRef,
    videoRef,
  });

  useEffect(() => {
    if (modelReady) {
      startCamera(facingMode);
    }
  }, [facingMode, modelReady, startCamera]);

  useEffect(() => {
    let active = true;

    async function setupBarcodeDetector() {
      if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
        if (active) {
          setBarcodeSupported(false);
          setBarcodeStatus('Barcode unsupported');
        }
        return;
      }

      try {
        const supportedFormats = await window.BarcodeDetector.getSupportedFormats?.();
        const preferredFormats = [
          'ean_13',
          'ean_8',
          'upc_a',
          'upc_e',
          'code_128',
          'code_39',
          'qr_code',
        ];
        const formats =
          supportedFormats?.filter((format) => preferredFormats.includes(format)) ??
          preferredFormats;

        barcodeDetectorRef.current = new window.BarcodeDetector(
          formats.length ? { formats } : undefined,
        );

        if (active) {
          setBarcodeSupported(true);
          setBarcodeStatus('Barcode ready');
        }
      } catch {
        if (active) {
          setBarcodeSupported(false);
          setBarcodeStatus('Barcode unavailable');
        }
      }
    }

    setupBarcodeDetector();

    return () => {
      active = false;
      if (barcodeFrameRef.current) {
        cancelAnimationFrame(barcodeFrameRef.current);
        barcodeFrameRef.current = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (!barcodeSupported || !barcodeScanEnabled || !cameraReady) {
      if (barcodeFrameRef.current) {
        cancelAnimationFrame(barcodeFrameRef.current);
        barcodeFrameRef.current = 0;
      }

      setBarcodeStatus((current) => {
        if (!barcodeSupported) {
          return 'Barcode unsupported';
        }

        return barcodeScanEnabled ? 'Barcode waiting camera' : 'Barcode standby';
      });
      return;
    }

    let active = true;

    const scanBarcodes = async () => {
      const video = videoRef.current;
      const detector = barcodeDetectorRef.current;

      if (!active || !video || !detector || video.readyState < 2) {
        barcodeFrameRef.current = requestAnimationFrame(scanBarcodes);
        return;
      }

      const now = performance.now();
      if (now - barcodeLastScanRef.current < 350) {
        barcodeFrameRef.current = requestAnimationFrame(scanBarcodes);
        return;
      }

      barcodeLastScanRef.current = now;

      try {
        const barcodes = await detector.detect(video);
        if (!active) {
          return;
        }

        if (barcodes.length > 0) {
          const liveValue = barcodes[0].rawValue?.trim();
          if (liveValue) {
            setBarcodeValue(liveValue);
            setBarcodeStatus('Barcode live');
          }
        } else {
          setBarcodeStatus('Barcode scanning...');
        }
      } catch {
        if (active) {
          setBarcodeStatus('Barcode scan error');
        }
      } finally {
        if (active) {
          barcodeFrameRef.current = requestAnimationFrame(scanBarcodes);
        }
      }
    };

    setBarcodeStatus('Barcode scanning...');
    barcodeFrameRef.current = requestAnimationFrame(scanBarcodes);

    return () => {
      active = false;
      if (barcodeFrameRef.current) {
        cancelAnimationFrame(barcodeFrameRef.current);
        barcodeFrameRef.current = 0;
      }
    };
  }, [barcodeScanEnabled, barcodeSupported, cameraReady]);

  const handleCapture = () => {
    const frame = captureFrame();
    if (frame) {
      setCapturedImage(frame);
    }
  };

  const handleSearch = (label) => {
    window.open(
      `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(label)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const liveStatus = isDetecting && cameraReady ? 'Live detection' : 'Preparing camera';
  const activeStatusLabel = activeLabel || 'Scanning environment';

  return (
    <div className="app-shell">
      <div className="ambient-backdrop" />

      <header className="app-chrome app-header">
        <div className="app-chrome-inner">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="hero-chip">
                Foussana 1418
                <span className="mx-2 text-rose-300">|</span>
                <span className="normal-case text-amber-100">
                  RM: Malek ARM Dalel
                </span>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  Search Spot 3
                </h1>
                <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/12 px-3 py-1 text-xs font-medium text-emerald-100">
                  by Bettaibi Chokri
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Mobile camera workspace with live object detection, barcode capture,
                and premium glass UI.
              </p>
            </div>

            <div className="control-strip">
              <button
                type="button"
                onClick={() =>
                  setFacingMode((current) =>
                    current === 'environment' ? 'user' : 'environment',
                  )
                }
                className="secondary-btn"
              >
                Switch camera
              </button>

              <button
                type="button"
                onClick={() => setHistoryOpen((current) => !current)}
                className={historyOpen ? 'accent-btn' : 'secondary-btn'}
              >
                {historyOpen ? 'Hide history' : 'Show history'}
              </button>

              <button
                type="button"
                onClick={() => setAutoSearchEnabled((current) => !current)}
                className={autoSearchEnabled ? 'accent-btn' : 'secondary-btn'}
              >
                Auto search {autoSearchEnabled ? 'on' : 'off'}
              </button>

              <button
                type="button"
                onClick={() => setBarcodeScanEnabled((current) => !current)}
                disabled={!barcodeSupported}
                className={barcodeScanEnabled ? 'primary-btn' : 'secondary-btn'}
              >
                Barcode live {barcodeScanEnabled ? 'on' : 'off'}
              </button>

              {torchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={torchEnabled ? 'warning-btn' : 'secondary-btn'}
                >
                  Flash {torchEnabled ? 'on' : 'off'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="camera-layout">
        <div className="camera-viewport">
          <div className="scanner-frame">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />

            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />

            <div className="camera-shell-overlay" />

            <div className="pointer-events-none absolute inset-x-5 top-1/2 z-10 hidden -translate-y-1/2 md:block">
              <div className="scan-grid h-[56vh] max-h-[30rem] rounded-[2rem] border border-white/10" />
            </div>

            <div className="camera-focus-ring pointer-events-none absolute left-1/2 top-1/2 z-10 h-[54%] w-[82%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-cyan-300/20 bg-white/[0.03]">
              <div className="scan-line" />
              <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_80px_rgba(34,211,238,0.08)]" />
            </div>

            <div className="camera-overlay-top">
              <div className="floating-badge">
                <p className="eyebrow">Live status</p>
                <p className="mt-2 text-lg font-semibold text-white md:text-2xl">
                  {activeStatusLabel}
                </p>
              </div>

              <span
                className={`status-pill ${
                  isDetecting && cameraReady
                    ? 'bg-emerald-400/20 text-emerald-100'
                    : 'bg-amber-400/20 text-amber-100'
                }`}
              >
                {liveStatus}
              </span>
            </div>

            <div className="camera-overlay-bottom">
              <div className="floating-badge">
                <p className="eyebrow">Code barre</p>
                <p className="mt-2 text-lg font-semibold text-white" id="code-barre">
                  {barcodeValue}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                  {barcodeStatus}
                </p>
              </div>

              {capturedImage && (
                <div className="preview-card">
                  <img
                    src={capturedImage}
                    alt="Captured frame"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>

            {!modelReady && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/78 backdrop-blur-2xl">
                <div className="panel w-[min(92vw,26rem)] p-8 text-center">
                  <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-cyan-300" />
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">
                    Loading model...
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Wassa3 Balik m3ana la7tha bark
                  </p>
                </div>
              </div>
            )}

            <DetectionHistorySidebar
              history={history}
              isOpen={historyOpen}
              onSearchItem={handleSearch}
              onToggle={() => setHistoryOpen((current) => !current)}
            />
          </div>
        </div>
      </main>

      <footer className="app-chrome app-footer">
        <div className="app-chrome-inner">
          <div className="footer-grid">
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Objects</p>
                <p className="stat-value">{detections.length}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Search</p>
                <p className="stat-value">{autoSearchEnabled ? 'Auto' : 'Manual'}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Code Article</p>
                <p className="stat-value">100435</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Quantite</p>
                <p className="stat-value">
                  15 <span className="text-slate-400">units</span>
                </p>
              </div>
            </div>

            <div className="footer-actions">
              <button
                type="button"
                onClick={handleCapture}
                className="capture-btn"
                aria-label="Capture current frame"
              >
                <span className="h-10 w-10 rounded-full border-2 border-white bg-white/90" />
              </button>

              <button
                type="button"
                onClick={() => activeLabel && handleSearch(activeLabel)}
                disabled={!activeLabel}
                className="secondary-btn min-w-[10rem]"
              >
                Search with Google
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
              {error}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default GoogleLensScanner;

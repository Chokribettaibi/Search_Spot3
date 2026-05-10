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

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.22),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.18),_transparent_24%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(15,23,42,0.18),_rgba(2,6,23,0.94))]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center p-0 md:p-6">
        <div className="relative h-screen w-full overflow-hidden bordstatuser-white/10 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.55)] md:h-[92vh] md:rounded-[2rem] md:border">
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

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(2,6,23,0.22),_rgba(2,6,23,0.38),_rgba(2,6,23,0.72))]" />

          <div className="pointer-events-none absolute inset-x-6 top-1/2 z-10 hidden -translate-y-1/2 md:block">
            <div className="scan-grid rounded-[2rem] border border-white/10" />
          </div>

          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[58%] w-[78%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-cyan-400/20 bg-white/[0.02]">
            <div className="scan-line" />
            <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_60px_rgba(34,211,238,0.08)]" />
          </div>

          {!modelReady && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl">
              <div className="glass-card w-[min(92vw,26rem)] rounded-[2rem] p-8 text-center">
                <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-cyan-300" />
                <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
                  Loading model...
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Wassa3 Balik m3ana la7tha bark 
                </p>
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 top-0 z-20 p-4 md:p-6">
            <div className="glass-card flex flex-col gap-4 rounded-[1.75rem] p-4 md:flex-row md:items-center md:justify-between md:p-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-100 px-4 py-1 rounded-full bg-cyan-400/10 inline-block zindex-10">
                  Foussana 1418 <span className="text-rose-400">|<br></br></span> <span className="text-amber-700 lowercase"><span className="text-cyan-200 uppercase" >RM</span>: Malek <span className="text-cyan-200 uppercase" >ARM</span> Dalel</span>
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  Search Spot 3
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  
                  <span className="mx-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-medium text-emerald-200">
                    by Bettaibi Chokri
                  </span>
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((current) =>
                      current === 'environment' ? 'user' : 'environment',
                    )
                  }
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
                >
                  Switch camera
                </button>

                <button
                  type="button"
                  onClick={() => setAutoSearchEnabled((current) => !current)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    autoSearchEnabled
                      ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100'
                      : 'border-white/15 bg-white/10 text-white'
                  }`}
                >
                  Auto search {autoSearchEnabled ? 'on' : 'off'}
                </button>

                <button
                  type="button"
                  onClick={() => setBarcodeScanEnabled((current) => !current)}
                  disabled={!barcodeSupported}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    barcodeScanEnabled
                      ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100'
                      : 'border-white/15 bg-white/10 text-white'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  Barcode live {barcodeScanEnabled ? 'on' : 'off'}
                </button>

                {torchSupported && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      torchEnabled
                        ? 'border-amber-400/50 bg-amber-400/20 text-amber-100'
                        : 'border-white/15 bg-white/10 text-white'
                    }`}
                  >
                    Flash {torchEnabled ? 'on' : 'off'}
                  </button>
                )}
              </div></div>

          </div>

          <DetectionHistorySidebar
            history={history}
            isOpen={historyOpen}
            onSearchItem={handleSearch}
            onToggle={() => setHistoryOpen((current) => !current)}
          />

          <div className="absolute inset-x-0 bottom-0 z-20 p-4 md:p-6">
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="glass-card rounded-[1.75rem] p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Live status
                    </p>
                    <p className="mt-2 text-xl font-semibold capitalize text-white">
                      {activeLabel || 'Scanning environment'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isDetecting && cameraReady
                        ? 'bg-emerald-400/20 text-emerald-200'
                        : 'bg-amber-400/20 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-amber-200">
                    {isDetecting && cameraReady ? 'Live detection' : 'Preparing camera'}
                    </div>
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap flex-end gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-400">Objects</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {detections.length}
                    </p>
                  </div>
                  {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-400">Model</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {modelReady ? 'Ready' : 'Loading'}
                    </p>
                  </div> */}
                  
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-400">Search</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {autoSearchEnabled ? 'Auto' : 'Manual'}
                    </p>
                  </div>
                   <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-400">Code Article</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      100435
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-400 ">Code Barre</p>
                    <p className="mt-1 text-xl font-semibold text-white" id="code-barre">
                      {barcodeValue}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                      {barcodeStatus}
                    </p>
                  </div>
                  {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-400">Position</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      <span className="text-rose-400">Palet 04</span>, <span className="text-amber-400">Cart: 25</span>
                    </p>
                  </div> */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-400">Quantité</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      15 <span className="text-slate-400">units</span>
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
                    {error}
                  </div>
                )}
              </div>

              <div className="glass-card rounded-[1.75rem] p-4 md:p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Quick actions
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-300/20 shadow-[0_0_40px_rgba(34,211,238,0.22)] transition hover:scale-105 hover:bg-cyan-300/25"
                    aria-label="Capture current frame"
                  >
                    <span className="h-10 w-10 rounded-full border-2 border-white bg-white/90" />
                  </button>

                  <button
                    type="button"
                    onClick={() => activeLabel && handleSearch(activeLabel)}
                    disabled={!activeLabel}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Search with Google
                  </button>
                </div>

                {capturedImage && (
                  <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
                    <img
                      src={capturedImage}
                      alt="Captured frame"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoogleLensScanner;

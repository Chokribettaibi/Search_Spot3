import { useEffect, useMemo, useRef, useState } from 'react';
import { useObjectDetection } from '../../hooks/useObjectDetection';
import CameraSection from './CameraSection';
import ExpandableCard from './ExpandableCard';
import GlassButton from './GlassButton';
import TogglePanel from './TogglePanel';

function SwitchCameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7 8.5L9.6 6H14.4L17 8.5H19A2 2 0 0 1 21 10.5V16A2 2 0 0 1 19 18H5A2 2 0 0 1 3 16V10.5A2 2 0 0 1 5 8.5H7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 13C9 11.34 10.34 10 12 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M15 13C15 14.66 13.66 16 12 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8.8 11.6L9 13.9L11.2 13.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.2 14.4L15 12.1L12.8 12.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M4 12A8 8 0 1 1 6.34 17.66L4 20V12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 8V12L14.5 14.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 3L13.9 8.1L19 10L13.9 11.9L12 17L10.1 11.9L5 10L10.1 8.1L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BarcodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="M5 6V18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 6V18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 6V18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15 6V18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M19 6V18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function FlashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M13 2L6 13H11L10 22L18 10H13L13 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M8 6L9.4 4H14.6L16 6H18A3 3 0 0 1 21 9V17A3 3 0 0 1 18 20H6A3 3 0 0 1 3 17V9A3 3 0 0 1 6 6H8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

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
  const [topPanelOpen, setTopPanelOpen] = useState(false);
  const [openCards, setOpenCards] = useState({
    objects: true,
    search: true,
    article: false,
    quantity: false,
  });

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

  const activeStatusLabel = activeLabel || 'Scanning environment';
  const detectionCountLabel = `${detections.length} object${detections.length === 1 ? '' : 's'}`;
  const historyCountLabel = `${history.length} saved item${history.length === 1 ? '' : 's'}`;

  const toggleCard = (cardKey) => {
    setOpenCards((current) => ({
      ...current,
      [cardKey]: !current[cardKey],
    }));
  };

  const topActions = useMemo(
    () => [
      {
        key: 'switch-camera',
        label: 'Switch camera',
        onClick: () =>
          setFacingMode((current) => (current === 'environment' ? 'user' : 'environment')),
        active: facingMode === 'user',
        variant: 'accent',
        direction: 'left',
        icon: <SwitchCameraIcon />,
        ariaLabel: 'Switch between rear and front camera',
      },
      {
        key: 'history',
        label: historyOpen ? 'Hide history' : 'Show history',
        onClick: () => setHistoryOpen((current) => !current),
        active: historyOpen,
        variant: 'accent',
        direction: 'right',
        icon: <HistoryIcon />,
        ariaLabel: historyOpen ? 'Hide detection history' : 'Show detection history',
      },
      {
        key: 'auto-search',
        label: `Auto search ${autoSearchEnabled ? 'on' : 'off'}`,
        onClick: () => setAutoSearchEnabled((current) => !current),
        active: autoSearchEnabled,
        variant: 'success',
        direction: 'left',
        icon: <SparkIcon />,
        ariaLabel: `Turn auto search ${autoSearchEnabled ? 'off' : 'on'}`,
      },
      {
        key: 'barcode-live',
        label: `Barcode live ${barcodeScanEnabled ? 'on' : 'off'}`,
        onClick: () => setBarcodeScanEnabled((current) => !current),
        active: barcodeScanEnabled,
        disabled: !barcodeSupported,
        variant: 'warning',
        direction: 'right',
        icon: <BarcodeIcon />,
        ariaLabel: barcodeSupported
          ? `Turn barcode live mode ${barcodeScanEnabled ? 'off' : 'on'}`
          : 'Barcode live mode unsupported on this browser',
      },
      ...(torchSupported
        ? [
            {
              key: 'flash',
              label: `Flash ${torchEnabled ? 'on' : 'off'}`,
              onClick: toggleTorch,
              active: torchEnabled,
              variant: 'warning',
              direction: 'left',
              icon: <FlashIcon />,
              ariaLabel: `Turn flash ${torchEnabled ? 'off' : 'on'}`,
            },
          ]
        : []),
    ],
    [
      autoSearchEnabled,
      barcodeScanEnabled,
      barcodeSupported,
      facingMode,
      historyOpen,
      torchEnabled,
      torchSupported,
      toggleTorch,
    ],
  );

  return (
    <div className="app-shell">
      <div className="ambient-backdrop" />

              <TogglePanel
              className="mb-3 lg:mb-0 position-absolute"aria-label="Main actions"
        actions={topActions}
        isOpen={topPanelOpen}
        onToggle={() => setTopPanelOpen((current) => !current)}
      />
      

      <div className="shell-content">
        {/* Header */}
        <header className="glass-panel interactive-glow rounded-[2rem] p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w">
              <p className="hero-chip text-center text-xs uppercase tracking-[0.2em] text-teal-400">
               <span className="font-bold"> AZIZA Foussana 1418</span> 
                {/* <span className="mx-2 text-rose-300">|</span> */}
                <span className="normal-case text-cyan-300">RM: Malek ARM: Dalel</span>
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-[clamp(1.9rem,4vw,3.5rem)] font-semibold tracking-tight text-white">
                  Search Spot 3
                </h1>
                
                <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/12 px-3 py-1 text-xs font-medium text-emerald-100">
                  by Bettaibi Chokri
                </span>
              </div>

              <p className="mt-3 max-w-3xl text-[clamp(0.82rem,1.4vw,0.95rem)] text-slate-300">
                Mobile camera workspace with live object detection, barcode capture,
                
              </p>
            </div>

            {/* <div className="stats-grid w-full text-xs lg:max-w-[28rem]">
              <div className="stat-card text-xs">
                <p className="stat-label text-xs">Camera</p>
                <p className="stat-value text-xs">{facingMode === 'environment' ? 'Rear lens' : 'Front lens'}</p>
              </div>
              <div className="stat-card text-xs">
                <p className="stat-label text-xs">Search</p>
                <p className="stat-value text-xs">{autoSearchEnabled ? 'Auto' : 'Manual'}</p>
              </div>
              <div className="stat-card text-xs">
                <p className="stat-label text-xs">Barcode</p>
                <p className="stat-value text-xs">{barcodeScanEnabled ? 'Live' : 'Standby'}</p>
              </div>
              <div className="stat-card text-xs">
                <p className="stat-label text-xs">History</p>
                <p className="stat-value text-xs">{history.length}</p>
              </div>
            </div> */}
          </div>
        </header>

        {/* Camera section */}
        <main className="flex-1">
          <CameraSection
            activeStatusLabel={activeStatusLabel}
            barcodeStatus={barcodeStatus}
            barcodeValue={barcodeValue}
            cameraReady={cameraReady}
            canvasRef={canvasRef}
            capturedImage={capturedImage}
            history={history}
            historyOpen={historyOpen}
            isDetecting={isDetecting}
            modelReady={modelReady}
            onSearchItem={handleSearch}
            onToggleHistory={() => setHistoryOpen((current) => !current)}
            videoRef={videoRef}
          />
          <div className="glass-panel interactive-glow rounded-[2rem] p-4 sm:p-5 lg:p-6">
          <div className="stats-grid w-full text-xs lg:max-w-[28rem]">
              <div className="stat-card text-xs">
                <p className="stat-label text-xs">Camera</p>
                <p className="stat-value text-xs">{facingMode === 'environment' ? 'Rear lens' : 'Front lens'}</p>
              </div>
              <div className="stat-card text-xs">
                <p className="stat-label text-xs">Search</p>
                <p className="stat-value text-xs">{autoSearchEnabled ? 'Auto' : 'Manual'}</p>
              </div>
              <div className="stat-card text-xs">
                <p className="stat-label text-xs">Barcode</p>
                <p className="stat-value text-xs">{barcodeScanEnabled ? 'Live' : 'Standby'}</p>
              </div>
              <div className="stat-card text-xs">
                <p className="stat-label text-xs">History</p>
                <p className="stat-value text-xs">{history.length}</p>
              </div>
            </div>

          </div>
        </main>

        {/* Bottom controls and expandable insight cards */}
        <footer className="glass-panel interactive-glow rounded-[2rem] p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <ExpandableCard
                id="objects-card"
                title="OBJECTS"
                summary={`${detectionCountLabel} currently tracked`}
                isOpen={openCards.objects}
                onToggle={() => toggleCard('objects')}
              >
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Active label
                    </p>
                    <p className="mt-2 text-base font-semibold capitalize text-white">
                      {activeStatusLabel}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
                    <span>{historyCountLabel}</span>
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
                      Live
                    </span>
                  </div>
                </div>
              </ExpandableCard>

              <ExpandableCard
                id="search-card"
                title="SEARCH"
                summary={autoSearchEnabled ? 'Auto shopping search active' : 'Manual search mode'}
                isOpen={openCards.search}
                onToggle={() => toggleCard('search')}
              >
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
                    Auto search opens Google Shopping when a stable object is detected.
                  </div>
                  <GlassButton
                    onClick={() => activeLabel && handleSearch(activeLabel)}
                    disabled={!activeLabel}
                    variant="accent"
                    className="w-full justify-center"
                    icon={<SparkIcon />}
                  >
                    Search with Google
                  </GlassButton>
                </div>
              </ExpandableCard>

              <ExpandableCard
                id="article-card"
                title="CODE ARTICLE"
                summary={barcodeSupported ? 'Live code stream available' : 'Barcode unsupported'}
                isOpen={openCards.article}
                onToggle={() => toggleCard('article')}
              >
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Current code</p>
                    <p className="mt-2 break-all text-sm font-semibold tracking-[0.18em] text-white">
                      {barcodeValue}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
                    {barcodeStatus}
                  </div>
                </div>
              </ExpandableCard>

              <ExpandableCard
                id="quantity-card"
                title="QUANTITE"
                summary="Inventory quick look"
                isOpen={openCards.quantity}
                onToggle={() => toggleCard('quantity')}
              >
                <div className="space-y-3">
                  <div className="flex items-end justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Units</p>
                      <p className="mt-2 text-2xl font-semibold text-white">15</p>
                    </div>
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                      In stock
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
                    Quantity card is now collapsible and optimized for compact mobile layouts.
                  </div>
                </div>
              </ExpandableCard>

              <ExpandableCard
                id="position-article"
                title="POSITION ARTICLE"
                summary="New card example"
                isOpen={openCards.new}
                onToggle={() => toggleCard('new')}
              >
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
                    Palet: 02<br/> carton: 15
                  </div>
                </div>
              </ExpandableCard>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-[14rem]">
              <GlassButton
                onClick={handleCapture}
                ariaLabel="Capture current frame"
                variant="accent"
                className="h-14 w-full justify-center rounded-[1.35rem]"
                icon={<CameraIcon />}
              >
                Capture frame
              </GlassButton>

              <GlassButton
                onClick={() => activeLabel && handleSearch(activeLabel)}
                disabled={!activeLabel}
                className="h-14 w-full justify-center rounded-[1.35rem]"
                icon={<HistoryIcon />}
              >
                Search result
              </GlassButton>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

export default GoogleLensScanner;

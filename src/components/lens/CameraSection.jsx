import { memo } from 'react';
import { motion } from 'framer-motion';
import DetectionHistorySidebar from './DetectionHistorySidebar';

function CameraSectionComponent({
  activeStatusLabel,
  barcodeStatus,
  barcodeValue,
  cameraReady,
  canvasRef,
  capturedImage,
  history,
  historyOpen,
  isDetecting,
  modelReady,
  onSearchItem,
  onToggleHistory,
  videoRef,
}) {
  const liveStatus = isDetecting && cameraReady ? 'Live detection' : 'Preparing camera';

  return (
    <section className="camera-stage">
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

        <div className="pointer-events-none absolute inset-x-4 top-1/2 z-10 hidden -translate-y-1/2 md:block lg:inset-x-6">
          <div className="scan-grid mx-auto h-[min(54vh,30rem)] max-w-4xl rounded-[2rem] border border-white/10" />
        </div>

        <div className="camera-focus-ring pointer-events-none absolute left-1/2 top-1/2 z-10 h-[52%] w-[84%] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-cyan-300/18 bg-white/[0.03]">
          <div className="scan-line" />
          <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_80px_rgba(34,211,238,0.08)]" />
        </div>

        {/* Camera status overlays */}
        <div className="camera-overlay-top">
          <div className="floating-badge max-w-[16rem] sm:max-w-[18rem]">
            <p className="eyebrow text-[0.7rem] text-cyan-50/70">Object detected</p>
            <p className="mt-2 text-[clamp(1rem,2vw,1.65rem)] font-semibold leading-tight text-white">
              {activeStatusLabel}
            </p>
          </div>

          <span
            className={`status-pill ${
              isDetecting && cameraReady
                ? 'bg-emerald-400/18 text-emerald-100'
                : 'bg-amber-400/18 text-amber-100'
            }`}
          >
            {liveStatus}
          </span>
        </div>

        <div className="camera-overlay-bottom">
          <div className="floating-badge max-w-[15rem] sm:max-w-[18rem]">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-400">
              {barcodeStatus}
            </p>
            <p
              className="mt-2 break-all text-sm font-semibold tracking-[0.18em] text-white sm:text-base"
              id="code-barre"
            >
              {barcodeValue}
            </p>
          </div>

          {capturedImage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="preview-card"
            >
              <img
                src={capturedImage}
                alt="Captured frame preview"
                className="h-full w-full object-cover"
              />
            </motion.div>
          ) : null}
        </div>

        {!modelReady ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/78 backdrop-blur-2xl">
            <div className="glass-panel w-[min(92vw,26rem)] p-8 text-center">
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-cyan-300" />
              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">
                Loading model...
              </h2>
              <p className="mt-2 text-sm text-slate-300">Wassa3 Balik m3ana la7tha bark</p>
            </div>
          </div>
        ) : null}

        {/* Detection history drawer */}
        <DetectionHistorySidebar
          history={history}
          isOpen={historyOpen}
          onSearchItem={onSearchItem}
          onToggle={onToggleHistory}
        />
      </div>
    </section>
  );
}

const CameraSection = memo(CameraSectionComponent);

export default CameraSection;

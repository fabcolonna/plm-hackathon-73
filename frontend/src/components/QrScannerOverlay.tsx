import type { RefObject } from "react";
import type { ActiveScannerConfig } from "../hooks/useQrScanner";

type QrScannerOverlayProps = {
  activeScanner: ActiveScannerConfig | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  scanError: string | null;
  onClose: () => void;
};

export function QrScannerOverlay({
  activeScanner,
  videoRef,
  scanError,
  onClose,
}: QrScannerOverlayProps) {
  if (!activeScanner) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              QR scanner
            </p>
            <p className="text-base font-semibold text-white">
              Aim at the {activeScanner.label} QR code
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-rose-500 hover:text-rose-300"
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-black">
          <video
            ref={videoRef}
            className="h-64 w-full object-cover"
            playsInline
            autoPlay
            muted
          />
        </div>
        {scanError && (
          <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {scanError}
          </p>
        )}
      </div>
    </div>
  );
}

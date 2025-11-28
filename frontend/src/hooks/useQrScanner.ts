import { useCallback, useEffect, useRef, useState } from "react";

export type ActiveScannerConfig = {
  label: string;
  onResult: (value: string) => void;
};

type BarcodeDetectorResult = {
  rawValue?: string;
};

type BarcodeDetectorConstructor = new (config?: {
  formats?: string[];
}) => {
  detect(source: CanvasImageSource | HTMLVideoElement): Promise<
    BarcodeDetectorResult[]
  >;
};

export function useQrScanner() {
  const [activeScanner, setActiveScanner] =
    useState<ActiveScannerConfig | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopScanner = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!activeScanner) {
      stopScanner();
      return;
    }

    const currentScanner = activeScanner;

    let cancelled = false;

    async function startScanner() {
      if (typeof window === "undefined" || !videoRef.current) {
        setScanError("Camera preview unavailable in this environment.");
        return;
      }

      const detectorCtor = (window as typeof window & {
        BarcodeDetector?: BarcodeDetectorConstructor;
      }).BarcodeDetector;

      if (!detectorCtor) {
        setScanError("Browser does not support QR detection.");
        return;
      }

      try {
        const detector = new detectorCtor({ formats: ["qr_code"] });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const scanFrame = async () => {
          if (!videoRef.current || cancelled) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            const qrValue = barcodes.find(
              (code: BarcodeDetectorResult) => Boolean(code.rawValue)
            )?.rawValue;
            if (qrValue) {
              currentScanner.onResult(qrValue.trim());
              setActiveScanner(null);
              return;
            }
            rafRef.current = requestAnimationFrame(scanFrame);
          } catch (detectError) {
            console.error(detectError);
            setScanError("Unable to read QR code. Try again.");
            rafRef.current = requestAnimationFrame(scanFrame);
          }
        };

        rafRef.current = requestAnimationFrame(scanFrame);
      } catch (cameraError) {
        console.error(cameraError);
        setScanError("Camera permission denied or unavailable.");
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [activeScanner, stopScanner]);

  const startScan = useCallback((config: ActiveScannerConfig) => {
    setScanError(null);
    setActiveScanner(config);
  }, []);

  const closeScanner = useCallback(() => {
    setActiveScanner(null);
    setScanError(null);
  }, []);

  return {
    activeScanner,
    startScan,
    closeScanner,
    videoRef,
    scanError,
  };
}

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import type { RenderTask } from 'pdfjs-dist/types/src/display/api';

// Use CDN worker for production builds
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
}

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.2;

export const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, fileName }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + SCALE_STEP, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - SCALE_STEP, MIN_SCALE));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      const request = (el.requestFullscreen ?? (el as any).webkitRequestFullscreen ?? (el as any).msRequestFullscreen)?.bind(el);
      request?.();
    } else {
      const exit = (document.exitFullscreen ?? (document as any).webkitExitFullscreen ?? (document as any).msExitFullscreen)?.bind(document);
      exit?.();
    }
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [fileUrl, fileName]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage((prev) => {
        const next = Math.max(1, Math.min(page, totalPages));
        return next === prev ? prev : next;
      });
    },
    [totalPages],
  );

  useEffect(() => {
    setScale(1);
    setRotation(0);
    setCurrentPage(1);
    setRenderError(null);
  }, [fileUrl]);

  useEffect(() => {
    const onFullChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener('fullscreenchange', onFullChange);
    return () => document.removeEventListener('fullscreenchange', onFullChange);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    setPdfDocument(null);
    setIsRendering(true);

    const loadingTask = getDocument(fileUrl);

    loadingTask.promise
      .then((doc) => {
        if (isCancelled) {
          doc.destroy();
          return;
        }
        setPdfDocument(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setRenderError(null);
      })
      .catch((error) => {
        if (isCancelled) return;
        console.error('Failed to load PDF', error);
        setRenderError('Nu am putut încărca documentul. Verifică conexiunea și încearcă din nou.');
      })
      .finally(() => {
        if (!isCancelled) {
          setIsRendering(false);
        }
      });

    return () => {
      isCancelled = true;
      loadingTask.destroy();
    };
  }, [fileUrl]);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) {
      return;
    }

    let cancelled = false;
    let renderTask: RenderTask | null = null;

    const renderPage = async () => {
      setIsRendering(true);
      setRenderError(null);
      try {
        const page = await pdfDocument.getPage(currentPage);
        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Context 2D indisponibil.');
        }

        const outputScale = window.devicePixelRatio || 1;

        canvas.width = viewport.width * outputScale;
        canvas.height = viewport.height * outputScale;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

  renderTask = page.render({ canvasContext: context, viewport, canvas });
        await renderTask.promise;
      } catch (error: any) {
        if (cancelled) return;
        if (error?.name === 'RenderingCancelledException') {
          return;
        }
        console.error('Failed to render PDF page', error);
        setRenderError('Nu am putut afișa pagina. Încearcă să ajustezi zoom-ul sau să reîncarci documentul.');
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    };

    void renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDocument, currentPage, scale, rotation]);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div ref={containerRef} className="w-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={scale <= MIN_SCALE}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={scale >= MAX_SCALE}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Pagina {Math.min(currentPage, totalPages)} din {totalPages || 1}
          </span>
          <Button variant="outline" size="sm" onClick={handleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-muted/20 p-4">
        <div className="flex justify-center">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>

        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {renderError && !isRendering && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
              {renderError}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 p-4 border-t border-border bg-card">
        <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={!canGoPrev}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={!canGoNext}>
          Următor <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

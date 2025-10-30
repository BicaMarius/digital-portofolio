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
  const [isMobile, setIsMobile] = useState(false);
  const [scale, setScale] = useState(() => {
    // Set initial scale based on device - mobile needs larger scale for readability
    return window.innerWidth < 768 ? 1.5 : 1;
  });
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Detect mobile on mount and adjust scale
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Adjust scale when switching between mobile/desktop if at default values
      if (mobile && scale === 1) {
        setScale(1.5);
      } else if (!mobile && scale === 1.5) {
        setScale(1);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [scale]);

  // Pinch-to-zoom support for mobile
  const touchDistance = useRef<number | null>(null);
  const lastScale = useRef<number>(1);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchDistance.current = distance;
      lastScale.current = scale;
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistance.current !== null) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scaleChange = distance / touchDistance.current;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, lastScale.current * scaleChange));
      setScale(newScale);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchDistance.current = null;
  }, []);

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
    // Reset to appropriate zoom based on device
    setScale(window.innerWidth < 768 ? 1.5 : 1);
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
        if (cancelled) return;

        // Use scale directly - user controls zoom
        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
        if (!context) {
          throw new Error('Context 2D indisponibil.');
        }

        // Use high-DPI rendering for crisp display at all zoom levels
        const outputScale = Math.max(window.devicePixelRatio || 1, 2);
        const scaledViewport = page.getViewport({ scale: scale * outputScale, rotation });

        // Set canvas dimensions for sharp rendering
        canvas.width = Math.floor(scaledViewport.width);
        canvas.height = Math.floor(scaledViewport.height);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        // Clear canvas before rendering
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Reset transform to identity
        context.setTransform(1, 0, 0, 1, 0, 0);

        // Enable image smoothing for better quality
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        if (cancelled) return;

        const renderParams = { 
          canvasContext: context, 
          viewport: scaledViewport,
          canvas,
        };

        renderTask = page.render(renderParams);
        await renderTask.promise;
        
        // Cleanup page after successful render
        page.cleanup();
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
  }, [pdfDocument, currentPage, scale, rotation, isMobile]);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div ref={containerRef} className="w-full flex flex-col">
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-wrap items-center justify-between gap-3'} ${isMobile ? 'p-2' : 'p-4'} border-b border-border bg-card`}>
        <div className={`flex items-center ${isMobile ? 'justify-between w-full' : 'gap-2'}`}>
          <div className="flex items-center gap-1">
            <Button variant="outline" size={isMobile ? 'icon' : 'sm'} onClick={handleZoomOut} disabled={scale <= MIN_SCALE} className={isMobile ? 'h-8 w-8' : ''}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-xs font-medium min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size={isMobile ? 'icon' : 'sm'} onClick={handleZoomIn} disabled={scale >= MAX_SCALE} className={isMobile ? 'h-8 w-8' : ''}>
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button variant="outline" size={isMobile ? 'icon' : 'sm'} onClick={handleRotate} className={isMobile ? 'h-8 w-8' : ''}>
              <RotateCw className="h-3 w-3" />
            </Button>
          </div>

          {!isMobile && (
            <span className="text-xs sm:text-sm text-muted-foreground">
              Pagina {Math.min(currentPage, totalPages)} din {totalPages || 1}
            </span>
          )}

          <div className="flex items-center gap-1">
            <Button variant="outline" size={isMobile ? 'icon' : 'sm'} onClick={handleFullscreen} className={isMobile ? 'h-8 w-8' : ''}>
              {isFullscreen ? (
                isMobile ? <Minimize2 className="h-3 w-3" /> : <Minimize2 className="h-4 w-4" />
              ) : (
                isMobile ? <Maximize2 className="h-3 w-3" /> : <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size={isMobile ? 'icon' : 'sm'} onClick={handleDownload} className={isMobile ? 'h-8 w-8' : ''}>
              {isMobile ? <Download className="h-3 w-3" /> : <><Download className="h-4 w-4 mr-2" />Download</>}
            </Button>
          </div>
        </div>

        {isMobile && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={!canGoPrev} className="h-7 px-2">
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span>
              Pagina {Math.min(currentPage, totalPages)} / {totalPages || 1}
            </span>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={!canGoNext} className="h-7 px-2">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <div 
        className={`relative flex-1 overflow-auto bg-muted/20 ${isMobile ? 'p-2' : 'p-4'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-center items-start min-h-full">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden inline-block">
            <canvas 
              ref={canvasRef} 
              className="block max-w-full h-auto"
              style={{ 
                imageRendering: 'crisp-edges',
                WebkitFontSmoothing: 'antialiased',
              }}
            />
          </div>
        </div>

        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {renderError && !isRendering && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm max-w-md text-center">
              {renderError}
            </div>
          </div>
        )}
      </div>

      {!isMobile && (
        <div className="flex items-center justify-center gap-3 p-4 border-t border-border bg-card">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={!canGoPrev}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={!canGoNext}>
            Următor <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

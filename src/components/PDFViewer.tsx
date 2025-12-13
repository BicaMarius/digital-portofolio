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
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [scale, setScale] = useState(1);
  const [baseScale, setBaseScale] = useState(1); // Base scale to fit container
  const [zoomLevel, setZoomLevel] = useState(0.8); // User zoom multiplier - start at 80%
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Pinch-to-zoom and pan support for mobile
  const touchDistance = useRef<number | null>(null);
  const lastScale = useRef<number>(1);
  const [mobileTransform, setMobileTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const lastTouchPos = useRef<{ x: number; y: number } | null>(null);
  const pinchCenter = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    
    if (e.touches.length === 2) {
      // Pinch gesture start
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchDistance.current = distance;
      lastScale.current = mobileTransform.scale;
      setIsPinching(true);
      
      // Store pinch center
      pinchCenter.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
    } else if (e.touches.length === 1 && mobileTransform.scale > 1) {
      // Pan gesture start (only when zoomed in)
      lastTouchPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      setIsPanning(true);
    }
  }, [isMobile, mobileTransform.scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    
    if (e.touches.length === 2 && touchDistance.current !== null) {
      // Pinch gesture - use CSS transform for smooth zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scaleChange = distance / touchDistance.current;
      const newScale = Math.max(0.5, Math.min(4, lastScale.current * scaleChange));
      
      setMobileTransform(prev => ({
        ...prev,
        scale: newScale
      }));
    } else if (e.touches.length === 1 && isPanning && lastTouchPos.current && mobileTransform.scale > 1) {
      // Pan gesture - move the content
      e.preventDefault();
      const deltaX = e.touches[0].clientX - lastTouchPos.current.x;
      const deltaY = e.touches[0].clientY - lastTouchPos.current.y;
      
      setMobileTransform(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      lastTouchPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  }, [isMobile, isPanning, mobileTransform.scale]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    
    if (isPinching && e.touches.length < 2) {
      // Pinch ended - apply zoom level if significantly changed
      setIsPinching(false);
      touchDistance.current = null;
      pinchCenter.current = null;
      
      // If scale is close to 1, reset to 1
      if (mobileTransform.scale < 1.1 && mobileTransform.scale > 0.9) {
        setMobileTransform({ scale: 1, x: 0, y: 0 });
      }
      // If scale went below minimum, reset
      else if (mobileTransform.scale < 0.8) {
        setMobileTransform({ scale: 1, x: 0, y: 0 });
      }
    }
    
    if (isPanning && e.touches.length === 0) {
      setIsPanning(false);
      lastTouchPos.current = null;
    }
  }, [isMobile, isPinching, isPanning, mobileTransform.scale]);

  // Double tap to reset zoom on mobile
  const lastTapTime = useRef<number>(0);
  const handleDoubleTap = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      // Double tap detected
      e.preventDefault();
      if (mobileTransform.scale > 1) {
        // Reset zoom
        setMobileTransform({ scale: 1, x: 0, y: 0 });
      } else {
        // Zoom in to 2x at tap position
        setMobileTransform({ scale: 2, x: 0, y: 0 });
      }
    }
    lastTapTime.current = now;
  }, [isMobile, mobileTransform.scale]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + SCALE_STEP, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - SCALE_STEP, MIN_SCALE));
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
    // Reset zoom and rotation on file change
    setZoomLevel(0.8);
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

  // Calculate base scale using width-only sizing with safe fallbacks
  useEffect(() => {
    if (!pdfDocument) {
      return;
    }

    let cancelled = false;

    const calculateBaseScale = async () => {
      try {
        const page = await pdfDocument.getPage(1);
        if (cancelled) return;

        const containerWidth = contentRef.current?.clientWidth ?? window.innerWidth;
        const padding = isMobile ? 16 : 32;
        const availableWidth = Math.max(containerWidth - padding, 320);
        const pageViewport = page.getViewport({ scale: 1, rotation });

        let rawScale = availableWidth / pageViewport.width;
        rawScale = Math.min(rawScale, 1.6);

        const minDesktopScale = 0.95;
        const safeScale = Math.min(
          Math.max(rawScale, isMobile ? rawScale : minDesktopScale),
          1.6
        );

        if (!cancelled) {
          setBaseScale(safeScale > 0 ? safeScale : (isMobile ? 0.75 : 0.95));
        }

        page.cleanup();
      } catch (error) {
        console.error('Failed to calculate base scale', error);
      }
    };

    void calculateBaseScale();

    const resizeObserver = new ResizeObserver(() => {
      void calculateBaseScale();
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
    };
  }, [pdfDocument, rotation, isMobile]);

  // Update scale when zoom level or base scale changes
  useEffect(() => {
    setScale(baseScale * zoomLevel);
  }, [baseScale, zoomLevel]);

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

        // Use calculated scale that maintains aspect ratio
        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
        if (!context) {
          throw new Error('Context 2D indisponibil.');
        }

        // Use high-DPI rendering for crisp display at all zoom levels
        // Clamp outputScale to prevent excessive memory usage on high zoom
        const devicePixelRatio = window.devicePixelRatio || 1;
        const outputScale = Math.min(Math.max(devicePixelRatio, 2), 3);
        const scaledViewport = page.getViewport({ scale: scale * outputScale, rotation });

        // Set canvas internal dimensions (high-res for sharp rendering)
        canvas.width = Math.floor(scaledViewport.width);
        canvas.height = Math.floor(scaledViewport.height);
        
        // Set canvas display dimensions (maintains aspect ratio, no stretching)
        // Use exact dimensions to preserve aspect ratio at all zoom levels
        const displayWidth = Math.floor(viewport.width);
        const displayHeight = Math.floor(viewport.height);
        
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        canvas.style.maxWidth = 'none'; // Don't constrain, let container handle scrolling
        canvas.style.display = 'block';

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
            <Button variant="outline" size={isMobile ? 'icon' : 'sm'} onClick={handleZoomOut} disabled={zoomLevel <= MIN_SCALE} className={isMobile ? 'h-8 w-8' : ''}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-xs font-medium min-w-[50px] text-center">{Math.round(zoomLevel * 100)}%</span>
            <Button variant="outline" size={isMobile ? 'icon' : 'sm'} onClick={handleZoomIn} disabled={zoomLevel >= MAX_SCALE} className={isMobile ? 'h-8 w-8' : ''}>
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
        ref={contentRef}
        className={`relative flex-1 bg-muted/20 ${isMobile ? 'p-2 overflow-hidden touch-none' : 'p-4 overflow-auto'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          handleTouchEnd(e);
          handleDoubleTap(e);
        }}
      >
        <div 
          className="flex items-center justify-center min-w-full min-h-full"
          style={isMobile ? {
            transform: `translate(${mobileTransform.x}px, ${mobileTransform.y}px) scale(${mobileTransform.scale})`,
            transformOrigin: 'center center',
            transition: isPinching || isPanning ? 'none' : 'transform 0.2s ease-out',
            willChange: 'transform',
          } : undefined}
        >
          <div className="bg-white shadow-2xl rounded-lg overflow-hidden" style={{ margin: 'auto' }}>
            <canvas 
              ref={canvasRef} 
              className="block"
              style={{ 
                imageRendering: 'crisp-edges',
                WebkitFontSmoothing: 'antialiased',
              }}
            />
          </div>
        </div>

        {/* Mobile zoom indicator */}
        {isMobile && mobileTransform.scale !== 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
            {Math.round(mobileTransform.scale * 100)}% • Doublă atingere pentru reset
          </div>
        )}

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

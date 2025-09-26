import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2 } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, fileName }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const baseWidth = 900;
  const baseHeight = 800;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFullscreen = () => {
    const el = containerRef.current as (HTMLElement | null);
    if (!el) return;
    if (!document.fullscreenElement) {
      const req = (el as HTMLElement & {
        requestFullscreen?: () => Promise<void>;
        webkitRequestFullscreen?: () => void;
        msRequestFullscreen?: () => void;
      });
      const request = req.requestFullscreen?.bind(el) || req.webkitRequestFullscreen?.bind(el) || req.msRequestFullscreen?.bind(el);
      if (request) { try { request(); } catch { /* ignore */ } }
    } else {
      const docReq = document as Document & {
        exitFullscreen?: () => Promise<void>;
        webkitExitFullscreen?: () => void;
        msExitFullscreen?: () => void;
      };
      const exit = docReq.exitFullscreen?.bind(document) || docReq.webkitExitFullscreen?.bind(document) || docReq.msExitFullscreen?.bind(document);
      if (exit) { try { exit(); } catch { /* ignore */ } }
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  useEffect(() => {
    // Reset scale and rotation when file changes
    setScale(1);
    setRotation(0);
    setCurrentPage(1);
  }, [fileUrl]);

  // Sync isFullscreen with document fullscreen state to avoid glitches
  useEffect(() => {
    const onFullChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', onFullChange as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', onFullChange as EventListener);
    };
  }, []);

  return (
  <div ref={containerRef} className={`w-full flex flex-col`}>
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={scale >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* PDF Container */}
      <div className="flex-1 overflow-auto bg-muted/20 p-4">
        <div className="flex justify-center">
          <div 
            className="bg-white shadow-lg rounded-lg overflow-hidden flex justify-center items-start"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease-in-out',
              maxWidth: '100%'
            }}
          >
            <iframe
              src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&page=${currentPage}&view=FitH`}
              style={{
                width: isFullscreen ? '100vw' : `${Math.round(baseWidth * scale)}px`,
                height: isFullscreen ? 'calc(100vh - 120px)' : `${Math.round(baseHeight * scale)}px`,
                border: '0'
              }}
              title={fileName}
              onLoad={() => {
                // Keep simple fallback for total pages
                setTotalPages(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-center gap-4 p-4 border-t border-border bg-card">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

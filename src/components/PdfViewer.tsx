import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Layers,
  Square,
  Globe,
  FileText,
} from 'lucide-react';

// Configure bundled local PDF.js worker (works offline, in AI Studio iframe, and on Vercel)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfPageCanvasProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  containerWidth: number;
  eager?: boolean;
}

const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({
  pdfDoc,
  pageNumber,
  scale,
  containerWidth,
  eager = false,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(eager);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (eager) {
      setIsVisible(true);
      return;
    }
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
        }
      },
      { rootMargin: '500px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    if (!isVisible) return;
    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;

    const renderPage = async () => {
      setIsRendering(true);
      setRenderError(null);
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const targetWidth = Math.max(260, (containerWidth || 640) - 24);
        const fitScale = targetWidth / baseViewport.width;
        const effectiveScale = fitScale * scale;
        const viewport = page.getViewport({ scale: effectiveScale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderTask = page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        });

        await renderTask.promise;
      } catch (err: any) {
        if (
          !cancelled &&
          err?.name !== 'RenderingCancelledException' &&
          !String(err?.message || '').includes('Rendering cancelled')
        ) {
          setRenderError('Gagal merender halaman ini.');
        }
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore cancellation cleanup errors
        }
      }
    };
  }, [pdfDoc, pageNumber, scale, containerWidth, isVisible]);

  return (
    <div
      ref={wrapperRef}
      className="relative mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col items-center justify-center min-h-[200px]"
    >
      <div className="w-full px-3 py-1 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-500">
        <span>Slide / Halaman {pageNumber}</span>
        {isRendering && (
          <span className="inline-flex items-center gap-1 text-indigo-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Memuat...
          </span>
        )}
      </div>

      {renderError ? (
        <div className="p-6 text-xs text-rose-600 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{renderError}</span>
        </div>
      ) : (
        <div className="p-1.5 sm:p-2 w-full flex justify-center overflow-x-auto bg-slate-50/40">
          <canvas ref={canvasRef} className="block max-w-full rounded-xs bg-white" />
        </div>
      )}
    </div>
  );
};

interface PdfViewerProps {
  blob: Blob | null;
  blobUrl: string | null;
  externalPreviewUrl?: string | null;
  externalDownloadUrl?: string | null;
  title: string;
  fileName: string;
  isLoading?: boolean;
  error?: string | null;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  blob,
  blobUrl,
  externalPreviewUrl,
  externalDownloadUrl,
  title,
  fileName,
  isLoading = false,
  error = null,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(640);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1);
  const [renderMode, setRenderMode] = useState<'canvas' | 'iframe'>('canvas');
  const [layoutMode, setLayoutMode] = useState<'scroll' | 'single'>('scroll');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Track container width cleanly for sharp responsive fit-to-width rendering
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setContainerWidth(el.clientWidth);
      }
    };
    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [isExpanded, renderMode, layoutMode]);

  // Load PDF document via PDF.js from the stored Blob / Blob URL
  useEffect(() => {
    let cancelled = false;
    let loadedDoc: pdfjsLib.PDFDocumentProxy | null = null;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    setPdfDoc(null);
    setNumPages(0);
    setCurrentPage(1);
    setParseError(null);

    if (!blob && !blobUrl) {
      return () => {};
    }

    const loadDocument = async () => {
      setIsParsingPdf(true);
      try {
        let buffer: ArrayBuffer;
        if (blob) {
          buffer = await blob.arrayBuffer();
        } else if (blobUrl) {
          const response = await fetch(blobUrl);
          buffer = await response.arrayBuffer();
        } else {
          return;
        }

        if (cancelled) return;

        loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
        });
        const doc = await loadingTask.promise;
        if (cancelled) {
          await doc.cleanup();
          return;
        }
        loadedDoc = doc;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (err: any) {
        if (!cancelled) {
          console.error('PDF.js load error:', err);
          setParseError(
            err?.message ||
              'Gagal membaca isi dokumen PDF. Gunakan tombol Mode Browser atau Unduh PDF.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsParsingPdf(false);
        }
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
      if (loadedDoc) {
        loadedDoc.cleanup().catch(() => {});
      }
      if (loadingTask) {
        loadingTask.destroy().catch(() => {});
      }
    };
  }, [blob, blobUrl]);

  const isExternalOnly = Boolean(externalPreviewUrl && !blob && !blobUrl);
  const downloadHref = blobUrl || externalDownloadUrl || externalPreviewUrl || '';
  const combinedError = error || parseError;

  const viewerBody = (
    <div
      className={`flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-slate-100 ${
        isExpanded
          ? 'fixed inset-2 sm:inset-4 z-[60] shadow-2xl bg-slate-900/95 border-slate-700'
          : 'w-full'
      }`}
    >
      {/* Interactive PDF Viewer Toolbar */}
      <div className="bg-slate-900 text-white px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold truncate max-w-[160px] sm:max-w-[240px]" title={title}>
            {title}
          </span>
          {numPages > 0 && !isExternalOnly && renderMode === 'canvas' && (
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-amber-300 text-[10px] font-black shrink-0">
              {layoutMode === 'single' ? `${currentPage} / ${numPages}` : `${numPages} Halaman`}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Canvas Viewer Controls */}
          {!isExternalOnly && renderMode === 'canvas' && numPages > 0 && (
            <>
              {/* Scroll vs Single Slide Toggle */}
              {numPages > 1 && (
                <div className="inline-flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('scroll')}
                    className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      layoutMode === 'scroll'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    title="Gulir seluruh slide ke bawah"
                  >
                    <Layers className="w-3 h-3" />
                    <span className="hidden sm:inline">Scroll</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode('single')}
                    className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      layoutMode === 'single'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    title="Tampilkan satu slide per layar"
                  >
                    <Square className="w-3 h-3" />
                    <span className="hidden sm:inline">1 Slide</span>
                  </button>
                </div>
              )}

              {/* Page Prev / Next in Single-Slide Mode */}
              {layoutMode === 'single' && numPages > 1 && (
                <div className="inline-flex items-center bg-slate-800 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 text-slate-200 hover:text-white disabled:opacity-40 cursor-pointer"
                    title="Halaman sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 text-[11px] font-mono font-bold">
                    {currentPage}/{numPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= numPages}
                    onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                    className="p-1.5 text-slate-200 hover:text-white disabled:opacity-40 cursor-pointer"
                    title="Halaman berikutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Zoom Controls */}
              <div className="inline-flex items-center bg-slate-800 rounded-lg border border-slate-700">
                <button
                  type="button"
                  disabled={zoom <= 0.6}
                  onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.2).toFixed(2))))}
                  className="p-1.5 text-slate-200 hover:text-white disabled:opacity-40 cursor-pointer"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="px-1.5 text-[10px] font-mono font-bold text-slate-200 hover:text-white cursor-pointer"
                  title="Reset zoom 100%"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  disabled={zoom >= 2.2}
                  onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.2).toFixed(2))))}
                  className="p-1.5 text-slate-200 hover:text-white disabled:opacity-40 cursor-pointer"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          {/* Switch between Embedded Slide Viewer and Native Blob URL Browser Iframe */}
          {blobUrl && (
            <button
              type="button"
              onClick={() =>
                setRenderMode((prev) => (prev === 'canvas' ? 'iframe' : 'canvas'))
              }
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
              title={
                renderMode === 'canvas'
                  ? 'Beralih ke tampilan iframe PDF native browser'
                  : 'Kembali ke tampilan Slide Viewer terintegrasi'
              }
            >
              <Globe className="w-3 h-3 text-sky-400" />
              <span>{renderMode === 'canvas' ? 'Iframe Native' : 'Slide Viewer'}</span>
            </button>
          )}

          {/* Expand Full Viewer */}
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white cursor-pointer"
            title={isExpanded ? 'Kecilkan tampilan' : 'Perbesar layar viewer'}
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Download / Open link */}
          {downloadHref && (
            isExternalOnly ? (
              <a
                href={downloadHref}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Buka / Unduh</span>
              </a>
            ) : (
              <a
                href={downloadHref}
                download={fileName}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Unduh</span>
              </a>
            )
          )}
        </div>
      </div>

      {/* Viewer Viewport */}
      <div
        ref={scrollContainerRef}
        className={`relative overflow-y-auto bg-slate-200/80 ${
          isExpanded ? 'flex-1 p-3 sm:p-5' : 'h-[52vh] min-h-[340px] p-2 sm:p-3'
        }`}
      >
        {isLoading || isParsingPdf ? (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center gap-2.5 text-slate-600">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-bold">
              {isLoading ? 'Mengunduh file PDF materi...' : 'Menyiapkan tampilan slide PDF...'}
            </span>
          </div>
        ) : combinedError ? (
          <div className="m-2 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{combinedError}</span>
            </div>
            {blobUrl && (
              <button
                type="button"
                onClick={() => setRenderMode('iframe')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
              >
                Coba Buka dengan Browser Iframe
              </button>
            )}
          </div>
        ) : isExternalOnly && externalPreviewUrl ? (
          <iframe
            src={externalPreviewUrl}
            title={title}
            className="w-full h-full min-h-[320px] rounded-lg bg-white border border-slate-200"
          />
        ) : renderMode === 'iframe' && blobUrl ? (
          <div className="w-full h-full flex flex-col gap-2">
            <iframe
              src={blobUrl}
              title={title}
              className="w-full flex-1 min-h-[320px] rounded-lg bg-white border border-slate-200"
            />
          </div>
        ) : pdfDoc && numPages > 0 ? (
          layoutMode === 'single' ? (
            <div className="space-y-3">
              <PdfPageCanvas
                key={`single-${currentPage}-${zoom}`}
                pdfDoc={pdfDoc}
                pageNumber={currentPage}
                scale={zoom}
                containerWidth={containerWidth}
                eager
              />
              {numPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-1 pb-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1 disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>
                  <span className="text-xs font-bold text-slate-700">
                    Slide {currentPage} dari {numPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= numPages}
                    onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1 disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNum) => (
                <PdfPageCanvas
                  key={`scroll-${pageNum}-${zoom}`}
                  pdfDoc={pdfDoc}
                  pageNumber={pageNum}
                  scale={zoom}
                  containerWidth={containerWidth}
                  eager={pageNum <= 2}
                />
              ))}
            </div>
          )
        ) : (
          <div className="h-full min-h-[240px] flex items-center justify-center text-xs text-slate-500">
            Pilih materi PDF untuk menampilkan pratinjau slide.
          </div>
        )}
      </div>
    </div>
  );

  return viewerBody;
};

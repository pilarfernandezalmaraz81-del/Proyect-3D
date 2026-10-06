import React, { useState, useEffect } from 'react';
import { PRESENTATION_SLIDES, Language, TRACEABILITY_STAGES } from '../data/project3dData';
import { X, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';

interface SlideDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onNavigateSection: (section: 'hero' | 'services' | 'quoter' | 'portal' | 'contact' | 'chat') => void;
}

export const SlideDeckModal: React.FC<SlideDeckModalProps> = ({
  isOpen,
  onClose,
  lang,
  onNavigateSection,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex((i) => Math.min(PRESENTATION_SLIDES.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const slide = PRESENTATION_SLIDES[currentIndex];
  const isDark = slide.theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl flex flex-col">
        {/* Top Deck Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950 text-slate-300 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span className="text-orange-400 font-semibold">Project 3D</span>
            <span aria-hidden="true">·</span>
            <span>
              {lang === 'es'
                ? `Diapositiva ${currentIndex + 1} de ${PRESENTATION_SLIDES.length}`
                : `Slide ${currentIndex + 1} of ${PRESENTATION_SLIDES.length}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {PRESENTATION_SLIDES.map((s, idx) => (
              <button
                key={s.number}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-6 h-6 rounded text-xs font-mono tabular-nums transition-colors ${
                  idx === currentIndex
                    ? 'bg-orange-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s.number}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label={lang === 'es' ? 'Cerrar presentación' : 'Close presentation'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Canvas (Matches the 8 slides from the user's Gemini Share Link) */}
        <div
          className={`min-h-[440px] sm:min-h-[480px] p-8 sm:p-14 flex flex-col justify-between transition-colors ${
            isDark ? 'bg-[#090d16] text-white' : 'bg-slate-900 text-white'
          }`}
        >
          <div>
            <p className="font-mono text-xs font-semibold text-orange-400 mb-3">
              0{slide.number}. {lang === 'es' ? slide.tagEs : slide.tagEn}
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight balance-text mb-4 text-white">
              {lang === 'es' ? slide.titleEs : slide.titleEn}
            </h2>
            <p className="text-base sm:text-lg max-w-3xl leading-relaxed text-slate-300">
              {lang === 'es' ? slide.subtitleEs : slide.subtitleEn}
            </p>
          </div>

          {/* Contextual Visual Preview per Slide */}
          <div className="my-6">
            {slide.number === 5 && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-100 max-w-2xl">
                <div className="flex justify-between py-2 border-b border-slate-800 text-sm">
                  <span className="text-slate-400">Coste de Material (PETG Profesional)</span>
                  <span className="font-mono font-semibold tabular-nums">18,50 €</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 text-sm">
                  <span className="text-slate-400">Coste Estimado de Fabricación (Horas Máquina)</span>
                  <span className="font-mono font-semibold tabular-nums">24,00 €</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 text-sm">
                  <span className="text-slate-400">IVA (21%)</span>
                  <span className="font-mono font-semibold tabular-nums">8,93 €</span>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <div>
                    <div className="font-mono font-bold text-lg text-white tabular-nums">
                      TOTAL ESTIMADO CON IVA: <span className="text-orange-400">51,43 €</span>
                    </div>
                    <div className="text-xs text-amber-400 font-medium">
                      * Presupuesto orientativo sujeto a revisión técnica definitiva del archivo.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {slide.number === 6 && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-100 max-w-3xl">
                <div className="flex justify-between items-center mb-4 text-xs font-mono">
                  <span className="text-orange-400 font-semibold">PEDIDO #P3D-2026-089</span>
                  <span className="text-slate-400">Estado: 03. En Fabricación (Planta Torrijos)</span>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {TRACEABILITY_STAGES.map((st, idx) => (
                    <div
                      key={st.step}
                      className={`p-2 rounded border text-xs ${
                        idx < 2
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : idx === 2
                          ? 'border-orange-500 bg-orange-500/15 text-orange-300 font-semibold'
                          : 'border-slate-800 bg-slate-900 text-slate-500'
                      }`}
                    >
                      <div className="font-mono text-[11px]">{st.step}</div>
                      <div className="truncate">{lang === 'es' ? st.es : st.en}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateSection(slide.targetSection);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-colors"
            >
              <span>
                {lang === 'es'
                  ? 'Abrir este módulo interactivo en la aplicación'
                  : 'Open this interactive module in the live app'}
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="flex items-center gap-1 px-3.5 py-2 rounded-lg border border-slate-600/40 text-sm font-medium disabled:opacity-40 hover:bg-slate-500/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{lang === 'es' ? 'Anterior' : 'Previous'}</span>
              </button>
              <button
                type="button"
                disabled={currentIndex === PRESENTATION_SLIDES.length - 1}
                onClick={() => setCurrentIndex((i) => Math.min(PRESENTATION_SLIDES.length - 1, i + 1))}
                className="flex items-center gap-1 px-3.5 py-2 rounded-lg border border-slate-600/40 text-sm font-medium disabled:opacity-40 hover:bg-slate-500/10 transition-colors"
              >
                <span>{lang === 'es' ? 'Siguiente' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

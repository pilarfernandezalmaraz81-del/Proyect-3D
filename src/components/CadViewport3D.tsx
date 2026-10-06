import React, { useEffect, useRef, useState } from 'react';
import { ParsedCadModel, Vec3 } from '../utils/stlParser';
import { Language } from '../data/project3dData';
import { RotateCcw, ZoomIn, ZoomOut, Layers, Box, Grid } from 'lucide-react';

interface CadViewport3DProps {
  model: ParsedCadModel;
  colorHex: string;
  infillPercent: number;
  lang: Language;
}

type RenderMode = 'solid' | 'wireframe' | 'slicer';

export const CadViewport3D: React.FC<CadViewport3DProps> = ({
  model,
  colorHex,
  infillPercent,
  lang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotX, setRotX] = useState<number>(-0.92);
  const [rotZ, setRotZ] = useState<number>(0.68);
  const [zoom, setZoom] = useState<number>(1.15);
  const [renderMode, setRenderMode] = useState<RenderMode>('solid');
  const [sliceRatio, setSliceRatio] = useState<number>(1.0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; baseRotX: number; baseRotZ: number }>({
    active: false,
    startX: 0,
    startY: 0,
    baseRotX: -0.92,
    baseRotZ: 0.68,
  });

  useEffect(() => {
    if (!autoRotate) return;
    let animId = 0;
    const step = () => {
      if (!dragRef.current.active) {
        setRotZ((prev) => prev + 0.0045);
      }
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(280, rect.height);

    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Studio dark engineering viewport backdrop
    const bgGrad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.45,
      20,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.75
    );
    bgGrad.addColorStop(0, '#131c2e');
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const maxDim = Math.max(
      model.dimensionsMm.x,
      model.dimensionsMm.y,
      model.dimensionsMm.z,
      60
    );
    const baseScale = (Math.min(width, height) * 0.52 * zoom) / maxDim;

    const cosZ = Math.cos(rotZ);
    const sinZ = Math.sin(rotZ);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    const project = (v: Vec3): { sx: number; sy: number; depth: number; rx: number; ry: number; rz: number } => {
      // Rotate around Z
      const x1 = v.x * cosZ - v.y * sinZ;
      const y1 = v.x * sinZ + v.y * cosZ;
      const z1 = v.z;

      // Rotate around X
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;

      const perspective = 680 / (680 - y2 * 0.8);
      return {
        sx: width * 0.5 + x1 * baseScale * perspective,
        sy: height * 0.54 - z2 * baseScale * perspective,
        depth: y2,
        rx: x1,
        ry: y2,
        rz: z2,
      };
    };

    // Draw build-plate millimeter grid at bottom of model (-z/2)
    const bedZ = -model.dimensionsMm.z * 0.5;
    const gridRadius = Math.ceil(maxDim * 0.75 / 20) * 20;
    const gridStep = 20;

    ctx.lineWidth = 1;
    for (let g = -gridRadius; g <= gridRadius; g += gridStep) {
      const pA = project({ x: g, y: -gridRadius, z: bedZ });
      const pB = project({ x: g, y: gridRadius, z: bedZ });
      ctx.strokeStyle = g === 0 ? 'rgba(249, 115, 22, 0.45)' : 'rgba(148, 163, 184, 0.12)';
      ctx.beginPath();
      ctx.moveTo(pA.sx, pA.sy);
      ctx.lineTo(pB.sx, pB.sy);
      ctx.stroke();

      const pC = project({ x: -gridRadius, y: g, z: bedZ });
      const pD = project({ x: gridRadius, y: g, z: bedZ });
      ctx.strokeStyle = g === 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(148, 163, 184, 0.12)';
      ctx.beginPath();
      ctx.moveTo(pC.sx, pC.sy);
      ctx.lineTo(pD.sx, pD.sy);
      ctx.stroke();
    }

    // Parse chosen RAL color hex into RGB
    const cleanHex = colorHex.replace('#', '');
    const baseR = parseInt(cleanHex.slice(0, 2), 16) || 56;
    const baseG = parseInt(cleanHex.slice(2, 4), 16) || 66;
    const baseB = parseInt(cleanHex.slice(4, 6), 16) || 75;

    // Slicer Z cutoff
    const minModelZ = -model.dimensionsMm.z * 0.5;
    const maxModelZ = model.dimensionsMm.z * 0.5;
    const sliceCutoffZ =
      renderMode === 'slicer'
        ? minModelZ + (maxModelZ - minModelZ) * sliceRatio
        : maxModelZ + 10;

    // Project and depth-sort triangles (Painter's algorithm)
    const projectedTris = [];
    for (const tri of model.triangles) {
      const avgZ = (tri.v1.z + tri.v2.z + tri.v3.z) / 3;
      if (avgZ > sliceCutoffZ) continue;

      const p1 = project(tri.v1);
      const p2 = project(tri.v2);
      const p3 = project(tri.v3);

      // Rotate normal for three-point studio lighting
      const nx1 = tri.normal.x * cosZ - tri.normal.y * sinZ;
      const ny1 = tri.normal.x * sinZ + tri.normal.y * cosZ;
      const nz1 = tri.normal.z;
      const ny2 = ny1 * cosX - nz1 * sinX;
      const nz2 = ny1 * sinX + nz1 * cosX;

      // Key light + Fill light + Rim light
      const keyDot = Math.max(0, nx1 * 0.45 - ny2 * 0.55 + nz2 * 0.7);
      const rimDot = Math.max(0, -nx1 * 0.5 + ny2 * 0.6 + nz2 * 0.3);
      const shade = Math.min(1.35, 0.34 + keyDot * 0.72 + rimDot * 0.25);

      const isNearSliceTop =
        renderMode === 'slicer' && Math.abs(avgZ - sliceCutoffZ) < model.dimensionsMm.z * 0.06;

      projectedTris.push({
        p1,
        p2,
        p3,
        depth: (p1.depth + p2.depth + p3.depth) / 3,
        shade,
        isNearSliceTop,
      });
    }

    projectedTris.sort((a, b) => b.depth - a.depth);

    for (const item of projectedTris) {
      ctx.beginPath();
      ctx.moveTo(item.p1.sx, item.p1.sy);
      ctx.lineTo(item.p2.sx, item.p2.sy);
      ctx.lineTo(item.p3.sx, item.p3.sy);
      ctx.closePath();

      if (renderMode === 'wireframe') {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.06)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.6)';
        ctx.lineWidth = 0.85;
        ctx.stroke();
      } else {
        const r = Math.min(255, Math.round(baseR * item.shade));
        const g = Math.min(255, Math.round(baseG * item.shade));
        const b = Math.min(255, Math.round(baseB * item.shade));

        if (item.isNearSliceTop) {
          // Highlight active extrusion layer in slicer mode
          ctx.fillStyle = 'rgba(249, 115, 22, 0.9)';
          ctx.strokeStyle = '#fb923c';
          ctx.lineWidth = 1.1;
        } else {
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.strokeStyle = `rgba(${Math.min(255, r + 24)}, ${Math.min(255, g + 24)}, ${Math.min(255, b + 28)}, 0.28)`;
          ctx.lineWidth = 0.6;
        }
        ctx.fill();
        ctx.stroke();
      }
    }

    // If slicer mode, draw internal infill lattice on slice plane
    if (renderMode === 'slicer' && sliceRatio < 0.98) {
      const infillStep = Math.max(6, Math.round(28 - infillPercent * 0.2));
      const halfX = model.dimensionsMm.x * 0.35;
      const halfY = model.dimensionsMm.y * 0.35;
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.55)';
      ctx.lineWidth = 1;
      for (let ix = -halfX; ix <= halfX; ix += infillStep) {
        const sA = project({ x: ix, y: -halfY, z: sliceCutoffZ });
        const sB = project({ x: ix, y: halfY, z: sliceCutoffZ });
        ctx.beginPath();
        ctx.moveTo(sA.sx, sA.sy);
        ctx.lineTo(sB.sx, sB.sy);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [model, rotX, rotZ, zoom, renderMode, sliceRatio, colorHex, infillPercent]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setAutoRotate(false);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      baseRotX: rotX,
      baseRotZ: rotZ,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setRotZ(dragRef.current.baseRotZ + dx * 0.01);
    setRotX(Math.max(-1.45, Math.min(-0.15, dragRef.current.baseRotX + dy * 0.008)));
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[430px] rounded-2xl overflow-hidden border border-slate-800 bg-[#090d16] select-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Semantic Top-Left HUD Overlay */}
      <div className="absolute top-3.5 left-3.5 z-10 pointer-events-none bg-black/55 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200">
        <div className="font-mono font-medium text-orange-400 truncate max-w-[230px]">
          {model.fileName}
        </div>
        <div className="mt-0.5 text-slate-400 font-mono tabular-nums">
          {model.dimensionsMm.x} × {model.dimensionsMm.y} × {model.dimensionsMm.z} mm · {model.volumeCm3.toFixed(1)} cm³
        </div>
      </div>

      {/* Top-Right View Mode Switcher */}
      <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setRenderMode('solid')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
            renderMode === 'solid'
              ? 'bg-orange-600 text-white font-semibold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>{lang === 'es' ? 'Sólido CAD' : 'Solid CAD'}</span>
        </button>
        <button
          type="button"
          onClick={() => setRenderMode('wireframe')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
            renderMode === 'wireframe'
              ? 'bg-orange-600 text-white font-semibold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>{lang === 'es' ? 'Malla' : 'Mesh'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRenderMode('slicer');
            if (sliceRatio > 0.9) setSliceRatio(0.65);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
            renderMode === 'slicer'
              ? 'bg-orange-600 text-white font-semibold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{lang === 'es' ? 'Capas Z' : 'Z-Layers'}</span>
        </button>
      </div>

      {/* Slicer Layer Height Bar (when Slicer mode is active) */}
      {renderMode === 'slicer' && (
        <div className="absolute bottom-14 left-3.5 right-3.5 z-10 flex items-center gap-3 bg-black/65 backdrop-blur-sm border border-white/10 rounded-lg px-3.5 py-2 text-xs text-slate-200">
          <span className="font-mono text-orange-400 whitespace-nowrap">
            {lang === 'es' ? 'Corte Capa Z:' : 'Z-Layer Cut:'} {Math.round(sliceRatio * 100)}%
          </span>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.02}
            value={sliceRatio}
            onChange={(e) => setSliceRatio(parseFloat(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer"
            aria-label={lang === 'es' ? 'Altura de corte de capa Z' : 'Z layer slice height'}
          />
        </div>
      )}

      {/* Bottom Camera Controls Bar */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10 flex items-center justify-between pointer-events-none">
        <div className="text-[11px] text-slate-400 bg-black/45 backdrop-blur-sm border border-white/10 rounded px-2.5 py-1">
          {lang === 'es'
            ? 'Arrastra para rotar 360° · Bancada 250 × 250 mm'
            : 'Drag to orbit 360° · 250 × 250 mm Build Plate'}
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.0, +(z + 0.15).toFixed(2)))}
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors"
            title={lang === 'es' ? 'Acercar vista' : 'Zoom in'}
            aria-label={lang === 'es' ? 'Acercar vista' : 'Zoom in'}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors"
            title={lang === 'es' ? 'Alejar vista' : 'Zoom out'}
            aria-label={lang === 'es' ? 'Alejar vista' : 'Zoom out'}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setRotX(-0.92);
              setRotZ(0.68);
              setZoom(1.15);
              setSliceRatio(1.0);
              setAutoRotate(true);
            }}
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors"
            title={lang === 'es' ? 'Restablecer cámara' : 'Reset camera'}
            aria-label={lang === 'es' ? 'Restablecer cámara' : 'Reset camera'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

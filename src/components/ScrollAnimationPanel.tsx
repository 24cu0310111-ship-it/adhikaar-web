import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { launchTelegramBot, TELEGRAM_WEB_A, TELEGRAM_WEB_K } from '../utils/telegram';
import { sounds } from '../utils/audio';

const TOTAL_FRAMES = 240;

interface PhaseDetail {
  index: number;
  label: string;
  headline: string;
  description: string;
  metric: string;
}

const PHASES: PhaseDetail[] = [
  {
    index: 0,
    label: "PHASE 01: VERNACULAR ACOUSTIC INTAKE",
    headline: "Speak Naturally in Any Regional Tongue",
    description: "Accepts raw citizen voice recordings across Tamil, Telugu, Hindi, or English. Normalizes input to 16 kHz mono WAV via Sarvam ASR with 2-second album debouncing.",
    metric: "ASR Latency: <180ms | 4 Regional Dialects | Ephemeral Vault",
  },
  {
    index: 1,
    label: "PHASE 02: DUAL-HEAD VISION MATRIX",
    headline: "Simultaneous Category & Quality Classification",
    description: "Dual-head ResNet-18 separates Aadhaar cards, Bank Passbooks, and Land RoR while assessing image sharpness to intercept blurry photos before portal submission.",
    metric: "Classification Accuracy: 96.8% | Dual-Head ResNet-18",
  },
  {
    index: 2,
    label: "PHASE 03: STRUCTURED FACT EXTRACTION",
    headline: "Fine-Tuned Llama 3.1 8B with Substring Grounding",
    description: "Runs locally via LM Studio at zero API cost. Emits strict JSON schemas where numerical tokens are algorithmically checked against raw OCR substrings.",
    metric: "Inference: 48 tokens/sec | Zero Cloud API Dependencies",
  },
  {
    index: 3,
    label: "PHASE 04: DETERMINISTIC ACTION & RESOLUTION",
    headline: "Direct DBT Submission with 422 Auto-Recovery",
    description: "Evaluates statutory criteria using simpleeval against 8,210 schemes. Submits directly with idempotency keys and handles missing-field recovery automatically.",
    metric: "Decision Agreement: 100% | Verified Reference Delivery",
  },
];

interface ScrollAnimationPanelProps {
  onBackToOverview: () => void;
}

export const ScrollAnimationPanel: React.FC<ScrollAnimationPanelProps> = ({ onBackToOverview }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  
  // Physics lerp refs (zero video-player state churn)
  const targetFrameRef = useRef<number>(1);
  const currentFrameRef = useRef<number>(1);
  const animFrameRef = useRef<number | null>(null);

  // Discrete state
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);

  // 1. Preload 240 frames
  useEffect(() => {
    let cancelled = false;
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const numStr = String(i).padStart(3, '0');
      img.onload = () => {
        if (cancelled) return;
        loaded++;
        const pct = Math.round((loaded / TOTAL_FRAMES) * 100);
        setLoadProgress(pct);
        if (loaded === TOTAL_FRAMES) {
          setIsLoaded(true);
        }
      };
      img.onerror = () => {
        if (cancelled) return;
        loaded++;
      };
      img.src = `/frames/ezgif-frame-${numStr}.png`;
      imgs.push(img);
    }
    imagesRef.current = imgs;

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. High performance Canvas Draw (Black and white canvas clear)
  const drawFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const safeIdx = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(frameIdx)));
    const img = imagesRef.current[safeIdx - 1];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const width = canvas.width;
    const height = canvas.height;

    // Pure black canvas background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const hRatio = width / img.naturalWidth;
    const vRatio = height / img.naturalHeight;
    const scale = Math.min(hRatio, vRatio);

    const renderW = img.naturalWidth * scale;
    const renderH = img.naturalHeight * scale;
    const x = (width - renderW) / 2;
    const y = (height - renderH) / 2;

    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, renderW, renderH);
  }, []);

  // 3. Canvas resolution sync on resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      drawFrame(currentFrameRef.current);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize, { passive: true });
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [drawFrame]);

  // Immediately draw frame 1 once frames finish preloading
  useEffect(() => {
    if (isLoaded) {
      drawFrame(1);
    }
  }, [isLoaded, drawFrame]);

  // 4. Smooth Lerp Animation Loop (Completely decoupled from React state)
  useEffect(() => {
    let lastDrawn = -1;
    let currentPhase = 0;
    let completionTriggered = false;

    const loop = () => {
      const delta = targetFrameRef.current - currentFrameRef.current;
      currentFrameRef.current += delta * 0.12;

      const rounded = Math.round(currentFrameRef.current);

      if (rounded !== lastDrawn && rounded >= 1 && rounded <= TOTAL_FRAMES) {
        lastDrawn = rounded;
        drawFrame(rounded);

        // Check completion state (end of scroll)
        if (rounded >= 236 && !completionTriggered) {
          completionTriggered = true;
          setIsCompleted(true);
          sounds.playSuccess();
        } else if (rounded < 220 && completionTriggered) {
          completionTriggered = false;
          setIsCompleted(false);
        }

        const nextPhase = rounded <= 55 ? 0 : rounded <= 115 ? 1 : rounded <= 180 ? 2 : 3;
        if (nextPhase !== currentPhase) {
          currentPhase = nextPhase;
          setActivePhaseIndex(nextPhase);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawFrame]);

  // 5. Natural mouse scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const maxScroll = container.offsetHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const scrollY = Math.max(0, -container.getBoundingClientRect().top);
      if (scrollY > 50) {
        setHasScrolled(true);
      }
      const fraction = Math.min(1, Math.max(0, scrollY / maxScroll));
      
      targetFrameRef.current = Math.min(TOTAL_FRAMES, Math.max(1, fraction * (TOTAL_FRAMES - 1) + 1));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activePhase = PHASES[activePhaseIndex];

  return (
    <div className="relative bg-[#000000] text-[#ffffff] min-h-screen">
      


      {/* Preloader */}
      {!isLoaded && loadProgress < 100 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#000000]">
          <div className="w-48 mb-4">
            <div className="flex items-center justify-between font-mono text-xs text-[#888888] mb-1">
              <span>LOADING MOTION</span>
              <span className="text-white font-bold">{loadProgress}%</span>
            </div>
            <div className="w-full h-1 bg-[#222222] rounded-sm overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-150"
                style={{ width: `${loadProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll Track (480vh) */}
      <div ref={containerRef} className="relative w-full h-[480vh]">
        
        {/* Sticky Viewport */}
        <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center bg-[#000000]">
          
          {/* Main Fullscreen Canvas (No video UI, pure natural scrub) */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block select-none pointer-events-none"
          />

          {/* Left Narrative Card (Frosted Glassmorphism) */}
          <div className="absolute left-6 md:left-14 bottom-14 md:bottom-20 z-30 max-w-xl pointer-events-auto">
            {/* Ambient Refraction Halo behind Narrative Glass Card */}
            <div 
              className="absolute -inset-4 rounded-3xl pointer-events-none opacity-50 -z-10"
              style={{
                background: 'radial-gradient(circle at 40% 60%, rgba(255, 255, 255, 0.12) 0%, rgba(245, 158, 11, 0.05) 50%, transparent 75%)',
                filter: 'blur(35px)',
              }}
            />

            <div className="glass-narrative-panel p-6 md:p-8 rounded-2xl relative text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white font-bold tracking-widest uppercase backdrop-blur-md shadow-sm">
                  {activePhase.label}
                </span>
              </div>

              {/* Vintage Editorial Font for Headlines */}
              <h2 className="font-vintage text-3xl md:text-4xl font-normal text-white tracking-tight leading-tight mb-3 drop-shadow-sm">
                {activePhase.headline}
              </h2>

              <p className="font-sans text-sm md:text-base text-zinc-200 leading-relaxed mb-4">
                {activePhase.description}
              </p>

              <div className="pt-3 border-t border-white/15 text-xs font-mono text-zinc-300">
                {activePhase.metric}
              </div>
            </div>
          </div>

          {/* Initial Clean Scroll Prompt (Disappears upon scroll) */}
          {!hasScrolled && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center transition-opacity duration-500">
              <div className="flex flex-col items-center gap-2 px-6 py-2.5 rounded-full bg-black/65 border border-white/25 backdrop-blur-md shadow-2xl">
                <span className="font-sans font-light text-xs tracking-[0.28em] uppercase text-white drop-shadow-sm">
                  Scroll down to animate
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-white animate-bounce" strokeWidth={1.25} />
              </div>
            </div>
          )}

          {/* FROSTED GLASSMORPHISM TELEGRAM PANEL (Smooth rising transition) */}
          <div 
            className={`absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/55 transition-all duration-700 ease-out ${
              isCompleted 
                ? 'opacity-100 backdrop-blur-md pointer-events-auto' 
                : 'opacity-0 backdrop-blur-none pointer-events-none'
            }`}
          >
            {/* Luminous Ambient Backlight Glow (diffuses through the frosted glass panel) */}
            <div 
              className={`absolute w-[620px] h-[420px] rounded-full pointer-events-none transition-opacity duration-700 ${
                isCompleted ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(245, 158, 11, 0.08) 45%, rgba(234, 88, 12, 0.05) 75%, transparent 85%)',
                filter: 'blur(75px)',
              }}
            />

            <div 
              className={`glass-telegram-panel p-8 md:p-12 rounded-3xl max-w-2xl w-full relative text-white transition-all duration-700 ${
                isCompleted 
                  ? 'translate-y-0 opacity-100 scale-100' 
                  : 'translate-y-4 opacity-0 scale-[0.98]'
              }`}
              style={{
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-mono text-white mb-3 backdrop-blur-md shadow-inner">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>MOTION PIPELINE COMPLETE</span>
                  </div>
                  <h3 className="font-vintage text-3xl md:text-4xl text-white font-normal drop-shadow-sm">
                    Launch ADHIKAAR on Telegram
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    targetFrameRef.current = 1;
                    currentFrameRef.current = 1;
                    setIsCompleted(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-mono text-white bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-md transition-all cursor-pointer"
                >
                  REPLAY
                </button>
              </div>

              <p className="text-sm md:text-base text-zinc-200 leading-relaxed mb-6 font-sans">
                The autonomous multi-modal agent is live. You can test rural entitlement matching directly through Telegram without downloading specialized portal apps.
              </p>

              {/* 3 Simple Steps (Frosted Glass Container) */}
              <div className="space-y-3.5 mb-6 glass-step-container p-5 md:p-6 rounded-2xl relative">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-white text-black font-bold shrink-0 mt-0.5 shadow-sm">
                    STEP 1
                  </span>
                  <span className="text-xs text-white">
                    Install or open Telegram on your mobile phone or desktop browser.
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-white text-black font-bold shrink-0 mt-0.5 shadow-sm">
                    STEP 2
                  </span>
                  <div className="text-xs text-white flex flex-col gap-1">
                    <span>
                      Connect to bot: <strong className="text-white underline decoration-white/40">@Adhikaar013bot</strong>.
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      (Single click below opens Web Client A with automatic Web Client K fallback)
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-white text-black font-bold shrink-0 mt-0.5 shadow-sm">
                    STEP 3
                  </span>
                  <span className="text-xs text-white">
                    Send a voice message in Tamil, Telugu, Hindi, or English and attach photos of your Aadhaar card or Bank Passbook.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={launchTelegramBot}
                  className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-xl bg-white hover:bg-zinc-100 text-black font-sans font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Send className="w-4 h-4 fill-black" />
                  <span>Launch @Adhikaar013bot</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </button>

                <button
                  type="button"
                  onClick={onBackToOverview}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-sans font-medium text-sm text-center transition-all cursor-pointer backdrop-blur-md"
                >
                  <span>Back to Overview</span>
                </button>
              </div>

              {/* Dual Web Client Transparency Subtext */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#888888]">
                <span>1-CLICK AUTO-ROUTED: WEB CLIENT A &bull; WEB CLIENT K FALLBACK</span>
                <div className="flex items-center gap-3 mt-1 sm:mt-0">
                  <a href={TELEGRAM_WEB_A} target="_blank" rel="noreferrer" className="underline hover:text-white">
                    Direct Web A
                  </a>
                  <span>&bull;</span>
                  <a href={TELEGRAM_WEB_K} target="_blank" rel="noreferrer" className="underline hover:text-white">
                    Direct Web K
                  </a>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

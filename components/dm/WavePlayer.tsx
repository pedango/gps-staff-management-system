"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function WavePlayer({ src, accentClass }: { src: string; accentClass?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waveRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const ws = WaveSurfer.create({
      container: el,
      height: 48,
      waveColor: "#5a72c8",
      progressColor: "#e6a817",
      cursorColor: "#1a2a6c",
      barWidth: 2,
      normalize: true,
    });
    void ws.load(src);
    ws.on("finish", () => setPlaying(false));
    waveRef.current = ws;
    return () => {
      ws.destroy();
      waveRef.current = null;
    };
  }, [src]);

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        className={cn("h-9 w-9 bg-white p-0 text-navy-900 ring-1 ring-surface-border hover:bg-navy-50", accentClass)}
        onClick={() => {
          const ws = waveRef.current;
          if (!ws) return;
          if (ws.isPlaying()) {
            ws.pause();
            setPlaying(false);
          } else {
            void ws.play();
            setPlaying(true);
          }
        }}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <div ref={containerRef} className="h-12 flex-1 min-w-[120px]" />
    </div>
  );
}

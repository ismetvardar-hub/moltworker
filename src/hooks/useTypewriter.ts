import { useEffect, useRef, useState } from 'react';

/**
 * Verilen satırları daktilo efektiyle akıtan hook.
 * Tüm satırlar bittiğinde başa sarar ve sonsuz döngüde oynatır.
 */
export function useTypewriter(lines: string[], charDelayMs = 18, lineDelayMs = 650) {
  const [rendered, setRendered] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const lineIdx = useRef(0);
  const charIdx = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled) return;
      const line = lines[lineIdx.current] ?? '';

      if (charIdx.current < line.length) {
        charIdx.current += 1;
        setCurrent(line.slice(0, charIdx.current));
        timer = setTimeout(tick, charDelayMs);
        return;
      }

      // Satır tamamlandı; listeye ekle ve sıradakine geç.
      setRendered((prev) => {
        const next = [...prev, line];
        return next.length > 14 ? next.slice(next.length - 14) : next;
      });
      setCurrent('');
      charIdx.current = 0;
      lineIdx.current = (lineIdx.current + 1) % lines.length;
      if (lineIdx.current === 0) {
        setRendered([]);
      }
      timer = setTimeout(tick, lineDelayMs);
    };

    timer = setTimeout(tick, lineDelayMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [lines, charDelayMs, lineDelayMs]);

  return { rendered, current };
}

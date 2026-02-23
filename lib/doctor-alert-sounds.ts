/**
 * Sons de alerta para o médico (Web Audio API — sem arquivos externos).
 */

function playBeep(frequency: number, durationMs: number): void {
  if (typeof window === 'undefined') return;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + durationMs / 1000);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + durationMs / 1000);
  } catch {
    // Silenciar se o navegador bloquear áudio
  }
}

function beepSequence(frequencies: number[], durationMs: number, gapMs: number): void {
  frequencies.forEach((freq, i) => {
    setTimeout(() => playBeep(freq, durationMs), i * (durationMs + gapMs));
  });
}

/** Som quando uma nova consulta é agendada (dois bipes). */
export function playNewConsultationSound(): void {
  beepSequence([880, 880], 120, 80);
}

/** Som quando uma consulta está próxima do início (três bipes em tom de alerta). */
export function playConsultationStartingSound(): void {
  beepSequence([660, 880, 660], 150, 100);
}

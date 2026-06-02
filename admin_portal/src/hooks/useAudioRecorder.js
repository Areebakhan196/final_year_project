import { useState, useRef, useCallback, useEffect } from 'react';

function pickMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return '';
}

function extForBlobType(mime) {
  if (!mime) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4') || mime.includes('aac') || mime.includes('mpeg')) return 'm4a';
  return 'webm';
}

/**
 * Records microphone audio in the browser. Prefers Opus in WebM for good quality/size.
 */
export function useAudioRecorder() {
  const [phase, setPhase] = useState('idle'); // idle | recording | stopped
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState(null);
  const [blob, setBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const mimeRef = useRef('');

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setBlob(null);
    chunksRef.current = [];
    clearTimer();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      mimeRef.current = mimeType;
      const opts = {};
      if (mimeType) opts.mimeType = mimeType;
      if (mimeType && mimeType.startsWith('audio/webm')) {
        opts.audioBitsPerSecond = 128000;
      }

      const mr = new MediaRecorder(stream, opts);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const type = mimeRef.current || 'audio/webm';
        const b = new Blob(chunksRef.current, { type });
        setBlob(b);
        setPhase('stopped');
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
      };

      mr.start(500);
      setPhase('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      setError(
        e?.name === 'NotAllowedError'
          ? 'Microphone permission denied.'
          : 'Could not access microphone.'
      );
      setPhase('idle');
    }
  }, [clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'recording') {
      mr.stop();
    } else {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;
    }
  }, [clearTimer]);

  const discard = useCallback(() => {
    clearTimer();
    const stream = streamRef.current;
    const mr = mediaRecorderRef.current;
    if (mr) {
      mr.ondataavailable = null;
      mr.onstop = null;
      if (mr.state !== 'inactive') {
        try {
          mr.stop();
        } catch {
          /* ignore */
        }
      }
    }
    stream?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    mimeRef.current = '';
    setBlob(null);
    setSeconds(0);
    setPhase('idle');
    setError(null);
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const mr = mediaRecorderRef.current;
      if (mr && mr.state === 'recording') {
        try {
          mr.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, [clearTimer]);

  return {
    phase,
    seconds,
    error,
    blob,
    start,
    stop,
    discard,
    extForBlobType,
  };
}

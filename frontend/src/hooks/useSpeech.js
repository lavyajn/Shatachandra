// useSpeech.js — Web Speech API manager for defence action narration
import { useEffect, useRef, useCallback } from 'react';
import useGridStore from '../store/useGridStore';

const speechQueue = [];
let isSpeaking = false;

function processQueue() {
  const muted = useGridStore.getState().voiceMuted;
  if (muted || speechQueue.length === 0 || isSpeaking) return;

  const text = speechQueue.shift();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 0.95;
  utterance.lang = 'en-US';

  // Try to find a good English voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('Samantha'))
  ) || voices.find(v => v.lang.startsWith('en'));
  if (preferred) utterance.voice = preferred;

  utterance.onend = () => {
    isSpeaking = false;
    processQueue();
  };

  utterance.onerror = () => {
    isSpeaking = false;
    processQueue();
  };

  isSpeaking = true;
  window.speechSynthesis.speak(utterance);
}

export function speakDefenceAction(text) {
  if (!window.speechSynthesis) return;
  speechQueue.push(text);
  processQueue();
}

export function toggleMute() {
  const store = useGridStore.getState();
  store.toggleVoiceMute();
  
  if (store.voiceMuted) {
    // Pause speech but keep queue
    window.speechSynthesis.pause();
  } else {
    // Resume
    window.speechSynthesis.resume();
    processQueue();
  }
}

// Ensure voices are loaded
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    // Voices loaded
  };
}

export default { speakDefenceAction, toggleMute };

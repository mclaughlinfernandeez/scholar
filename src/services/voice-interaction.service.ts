import { Injectable, signal, WritableSignal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

// Extend the Window interface to include SpeechRecognition, which may be vendor-prefixed
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

@Injectable({ providedIn: 'root' })
export class VoiceInteractionService {
  private recognition: any;
  private recognition$ = new Subject<string>();
  isListening: WritableSignal<boolean> = signal(false);

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening.set(true);
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.recognition$.next(transcript);
      };
      
      this.recognition.onend = () => {
        this.isListening.set(false);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        this.isListening.set(false);
      };
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }
  }

  listen(): Observable<string> {
    if (this.recognition && !this.isListening()) {
      this.recognition.start();
    }
    return this.recognition$.asObservable();
  }

  stopListening(): void {
    if (this.recognition && this.isListening()) {
      this.recognition.stop();
    }
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        this.stopListening(); // Stop listening to avoid feedback loops
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => resolve();
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('Speech Synthesis API not supported in this browser.');
        resolve();
      }
    });
  }
}

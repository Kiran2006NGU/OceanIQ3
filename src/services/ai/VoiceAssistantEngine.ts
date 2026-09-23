/**
 * VoiceAssistantEngine.ts — Web Speech API Speech Recognition & Speech Synthesis Engine
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements:
 * 1. Voice Speech-to-Text (`SpeechRecognition` / `webkitSpeechRecognition`)
 * 2. Voice Text-to-Speech (`window.speechSynthesis`)
 * 3. Natural voice selection (prefers clear English / Indian English scientific tone)
 * 4. Zero external API cost or token dependencies (runs 100% locally in browser)
 */

type SpeechRecognitionCallback = (transcript: string, isFinal: boolean) => void
type SpeechErrorCallback = (error: string) => void

interface IWindowSpeech extends Window {
  SpeechRecognition?: any
  webkitSpeechRecognition?: any
}

class VoiceAssistantEngine {
  private recognition: any | null = null
  private isListening = false
  private isSpeaking = false

  constructor() {
    const win = typeof window !== 'undefined' ? (window as unknown as IWindowSpeech) : null
    if (win) {
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition
      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass()
        this.recognition.continuous = false
        this.recognition.interimResults = true
        this.recognition.lang = 'en-US'
      }
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null && typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  public startListening(onResult: SpeechRecognitionCallback, onError: SpeechErrorCallback): void {
    if (!this.recognition) {
      onError('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    if (this.isListening) return

    this.recognition.onstart = () => {
      this.isListening = true
    }

    this.recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      const text = finalTranscript || interimTranscript
      onResult(text, !!finalTranscript)
    }

    this.recognition.onerror = (event: any) => {
      this.isListening = false
      onError(event.error || 'Microphone error occurred')
    }

    this.recognition.onend = () => {
      this.isListening = false
    }

    try {
      this.recognition.start()
    } catch {
      this.isListening = false
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  public speak(text: string, onEnd?: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    // Clean markdown symbols from spoken text
    const cleanText = text
      .replace(/[#*_`~>-]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .slice(0, 350) // Keep spoken responses concise and punchy

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.05
    utterance.pitch = 1.0

    // Pick best English voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      (v) => v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      this.isSpeaking = true
    }

    utterance.onend = () => {
      this.isSpeaking = false
      onEnd?.()
    }

    utterance.onerror = () => {
      this.isSpeaking = false
    }

    window.speechSynthesis.speak(utterance)
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      this.isSpeaking = false
    }
  }

  public getIsListening(): boolean {
    return this.isListening
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking
  }
}

export const voiceAssistant = new VoiceAssistantEngine()

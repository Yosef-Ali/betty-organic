/**
 * Enhanced notification sound utilities
 */

export class NotificationSounds {
  private static audioContext: AudioContext | null = null;

  /**
   * Initialize audio context
   */
  private static getAudioContext(): AudioContext | null {
    if (!this.audioContext && (window.AudioContext || (window as any).webkitAudioContext)) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Failed to create audio context:', error);
        return null;
      }
    }
    return this.audioContext;
  }

  /**
   * Play a pleasant notification chime
   */
  static async playChime(): Promise<void> {
    const audioContext = this.getAudioContext();
    if (!audioContext) return;

    try {
      // Create a pleasant chime sound with multiple tones
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (C major chord)
      const duration = 0.3;

      for (let i = 0; i < notes.length; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Set the frequency
        oscillator.frequency.setValueAtTime(notes[i], audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Create a bell-like envelope
        const startTime = audioContext.currentTime + (i * 0.1);
        const endTime = startTime + duration;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
        
        oscillator.start(startTime);
        oscillator.stop(endTime);
      }
    } catch (error) {
      console.warn('Failed to play chime:', error);
    }
  }

  /**
   * Play a subtle notification beep
   */
  static async playBeep(): Promise<void> {
    const audioContext = this.getAudioContext();
    if (!audioContext) return;

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Failed to play beep:', error);
    }
  }

  /**
   * Play a success sound (higher pitched, more cheerful)
   */
  static async playSuccess(): Promise<void> {
    const audioContext = this.getAudioContext();
    if (!audioContext) return;

    try {
      // Play an ascending chord progression
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      
      for (let i = 0; i < notes.length; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(notes[i], audioContext.currentTime);
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + (i * 0.08);
        const endTime = startTime + 0.2;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
        
        oscillator.start(startTime);
        oscillator.stop(endTime);
      }
    } catch (error) {
      console.warn('Failed to play success sound:', error);
    }
  }

  /**
   * Play MP3 notification with fallback to generated sound
   */
  static async playNotificationWithFallback(
    mp3Path: string = '/sound/notification.mp3',
    fallbackType: 'chime' | 'beep' | 'success' = 'chime'
  ): Promise<void> {
    try {
      // Try to play the MP3 first
      const audio = new Audio(mp3Path);
      audio.volume = 0.7;
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.warn('MP3 playback failed, using fallback:', error);
      
      // Fall back to generated sound
      switch (fallbackType) {
        case 'chime':
          await this.playChime();
          break;
        case 'beep':
          await this.playBeep();
          break;
        case 'success':
          await this.playSuccess();
          break;
      }
    }
  }

  /**
   * Vibrate device if supported (mobile)
   */
  static vibrate(pattern: number | number[] = 200): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Vibration failed:', error);
      }
    }
  }

  /**
   * Complete notification with sound and vibration
   */
  static async playNotification(options?: {
    sound?: boolean;
    vibrate?: boolean;
    soundType?: 'chime' | 'beep' | 'success';
    vibratePattern?: number | number[];
  }): Promise<void> {
    const {
      sound = true,
      vibrate = false,
      soundType = 'chime',
      vibratePattern = [100, 50, 100]
    } = options || {};

    const promises: Promise<void>[] = [];

    if (sound) {
      promises.push(this.playNotificationWithFallback('/sound/notification.mp3', soundType));
    }

    if (vibrate) {
      this.vibrate(vibratePattern);
    }

    await Promise.all(promises);
  }
}
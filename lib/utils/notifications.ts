// Utility for managing application notifications and sounds

class NotificationSound {
  private audio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio('/notification.mp3');
    }
  }

  playNotificationSound() {
    if (this.audio) {
      this.audio.play().catch(error => {
        console.warn('Failed to play notification sound:', error);
      });
    }
  }
}

export const notificationSound = new NotificationSound();

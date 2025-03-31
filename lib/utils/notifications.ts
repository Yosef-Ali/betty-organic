// Utility for managing application notifications and sounds

// Singleton class to manage notification sounds across the app
class NotificationSoundManager {
  private static instance: NotificationSoundManager;
  private audio: HTMLAudioElement | null = null;
  private isInitialized = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public static getInstance(): NotificationSoundManager {
    if (!NotificationSoundManager.instance) {
      NotificationSoundManager.instance = new NotificationSoundManager();
    }
    return NotificationSoundManager.instance;
  }

  private init() {
    if (this.isInitialized) return;

    try {
      this.audio = new Audio('/notification.mp3');
      this.audio.preload = 'auto';
      this.isInitialized = true;
      console.log('NotificationSoundManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification sound:', error);
    }
  }

  public playNotificationSound() {
    if (!this.audio && typeof window !== 'undefined') {
      // Try to initialize if not already done (may happen if component mounts before initialization)
      this.init();
    }

    try {
      if (this.audio) {
        // Reset the audio to the beginning in case it was already playing
        this.audio.currentTime = 0;

        // Play the notification sound and handle any errors
        this.audio.play().catch(error => {
          console.error('Error playing notification sound:', error);

          // If autoplay is blocked, try playing on user interaction
          document.addEventListener('click', () => {
            this.audio?.play().catch(e => console.error('Still cannot play audio:', e));
          }, { once: true });
        });
      } else {
        // Fallback: try to play using the DOM element if available
        const audioElement = document.getElementById('notificationSound') as HTMLAudioElement;
        if (audioElement) {
          audioElement.currentTime = 0;
          audioElement.play().catch(error => {
            console.error('Error playing notification sound from DOM:', error);
          });
        }
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }
}

// Export the singleton instance
export const notificationSound = NotificationSoundManager.getInstance();

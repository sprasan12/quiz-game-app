class SoundManager {
  private static instance: SoundManager;
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private enabled: boolean = true;

  private constructor() {
    this.sounds = {
      cardFlip: new Audio('/assets/sounds/card-flip.wav'),
      correct: new Audio('/assets/sounds/correct.wav'),
      incorrect: new Audio('/assets/sounds/incorrect.mp3'),
      click: new Audio('/assets/sounds/click.wav')
    };

    // Preload sounds
    Object.values(this.sounds).forEach(audio => {
      audio.load();
    });

    // Debug log
    console.log('SoundManager initialized with sounds:', Object.keys(this.sounds));
  }

  static getInstance() {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  play(soundName: string) {
    if (this.enabled && this.sounds[soundName]) {
      try {
        console.log(`Playing sound: ${soundName}`);
        const sound = this.sounds[soundName];
        sound.currentTime = 0;
        const playPromise = sound.play();
        
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn(`Error playing sound ${soundName}:`, error);
          });
        }
      } catch (error) {
        console.error(`Failed to play sound ${soundName}:`, error);
      }
    } else {
      console.log(`Sound ${soundName} not played. Enabled: ${this.enabled}, Exists: ${!!this.sounds[soundName]}`);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    console.log('Sound enabled:', this.enabled);
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

export default SoundManager.getInstance(); 
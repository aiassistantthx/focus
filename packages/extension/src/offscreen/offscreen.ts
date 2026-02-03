import { MessageType } from '../lib/types';

chrome.runtime.onMessage.addListener((message: MessageType) => {
  if (message.type === 'PLAY_SOUND') {
    const file = message.sound === 'work-end' ? 'work-end.wav' : 'break-end.wav';
    const baseVolume = message.volume ?? 0.8;
    // Play sound 3 times for longer/louder notification
    const playCount = 3;
    let played = 0;

    const playNext = () => {
      if (played >= playCount) return;
      const audio = new Audio(chrome.runtime.getURL(`sounds/${file}`));
      // Boost volume (cap at 1.0)
      audio.volume = Math.min(1.0, baseVolume * 1.25);
      audio.onended = () => {
        played++;
        // Small delay between plays
        setTimeout(playNext, 300);
      };
      audio.play().catch(console.error);
    };

    playNext();
  }
});

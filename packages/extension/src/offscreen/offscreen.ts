import { MessageType } from '../lib/types';

chrome.runtime.onMessage.addListener((message: MessageType) => {
  if (message.type === 'PLAY_SOUND') {
    const file = message.sound === 'work-end' ? 'work-end.wav' : 'break-end.wav';
    const audio = new Audio(chrome.runtime.getURL(`sounds/${file}`));
    audio.volume = 0.8;
    audio.play().catch(console.error);
  }
});

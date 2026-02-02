// Generate simple notification WAV sounds
// Run with: node generate-sounds.cjs

const fs = require('fs');
const path = require('path');

function generateWav(frequency, durationMs, fadeMs) {
  const sampleRate = 44100;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const fadeSamples = Math.floor((sampleRate * fadeMs) / 1000);

  const data = Buffer.alloc(numSamples * 2); // 16-bit mono

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = Math.sin(2 * Math.PI * frequency * t);

    // Add a harmonic for richer sound
    sample += 0.3 * Math.sin(2 * Math.PI * frequency * 2 * t);
    sample += 0.1 * Math.sin(2 * Math.PI * frequency * 3 * t);

    // Fade in
    if (i < fadeSamples) {
      sample *= i / fadeSamples;
    }
    // Fade out
    if (i > numSamples - fadeSamples) {
      sample *= (numSamples - i) / fadeSamples;
    }

    // Normalize
    sample *= 0.4;

    const val = Math.max(-1, Math.min(1, sample));
    data.writeInt16LE(Math.floor(val * 32767), i * 2);
  }

  // WAV header
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
}

function generateMultiTone(frequencies, noteDurationMs, fadeMs) {
  const buffers = frequencies.map((freq) => generateWav(freq, noteDurationMs, fadeMs));
  // Concatenate with small gaps
  const gap = Buffer.alloc(Math.floor(44100 * 0.05) * 2); // 50ms silence
  const parts = [];
  for (let i = 0; i < buffers.length; i++) {
    // Skip WAV headers for subsequent tones, just use data
    if (i === 0) {
      parts.push(buffers[i]);
    } else {
      parts.push(gap);
      parts.push(buffers[i].slice(44)); // data only
    }
  }

  // Fix the first buffer's header to reflect total size
  const result = Buffer.concat(parts);
  result.writeUInt32LE(result.length - 8, 4);
  result.writeUInt32LE(result.length - 44, 40);
  return result;
}

const outDir = path.join(__dirname, 'public', 'sounds');

// Work end: two ascending tones (C5, E5) — gentle "ding ding"
const workEnd = generateMultiTone([523, 659], 200, 50);
fs.writeFileSync(path.join(outDir, 'work-end.wav'), workEnd);
console.log('Created work-end.wav');

// Break end: three ascending tones (C5, E5, G5) — more energetic
const breakEnd = generateMultiTone([523, 659, 784], 150, 40);
fs.writeFileSync(path.join(outDir, 'break-end.wav'), breakEnd);
console.log('Created break-end.wav');

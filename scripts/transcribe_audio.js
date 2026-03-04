const whisper = require('whisper-node');
const fs = require('fs');
const path = require('path');

const audioPath = path.join(__dirname, '..', 'dataset', 'onboarding', 'onboarding_audio.mp3');
const outputPath = path.join(__dirname, '..', 'dataset', 'onboarding', 'onboarding_audio.txt');

async function transcribe() {
    try {
        console.log(`Transcribing ${audioPath}...`);
        // The default whisper-node usage
        const transcript = await whisper(audioPath);

        // Log transcription lines
        const lines = transcript.map(item => item.speech).join('\n');

        fs.writeFileSync(outputPath, lines);
        console.log(`Transcription saved to ${outputPath}`);
    } catch (err) {
        console.error("Transcription failed:", err);
    }
}

transcribe();

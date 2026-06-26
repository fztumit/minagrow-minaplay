import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
dotenv.config({ path: resolve(root, '.env') });

const packPath = resolve(root, 'assets-source/sounds/peekaboo/pofi-ceee-tts-pack.json');
const publicDir = resolve(root, 'public/sounds/peekaboo');
const sourceDir = resolve(root, 'assets-source/sounds/peekaboo');
const tempDir = resolve(root, 'output/audio-work/pofi-ceee-tts');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY bulunamadı. Örnek: OPENAI_API_KEY=... npm run tts:ceee');
  process.exit(1);
}

mkdirSync(publicDir, { recursive: true });
mkdirSync(sourceDir, { recursive: true });
mkdirSync(tempDir, { recursive: true });

const pack = JSON.parse(readFileSync(packPath, 'utf8'));
const model = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
const voice = process.env.OPENAI_TTS_VOICE || 'coral';

const baseInstructions = [
  pack.goal,
  'Pofi sevimli bir bulut karakteridir.',
  'Ses profili: kadın sesine yakın sıcak ton; 20-35 yaş arası enerjik öğretmen hissi.',
  'Çocuk taklidi yapma. Bebeksi konuşma yapma.',
  'Net ve anlaşılır Türkçe konuş.',
  'Gülümseyerek konuşuyormuş hissi ver; güven veren ve neşeli ol.',
  'Arka plan müziği, efekt, yankı kullanma.',
  'Ceeee kısmı yaklaşık 1 saniye sürsün; ilk hece merak uyandırsın, son heceler yükselerek gelsin.',
  'Sonraki cümleyi hızlı ve neşeli oku.',
  'Toplam süre yaklaşık 1.5-2 saniye olsun.',
  'Çizgi film repliği gibi değil, gerçek bir oyun arkadaşı gibi oku.',
  'Korku, şaşkınlık veya yüksek ses baskısı oluşturma; yüzlerce tekrar dinlenebilir olsun.'
].join(' ');

function convertToWav441Mono(inputPath, outputPath) {
  execFileSync('afconvert', ['-f', 'WAVE', '-d', 'LEI16@44100', '-c', '1', inputPath, outputPath], { stdio: 'inherit' });
}

async function generateClip(clip, index) {
  const rawPath = resolve(tempDir, `${clip.fileName}.raw.wav`);
  const normalizedPath = resolve(tempDir, `${clip.fileName}.44100.wav`);
  const publicPath = resolve(publicDir, clip.fileName);
  const sourcePath = resolve(sourceDir, clip.fileName);
  const instructions = `${baseInstructions} Bu kayıt için duygu: ${clip.emotion}. Yönerge: ${clip.direction}`;

  console.log(`[${index + 1}/${pack.clips.length}] ${clip.fileName}: ${clip.text}`);
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      voice,
      input: clip.text,
      instructions,
      response_format: 'wav'
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI TTS hatası (${response.status}): ${body}`);
  }

  writeFileSync(rawPath, Buffer.from(await response.arrayBuffer()));
  convertToWav441Mono(rawPath, normalizedPath);
  renameSync(normalizedPath, publicPath);
  copyFileSync(publicPath, sourcePath);
}

for (const [index, clip] of pack.clips.entries()) {
  await generateClip(clip, index);
}

for (const clip of pack.clips) {
  const filePath = resolve(publicDir, clip.fileName);
  if (!existsSync(filePath)) {
    throw new Error(`${clip.fileName} üretilemedi.`);
  }
}

rmSync(tempDir, { recursive: true, force: true });
console.log(`Tamamlandı. Dosyalar: ${publicDir}`);

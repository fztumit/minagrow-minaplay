import { createApp } from './src/app';
import { env } from './src/config/env';

const app = createApp();

app.listen(env.PORT, env.HOST, () => {
  console.log(`MinaPlay running at http://${env.HOST}:${env.PORT}`);
});

import { createApp } from './src/app';
import { env } from './src/config/env';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`MinaPlay running on port ${env.PORT}`);
});

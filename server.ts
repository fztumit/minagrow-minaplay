import { env } from './src/config/env';
import { createApp } from './src/app';

const app = createApp(env);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

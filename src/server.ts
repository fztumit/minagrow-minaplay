import { env } from './config/env';
import { createApp } from './app';

const app = createApp(env);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

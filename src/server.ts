import 'dotenv/config';
import { connectDB } from './config/database.js';
import app from './app.js';

const PORT = Number(process.env.PORT || 4000);

(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
})();

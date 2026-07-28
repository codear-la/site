import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const status_filename = 'languages_status.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawLanguages = JSON.parse(
  fs.readFileSync(path.join(__dirname, status_filename), 'utf8')
);

export default rawLanguages
  .filter(lang => lang.available)
  .map(lang => lang.id);

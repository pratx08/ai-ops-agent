require('dotenv').config();
const app = require('./src/app');
const { log } = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  log(`AI Agent Backend listening on port ${PORT}`);
});

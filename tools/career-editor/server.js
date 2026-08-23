/* eslint-disable no-console */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const rootDir = path.resolve(__dirname, '../..');
const dataDir = path.join(rootDir, 'assets/js/career-data');
const editorFile = path.join(__dirname, 'index.html');
const port = Number(process.env.CAREER_EDITOR_PORT || 8090);

function datasetNames() {
  return fs.readdirSync(dataDir)
    .filter((name) => name.endsWith('.js') && !name.endsWith('.local.js'))
    .map((name) => name.slice(0, -3))
    .sort();
}

function resolveDataset(name) {
  if (!datasetNames().includes(name)) {
    throw new Error('Unknown career dataset');
  }
  return path.join(dataDir, `${name}.js`);
}

function readDataset(name) {
  const filePath = resolveDataset(name);
  delete require.cache[require.resolve(filePath)];
  return require(filePath);
}

function writeDataset(name, value) {
  if (!Array.isArray(value)) {
    throw new Error('Dataset must be an array');
  }
  const filePath = resolveDataset(name);
  fs.writeFileSync(
    filePath,
    `// Career data sector: ${name}\nmodule.exports = ${JSON.stringify(value, null, 2)};\n`,
    'utf8'
  );
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function sendEditor(response) {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(fs.readFileSync(editorFile, 'utf8'));
}

function handle(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  try {
    if (request.method === 'GET' && requestUrl.pathname === '/') {
      return sendEditor(response);
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/datasets') {
      return sendJson(response, 200, { datasets: datasetNames() });
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/data') {
      const name = requestUrl.searchParams.get('dataset');
      return sendJson(response, 200, { dataset: name, rows: readDataset(name) });
    }
    if (request.method === 'PUT' && requestUrl.pathname === '/api/data') {
      const name = requestUrl.searchParams.get('dataset');
      let body = '';
      request.setEncoding('utf8');
      request.on('data', (chunk) => { body += chunk; });
      request.on('end', () => {
        try {
          writeDataset(name, JSON.parse(body).rows);
          sendJson(response, 200, { ok: true });
        } catch (error) {
          sendJson(response, 400, { error: error.message });
        }
      });
      return;
    }
    response.writeHead(404);
    response.end('Not found');
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
}

http.createServer(handle).listen(port, '127.0.0.1', () => {
  console.log(`[career-editor] http://127.0.0.1:${port}`);
});

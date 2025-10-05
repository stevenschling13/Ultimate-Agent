const http = require('http');
const { URL } = require('url');

const port = Number(process.env.PORT ?? 3000);

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.statusCode = 400;
    res.end('Bad request');
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (url.pathname === '/health') {
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (url.pathname === '/') {
    res.end(
      JSON.stringify({
        name: 'Ultimate Agent Orchestrator',
        version: '0.1.0',
        openaiKeyConfigured: Boolean(process.env.OPENAI_API_KEY)
      })
    );
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, () => {
  console.log(`Agent orchestrator listening on port ${port}`);
});

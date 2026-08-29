import { createServer } from "node:http";

const port = Number(process.env.PORT) || 3000;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>worldasitwas</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: Georgia, "Times New Roman", serif;
      background: #f5f1e8;
      color: #1f1b16;
    }
    @media (prefers-color-scheme: dark) {
      body { background: #15120e; color: #efe8da; }
    }
    main { text-align: center; padding: 2rem; }
    h1 { font-weight: 400; font-size: clamp(2rem, 6vw, 4rem); margin: 0 0 .5rem; letter-spacing: .02em; }
    p { margin: 0; opacity: .7; font-size: 1.1rem; }
  </style>
</head>
<body>
  <main>
    <h1>Hello, world.</h1>
    <p>worldasitwas</p>
  </main>
</body>
</html>
`;

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`worldasitwas-web listening on port ${port}`);
});

const net = require('net');

const hosts = [
  'ep-lingering-smoke-apxof6jd-pooler.c-7.us-east-1.aws.neon.tech',
  'ep-lingering-smoke-apxof6jd.c-7.us-east-1.aws.neon.tech'
];
const port = 5432;

hosts.forEach(host => {
  console.log(`Testing connection to ${host}:${port}...`);
  const socket = new net.Socket();
  const startTime = Date.now();

  socket.setTimeout(5000);

  socket.connect(port, host, () => {
    console.log(`[SUCCESS] Connected to ${host}:${port} in ${Date.now() - startTime}ms`);
    socket.destroy();
  });

  socket.on('error', (err) => {
    console.error(`[ERROR] Failed to connect to ${host}:${port}:`, err.message);
    socket.destroy();
  });

  socket.on('timeout', () => {
    console.error(`[TIMEOUT] Connection to ${host}:${port} timed out after 5s`);
    socket.destroy();
  });
});

import net from 'net';
const PORT = 9400;
const HOST = '0.0.0.0'; // Listen on all network interfaces
const server = net.createServer((socket) => {
    console.log('Client connected');
    socket.on('data', (data) => {
        console.log('Received: ' + data);
    });
    socket.on('close', () => {
        console.log('Client disconnected');
    });
});
server.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}`);
});

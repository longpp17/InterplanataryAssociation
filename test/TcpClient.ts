import * as net from 'net';

const client = new net.Socket();
client.connect(1337, '127.0.0.1', () => {
    console.log('Connected to server');
    client.write('Hello, server! Love, Client.');
});

client.on('data', (data) => {
    console.log('Received:', data.toString());
    client.destroy(); // kill client after server's response
});

client.on('close', () => {
    console.log('Connection closed');
});

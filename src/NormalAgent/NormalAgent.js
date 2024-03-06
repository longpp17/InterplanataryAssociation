import { setupLibp2p } from './NormalNode.js';
import record from 'node-record-lpcm16';
import { Server } from "socket.io";
import { createServer } from "http";
function createAudioIOServer() {
    const httpServer = createServer();
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    httpServer.listen(3000, () => {
        console.log("listening on http://localhost:3000");
    });
    return io;
}
// deprecated
function createAudioStream() {
    // TODO: Allow selecting devices
    const audioStream = record.record({
        sampleRate: 16000,
        channels: 2,
        // device: 'MacBook Pro Microphone'
    }).stream();
    return audioStream;
}
// deprecated
const broadcastAudioStream = (audioStream, node) => {
    audioStream
        .on('data', (chunk) => {
        publishChunk(chunk, node);
    });
};
function publishChunk(chunk, node) {
    const topic = 'audio-stream';
    node.services.pubsub.publish(topic, chunk)
        .catch((error) => {
        console.error('Error publishing to topic:', error);
    });
}
const publishToNet = (server, node) => {
    server.on("audio-buffer", (buffer) => {
        console.log("publishing to net");
        console.log(buffer);
        publishChunk(buffer, node);
    });
};
const getAudioStream = async (node, callback) => {
    console.log("subscribe to audio stream");
    const topic = 'audio-stream';
    node.services.pubsub.subscribe(topic);
    node.services.pubsub.addEventListener('message', (message) => {
        if (topic === message.detail.topic) {
            callback(message.detail.data);
        }
    });
};
let retryOperation;
retryOperation = async (operation, maxAttempts = 5, delay = 1000) => {
    try {
        // Attempt the operation
        return await operation();
    }
    catch (error) {
        console.error(error);
        if (maxAttempts <= 1) {
            throw error; // Rethrow error after max attempts reached
        }
        // Wait for a delay before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        // Retry with one less attempt and double the delay
        return retryOperation(operation, maxAttempts - 1, delay * 2);
    }
};
const main = async () => {
    const ioServer = createAudioIOServer();
    var clientNode = null;
    ioServer.on("connection", (socket) => {
        console.log("connected");
        socket.on("setup-bootstrap", async (data) => {
            console.log("setup-bootstrap", data);
            clientNode = await setupLibp2p(data);
        });
        socket.on("audio-buffer", async (buffer) => {
            console.log("audio-buffer", buffer);
            if (clientNode != null) {
                publishChunk(buffer, clientNode);
            }
        });
        socket.emit("audio-buffer", "test");
    });
    // ioServer.on("setup-bootstrap",  async (data: string[]) => {
    //     console.log("setup-bootstrap", data);
    //
    //     const clientNode = await setupLibp2p(data);
    //
    //     await retryOperation(async () => {
    //         publishToNet(ioServer, clientNode);
    //     })
    //
    //     await getAudioStream(clientNode, (msg: Message) => {
    //         ioServer.emit("audio-buffer", msg.data);
    //     });
    // })
    const cleanupAndExit = () => {
        console.log('Cleaning up before exit...');
        // Perform any necessary cleanup here
        process.exit(); // Exit the process
    };
    // Listen for SIGINT signal (Ctrl+C)
    process.on('SIGINT', cleanupAndExit);
};
main().catch(console.error);

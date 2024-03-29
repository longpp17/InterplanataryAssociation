import { setupLibp2p } from './NormalNode.js';
import { Server } from "socket.io";
import { createServer } from "http";
// Creating a libp2p node with:
//   transport: websockets + tcp
//   stream-muxing: mplex
//   crypto-channel: noise
//   discovery: multicast-dns
//   dht: kad-dht
//   pubsub: gossipsub
// milestones:
// stage 1
// 1. create a libp2p node DONE
// 2. create a always on relay node on the server DONE
// 3. create agent on local machines to default use that relay node as bootstrap node DONE
// 4. connect with other node in other NAT (requires punching holes) DONE
// 5. sending messages DONE
// 6. broadcast messages DONE
// 7. capture local sound DONE
// 8. broadcast sound TESTING
// Exp1: use gossipsub to broadcast sounddata, result: failed, gossipsub is not designed for large data
// Exp2: using yamux
// 9. merge sound together
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
function publishChunk(chunk, node) {
    const topic = 'audio-stream';
    node.services.pubsub.publish(topic, chunk)
        .catch((error) => {
        console.error('Error publishing to topic:', error);
    });
}
const getAudioStream = (node, callback) => {
    console.log("subscribe to audio stream");
    if (node != null) {
        const topic = 'audio-stream';
        node.services.pubsub.subscribe(topic);
        node.services.pubsub.addEventListener('message', (message) => {
            if (topic === message.detail.topic) {
                callback(message.detail.data);
            }
        });
    }
    else {
        console.log("failed to subscribe to audio stream, client node is null");
    }
};
let retryOperation;
retryOperation = async (operation, maxAttempts = 5, delay = 1000) => {
    try {
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
            // temp fix, not sure if this can work.
            getAudioStream(clientNode, (msg) => {
                ioServer.emit("audio-buffer", msg);
            });
        });
        socket.on("audio-buffer", async (buffer) => {
            console.log("audio-buffer", buffer);
            if (clientNode != null) {
                publishChunk(buffer, clientNode);
            }
            else {
                console.log("failed to publish chunk, client node is null");
            }
        });
    });
    const cleanupAndExit = () => {
        console.log('Cleaning up before exit...');
        // Perform any necessary cleanup here
        process.exit(); // Exit the process
    };
    // Listen for SIGINT signal (Ctrl+C)
    process.on('SIGINT', cleanupAndExit);
};
main().catch(console.error);

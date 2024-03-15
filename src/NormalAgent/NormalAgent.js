import { setupLibp2p } from './NormalNode.js';
import { Server } from "socket.io";
import { createServer } from "http";
import { pipe } from "it-pipe";
import { pushable } from 'it-pushable';
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
function publishToGossip(topic, data, node) {
    node.services.pubsub.publish(topic, data)
        .catch((error) => {
        console.error('Error publishing to topic:', error);
    });
}
// async function sendDataToMultiplePeers(peers: Multiaddr[], data: any, node: Libp2p<any>){
//     try{
//         const {stream} = await node.dialProtocol(peers[0], '/audio-stream');
//         await stream.write(data);
//     } catch (error){
//         console.log("failed to send data to multiple peers", error)
//     }
// }
function subscribeToGossipSub(topic, node, callback) {
    node.services.pubsub.subscribe(topic);
    node.services.pubsub.addEventListener('message', (message) => {
        if (topic === message.detail.topic) {
            callback(message.detail.data);
        }
    });
}
async function subscribeToStream(node, callback) {
    await node.handle(DIAL_PROTOCOL, async ({ stream }) => {
        await pipe(stream, async (source) => {
            for await (const chunk of source) {
                // Emit the audio chunk to all connected Socket.IO clients
                callback(chunk);
            }
        });
    });
}
// Function to initialize a streaming connection to a specific peer
// and return a pushable stream that you can use to send audio data continuously
async function initAudioStreamToPeer(peerId, node) {
    // Dial the peer using the audio stream protocol
    const stream = await node.dialProtocol(peerId, DIAL_PROTOCOL);
    // Create a pushable stream where you can push audio data chunks
    const audioDataStream = pushable();
    // Use the pipe utility to send audio data through the stream
    pipe(audioDataStream, 
    // The stream is already in the correct format, so we can directly pipe it
    stream).catch(err => {
        console.error('Stream error:', err);
        audioDataStream.end(err);
    });
    // Return the pushable stream so you can push audio data to it later
    return audioDataStream;
}
function publishChunkToGossip(chunk, node) {
    publishToGossip('audio-stream', chunk, node);
}
const getAudioStreamFromGossip = (node, callback) => {
    console.log("subscribe to audio stream");
    if (node != null) {
        subscribeToGossipSub('audio-stream', node, callback);
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
const DIAL_PROTOCOL = '/audio-stream/1.0.0';
const PUSHABLE_AUDIO_STREAMS = [];
const main = async () => {
    const ioServer = createAudioIOServer();
    var clientNode = null;
    ioServer.on("connection", (socket) => {
        console.log("connected");
        socket.on("setup-bootstrap", async (data) => {
            console.log("setup-bootstrap", data);
            clientNode = await setupLibp2p(data);
            await subscribeToStream(clientNode, (msg) => {
                ioServer.emit("audio-buffer", msg);
            });
        });
        socket.on("audio-buffer", async (buffer) => {
            console.log("audio-buffer", buffer);
            PUSHABLE_AUDIO_STREAMS.forEach((pushable) => {
                pushable.push(buffer);
            });
            // publish to gossipsub
            // if (clientNode != null) {
            //     publishChunkToGossip(buffer, clientNode);
            // }
            // else{
            //     console.log("failed to publish chunk, client node is null")
            // }
        });
        socket.on("get-peers", async () => {
            if (clientNode != null) {
                const peers = clientNode.getConnections()
                    .map((connection) => {
                    const peerInfo = {
                        peerID: connection.remotePeer.toString(),
                        address: connection.remoteAddr.toString()
                    };
                    return peerInfo;
                });
                console.log("get-peers", peers);
                socket.emit("get-peers", JSON.stringify(peers));
            }
            else {
                console.log("failed to get peers, client node is null");
            }
        });
        socket.on("stream-to-peer", async (peerId) => {
            if (clientNode != null) {
                // setup peer to stream
                const peersToConnect = clientNode.getPeers().filter((peer) => peer.toString() === peerId);
                for (let peer in peersToConnect) {
                    const pushable = await initAudioStreamToPeer(peersToConnect[peer], clientNode);
                    PUSHABLE_AUDIO_STREAMS.push(pushable);
                }
                // const audioStream = await initAudioStreamToPeer(peer, clientNode);
                // console.log("stream-to-peer", peerId);
                // socket.emit("audio-stream", audioStream);
            }
            else {
                console.log("failed to stream to peer, client node is null");
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
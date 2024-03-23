import { pipe } from "it-pipe";
import { pushable } from 'it-pushable';
export function publishToGossip(topic, data, node) {
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
export function subscribeToGossipSub(topic, node, callback) {
    node.services.pubsub.subscribe(topic);
    node.services.pubsub.addEventListener('message', (message) => {
        if (topic === message.detail.topic) {
            callback(message.detail.data);
        }
    });
}
export async function subscribeToStream(node, dial_protocol, callback) {
    await node.handle(dial_protocol, async ({ stream }) => {
        await pipe(stream.source, async (source) => {
            for await (const chunk of source) {
                // Emit the audio chunk to all connected Socket.IO clients
                callback(chunk);
            }
        });
    });
}
// Function to initialize a streaming connection to a specific peer
// and return a pushable stream that you can use to send audio data continuously
export async function initAudioStreamToPeer(peerId, dial_protocol, node) {
    // Dial the peer using the audio stream protocol
    const stream = await node.dialProtocol(peerId, dial_protocol, { runOnTransientConnection: true });
    console.log("dialed peer", peerId.toString());
    // Create a pushable stream where you can push audio data chunks
    const audioDataStream = pushable();
    // Use the pipe utility to send audio data through the stream
    pipe(audioDataStream, consumeSource, 
    // The stream is already in the correct format, so we can directly pipe it
    stream.sink).catch(err => {
        console.error('Stream error:', err);
        audioDataStream.end(err);
    });
    console.log("audioStream Created");
    // Return the pushable stream so you can push audio data to it later
    return audioDataStream;
}
export async function* consumeSource(source) {
    // for test
    for await (const chunk of source) {
        console.log("chunk", chunk);
        yield chunk;
    }
}
export function publishChunkToGossip(chunk, node) {
    publishToGossip('audio-stream', chunk, node);
}
export function getAudioStreamFromGossip(node, callback) {
    console.log("subscribe to audio stream");
    if (node != null) {
        subscribeToGossipSub('audio-stream', node, callback);
    }
    else {
        console.log("failed to subscribe to audio stream, client node is null");
    }
}
export async function setupStreamWithPeers(node, peerid, dial_protocol) {
    const peersToConnect = node.getPeers().filter((peer) => peer.toString() === peerid);
    var pushableStreams = [];
    for (const peer of peersToConnect) {
        const pushable = await initAudioStreamToPeer(peer, dial_protocol, node);
        pushableStreams.push(pushable);
    }
    return pushableStreams;
}
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

import { setupLibp2p } from './NormalNode.js';
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from 'process';
import record from 'node-record-lpcm16';
function createAudioStream() {
    // TODO: Allow selecting devices
    const audioStream = record.record({
        sampleRate: 16000,
        channels: 2,
        // device: 'MacBook Pro Microphone'
    }).stream();
    return audioStream;
}
const broadcastAudioStream = async (audioStream, node) => {
    const topic = 'audio-stream';
    audioStream
        .on('data', (chunk) => {
        try {
            node.services.pubsub.publish(topic, chunk)
                .catch((error) => {
                console.error('Error publishing to topic:', error);
            });
        }
        catch (error) {
            console.error('Error publishing to topic:', error);
        }
    })
        .on('error', (err) => {
        console.error('Stream error:', err);
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
    const CLInterface = readline.createInterface({ input, output });
    const bootstrapLink = await CLInterface.question('Enter the bootstrap link: ');
    const clientNode = await setupLibp2p([bootstrapLink]);
    console.log('Libp2p has been set up');
    console.log(`Node started with id ${clientNode.peerId.toString()}`);
    const audioStream = createAudioStream();
    retryOperation(() => {
        return broadcastAudioStream(audioStream, clientNode);
    })
        .then(() => {
        console.log('Audio stream broadcasted');
    })
        .catch(console.error);
    await getAudioStream(clientNode, (msg) => {
        console.log(msg);
    });
    // Cleanup and exit function
    const cleanupAndExit = () => {
        console.log('Cleaning up before exit...');
        // Perform any necessary cleanup here
        CLInterface.close(); // Close the readline interface
        process.exit(); // Exit the process
    };
    // Listen for SIGINT signal (Ctrl+C)
    process.on('SIGINT', cleanupAndExit);
};
main().catch(console.error);

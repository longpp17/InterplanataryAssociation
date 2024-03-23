import { setupLibp2p } from './NormalNode.js';
import { Buffer } from 'buffer';
// @ts-ignore
import { subscribeToStream, setupStreamWithPeers } from "./Libp2pIO.js";
import * as readline from "readline";
const DIAL_PROTOCOL = '/audio-stream/1.0.0';
var PUSHABLE_AUDIO_STREAMS = [];
const main = async () => {
    var clientNode = await setupLibp2p(["/ip4/192.168.0.4/tcp/10000/ws/p2p/12D3KooWRRukZUFFjDKA2qqYPcZjXtjBLegqjFm4ZCuxXnPUtbip"]); // to insert
    console.log("Multiaddrs: ", clientNode.getMultiaddrs().map((addr) => addr.toString()));
    await subscribeToStream(clientNode, DIAL_PROTOCOL, (msg) => {
        console.log("recv-audio-buffer", msg);
    });
    const r1 = readline.createInterface({ input: process.stdin, output: process.stdout });
    recursiveAsyncReadLine(r1, clientNode);
};
function recursiveAsyncReadLine(r1, clientNode) {
    r1.question('Command: ', async function (answer) {
        const answers = answer.split(" ");
        if (answers[0] === 'exit') { // Define a base case for recursion termination
            return r1.close(); // Close the readline interface and exit the function
        }
        else if (answers[0] === 'dial') {
            PUSHABLE_AUDIO_STREAMS = await setupStreamWithPeers(clientNode, answers[1], DIAL_PROTOCOL);
        }
        else if (answers[0] === 'push') {
            PUSHABLE_AUDIO_STREAMS.forEach((pushable) => {
                pushable.push(Buffer.from(answers[1]));
            });
        }
        else {
            PUSHABLE_AUDIO_STREAMS.forEach((pushable) => {
                console.log("pushing data", answer);
                pushable.push(Buffer.from(answer));
            });
        }
        console.log('Got it! Your answer was: "', answer, '"');
        recursiveAsyncReadLine(r1, clientNode); // Recursively call the function to ask a new question
    });
}
await main();
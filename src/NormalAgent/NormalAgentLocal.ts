import { setupLibp2p } from './NormalNode.js';
import { pushable, Pushable } from 'it-pushable';
import { Buffer } from 'buffer';
// @ts-ignore
import { subscribeToStream, initAudioStreamToPeer } from "./Libp2pIO.js";
import * as readline from "readline";
import {Libp2pNode} from "libp2p/libp2p";
import {Libp2p} from "libp2p";
const DIAL_PROTOCOL = '/audio-stream/1.0.0';
const PUSHABLE_AUDIO_STREAMS : Pushable<Uint8Array>[] = [];
const main = async () => {
    var clientNode = await setupLibp2p(["/ip4/192.168.0.4/tcp/10000/ws/p2p/12D3KooWRRukZUFFjDKA2qqYPcZjXtjBLegqjFm4ZCuxXnPUtbip"]); // to insert

    console.log("Multiaddrs: ", clientNode.getMultiaddrs().map((addr) => addr.toString()))
    await subscribeToStream(clientNode, DIAL_PROTOCOL, (msg: any) => {
        console.log("recv-audio-buffer", msg)
    })

    const r1 = readline.createInterface({input: process.stdin, output: process.stdout});
   recursiveAsyncReadLine(r1, clientNode);
}

function recursiveAsyncReadLine(r1: readline.Interface, clientNode: Libp2p<any>) {
    r1.question('Command: ', async function (answer) {
        const answers = answer.split(" ");

        if (answers[0] === 'exit') { // Define a base case for recursion termination
            return r1.close(); // Close the readline interface and exit the function
        } else if (answers[0] === 'dial') {
            const peersToConnect = clientNode.getPeers().filter((peer) => peer.toString() === answers[1])
            console.log("dialing:", peersToConnect)
            for (const peer of peersToConnect) {
                const pushable = await initAudioStreamToPeer(peer, DIAL_PROTOCOL, clientNode);

                PUSHABLE_AUDIO_STREAMS.push(pushable);
            }
        }
        else if (answers[0] === 'push') {
            PUSHABLE_AUDIO_STREAMS.forEach((pushable) => {
                pushable.push(Buffer.from(answers[1]));
            })
        }
        else {
            PUSHABLE_AUDIO_STREAMS.forEach((pushable) => {
                console.log("pushing data", answer)
                pushable.push(Buffer.from(answer));
            })
        }
        console.log('Got it! Your answer was: "', answer, '"');
        recursiveAsyncReadLine(r1, clientNode); // Recursively call the function to ask a new question
    });
}


await main();
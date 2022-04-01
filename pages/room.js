const { connect, createLocalVideoTrack } = require('twilio-video');
import React, { useState, useEffect, useRef } from 'react';

export default function Index({ token, roomName, userName }) {
    const [connectStatus, setConnectStatus] = useState('disconnected');
    const [room, setRoom] = useState(undefined);

    const initiateConnect = async () => {
        setConnectStatus('connecting');
        const room = await connectToTwilio(token, roomName);
        if (room) {
            setRoom(room);
            setConnectStatus('connected');
        }
    }

    const killConnection = () => {
        room.disconnect();
        setConnectStatus('disconnected');
    }

    return <div>
        <div>room: {roomName}</div>
        <div>user: {userName}</div>
        <div>state: {connectStatus}</div>
        <button onClick={initiateConnect}>connect</button>
        <button onClick={killConnection}>disconnect</button>
        <LocalMedia />
        <RemoteMedia />
    </div>;
}

const connectToTwilio = (token, roomName) => {
    return connect(token, { name: roomName }).then(room => {
        console.log(`Successfully joined a Room: ${room}`);
        room.on('participantConnected', participant => {
            console.log(`A remote Participant connected: ${participant}`);
        });

        const localParticipant = room.localParticipant;
        console.log(`Connected to the Room as LocalParticipant "${localParticipant.identity}"`);

        // Log any Participants already connected to the Room
        room.participants.forEach(participant => {
            console.log(`Participant "${participant.identity}" is connected to the Room`);
        });

        // Log new Participants as they connect to the Room
        room.on('participantConnected', participant => {
            console.log(`Participant "${participant.identity}" has connected to the Room`);
        });

        // Log Participants as they disconnect from the Room
        room.on('participantDisconnected', participant => {
            console.log(`Participant "${participant.identity}" has disconnected from the Room`);
        });
        return room;
    }, error => {
        console.log(error);
        console.error(`Unable to connect to Room: ${error.message}`);
    });
}

export async function getServerSideProps({ query, req }) {
    const { roomName, userName } = query;
    const baseUrl = req ? `${reqProtocol(req)}://${req.headers.host}` : '';
    const response = await fetch(`${baseUrl}/api/room?roomName=${roomName}&userName=${userName}`);
    const data = await response.json();
    const { token } = data;
    return { props: { token, roomName, userName } };
}

const reqProtocol = (req) => {
    const host = req.headers.host;
    if (host.includes("localhost")) return "http";
    // if it is a Vercel deployment, this will probably be present and we can assume it is secure
    if (req.headers["x-now-deployment-url"]) return "https";
    // if Next.js is running on a custom server, like Express, req.protocol will probably be available
    return req["protocol"] || "https";
};

function LocalMedia() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        createLocalVideoTrack().then(track => {
            if (track) {
                track.attach(el);
            }
        });
    });

    return <div>
        <div>Local</div>
        <video ref={ref}></video>
    </div>;
}

function RemoteMedia() {
    return <div><div>Remote</div>
        <div id="remote-media"></div></div>
}
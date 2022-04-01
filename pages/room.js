const { connect } = require('twilio-video');
import React, { useEffect } from 'react';

export default function Index({ token, roomName, userName }) {
    if (typeof window !== 'undefined') {
        // Similar to componentDidMount and componentDidUpdate:
        useEffect(() => {
            connect(token, { name: roomName }).then(room => {
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
            }, error => {
                console.log(error);
                console.error(`Unable to connect to Room: ${error.message}`);
            });
        });
    }

    return <div>Hello!</div>;
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

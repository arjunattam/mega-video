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

export async function getServerSideProps(ctx) {
    const { roomName, userName } = ctx.query;
    const response = await fetch(`http://localhost:3000/api/room?roomName=${roomName}&userName=${userName}`);
    const data = await response.json();
    const { token } = data;
    return { props: { token, roomName, userName } };
}

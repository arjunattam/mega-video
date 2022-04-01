//@ts-check
const { connect } = require('twilio-video');
import React, { useEffect, useState } from 'react';
import { Participant } from '../components/Participant';
import { reqProtocol } from '../utils';

export default function Room({ token, roomName, userName }) {
    const [connectStatus, setConnectStatus] = useState('disconnected');
    const [room, setRoom] = useState(null);
    const [participants, setParticipants] = useState([]);

    const participantConnected = participant => {
        setParticipants(prevParticipants => [...prevParticipants, participant]);
    };
    const participantDisconnected = participant => {
        setParticipants(prevParticipants =>
            prevParticipants.filter(p => p !== participant)
        );
    };

    const initiateConnect = async () => {
        setConnectStatus('connecting');
        const room = await connectToTwilio(token, roomName);
        if (room) {
            setRoom(room);
            setConnectStatus(room.localParticipant.state);
            room.on('participantConnected', participantConnected);
            room.on('participantDisconnected', participantDisconnected);
            room.participants.forEach(participantConnected);
        }
    }

    const killConnection = () => {
        if (room && room.localParticipant.state === 'connected') {
            room.localParticipant.tracks.forEach(function (trackPublication) {
                trackPublication.track.stop();
            });
            room.disconnect();
            setRoom(null);
            setConnectStatus('disconnected');
        }
    }

    useEffect(() => {
        window.addEventListener("beforeunload", killConnection);
    })

    let remoteVideoTrackPublications = [];
    if (room) {
        room.participants.forEach(participant => {
            participant.videoTracks.forEach(track => {
                if (track.kind === "video") {
                    remoteVideoTrackPublications.push(track);
                }
            });
        })
    }
    const participantNames = participants.map(p => p.identity);

    const remoteParticipants = participants.map(participant => (
        <Participant key={participant.sid} participant={participant} />
    ));

    return <div>
        <div>room: {roomName}</div>
        <div>user: {userName}</div>
        <div>state: {connectStatus}</div>
        <div>participants: {participantNames.join(', ')}</div>
        <button onClick={initiateConnect}>connect</button>
        <button onClick={killConnection}>disconnect</button>
        <div className="local-participant">
            {room ? (
                <Participant
                    key={room.localParticipant.sid}
                    participant={room.localParticipant}
                />
            ) : (
                ''
            )}
        </div>

        <h3>Remote Participants</h3>
        <div className="remote-participants">{remoteParticipants}</div>
    </div>;
}

const connectToTwilio = (token, roomName) => {
    return connect(token, { name: roomName }).then(room => {
        console.log(`Successfully joined a Room: ${room}`);
        return room;
    }, error => {
        console.log(error);
        console.error(`Unable to connect to Room: ${error.message}`);
    });
}

export async function getServerSideProps({ query, req }) {
    const { roomName, userName } = query;
    // TODO: error handling here
    const baseUrl = req ? `${reqProtocol(req)}://${req.headers.host}` : '';
    const response = await fetch(`${baseUrl}/api/twilio?roomName=${roomName}&userName=${userName}`);
    const data = await response.json();
    const { token } = data;
    return { props: { token, roomName, userName } };
}

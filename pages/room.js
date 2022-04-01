//@ts-check
const { connect } = require('twilio-video');
import React, { useState, useEffect, useRef } from 'react';

export default function Index({ token, roomName, userName }) {
    const [connectStatus, setConnectStatus] = useState('disconnected');
    const [room, setRoom] = useState(undefined);
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
            setConnectStatus('connected');
            room.on('participantConnected', participantConnected);
            room.on('participantDisconnected', participantDisconnected);
            room.participants.forEach(participantConnected);
        }
    }

    const killConnection = () => {
        room.disconnect();
        setConnectStatus('disconnected');
    }

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
        room.on('participantConnected', participant => {
            console.log(`A remote Participant connected: ${participant}`);
        });

        const localParticipant = room.localParticipant;
        console.log(`Connected to the Room as LocalParticipant "${localParticipant.identity}"`);

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

const Participant = ({ participant }) => {
    const [videoTracks, setVideoTracks] = useState([]);
    const [audioTracks, setAudioTracks] = useState([]);

    const videoRef = useRef();
    const audioRef = useRef();

    const trackpubsToTracks = trackMap => Array.from(trackMap.values())
        .map(publication => publication.track)
        .filter(track => track !== null);

    useEffect(() => {
        const trackSubscribed = track => {
            if (track.kind === 'video') {
                setVideoTracks(videoTracks => [...videoTracks, track]);
            } else {
                setAudioTracks(audioTracks => [...audioTracks, track]);
            }
        };
        const trackUnsubscribed = track => {
            if (track.kind === 'video') {
                setVideoTracks(videoTracks => videoTracks.filter(v => v !== track));
            } else {
                setAudioTracks(audioTracks => audioTracks.filter(a => a !== track));
            }
        };
        setVideoTracks(trackpubsToTracks(participant.videoTracks));
        setAudioTracks(trackpubsToTracks(participant.audioTracks));

        participant.on('trackSubscribed', trackSubscribed);
        participant.on('trackUnsubscribed', trackUnsubscribed);

        // cleanup
        return () => {
            setVideoTracks([]);
            setAudioTracks([]);
            participant.removeAllListeners();
        };
    }, [participant]);

    useEffect(() => {
        // TODO: for audio
        const videoTrack = videoTracks[0];
        if (videoTrack) {
            videoTrack.attach(videoRef.current);
            return () => {
                videoTrack.detach();
            };
        }
    }, [videoTracks]);

    return (
        <div className="participant">
            <h3>{participant.identity}</h3>
            <video ref={videoRef} autoPlay={true} width={200} />
            <audio ref={audioRef} autoPlay={true} muted={true} />
        </div>
    );
};

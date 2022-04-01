const AccessToken = require('twilio').jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

// Used when generating any kind of tokens
// To set up environmental variables, see http://twil.io/secure
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioApiKey = process.env.TWILIO_API_KEY_SID;
const twilioApiSecret = process.env.TWILIO_API_KEY_SECRET;

const getAccessToken = (roomName, userName) => {
    const identity = userName;
    const videoGrant = new VideoGrant({
        room: roomName,
    });
    const token = new AccessToken(
        twilioAccountSid,
        twilioApiKey,
        twilioApiSecret,
        { identity: identity }
    );
    token.addGrant(videoGrant);
    return token;
}

const findOrCreateRoom = async (roomName) => {
    const twilioClient = require("twilio")(
        process.env.TWILIO_API_KEY_SID,
        process.env.TWILIO_API_KEY_SECRET,
        { accountSid: process.env.TWILIO_ACCOUNT_SID }
    );
    try {
        // see if the room exists already. If it doesn't, this will throw
        // error 20404.
        return await twilioClient.video.rooms(roomName).fetch();
    } catch (error) {
        // the room was not found, so create it
        if (error.code == 20404) {
            return await twilioClient.video.rooms.create({
                uniqueName: roomName,
                type: "go",
            });
        } else {
            // let other errors bubble up
            throw error;
        }
    }
};

export default async function handler(req, res) {
    const { roomName, userName } = req.query;
    const room = await findOrCreateRoom(roomName);
    const token = getAccessToken(roomName, userName);
    res.status(200).json({
        token: token.toJwt(),
    })
}
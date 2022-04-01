const jwt = require('jsonwebtoken');
const uuid4 = require('uuid4');
const axios = require('axios');

const app_access_key = process.env.HMS_APP_ACCESS_KEY;
const app_secret = process.env.HMS_APP_SECRET;
const TEMPLATE_ID = 'megavideo_createown_89b528b0-249d-40c3-bd9e-9207c5909c88';
const API_URL = 'https://prod-in2.100ms.live/api/v2/rooms';

const getManagementToken = async () => {
    return new Promise((resolve, reject) => {
        jwt.sign(
            {
                access_key: app_access_key,
                type: 'management',
                version: 2,
                iat: Math.floor(Date.now() / 1000),
                nbf: Math.floor(Date.now() / 1000)
            },
            app_secret,
            {
                algorithm: 'HS256',
                expiresIn: '24h',
                jwtid: uuid4()
            },
            function (err, token) {
                resolve(token);
            }
        );

    })
}

const getAppToken = async (roomId, userId, role) => {
    return new Promise((resolve, reject) => {
        const payload = {
            access_key: app_access_key,
            room_id: roomId,
            user_id: userId,
            role: role,
            type: 'app',
            version: 2,
            iat: Math.floor(Date.now() / 1000),
            nbf: Math.floor(Date.now() / 1000)
        };
        jwt.sign(
            payload,
            app_secret,
            {
                algorithm: 'HS256',
                expiresIn: '24h',
                jwtid: uuid4()
            },
            function (err, token) {
                resolve(token);
            }
        );
    })
}

const createOrGetRoom = async (roomName) => {
    const payload = {
        name: roomName,
        template: TEMPLATE_ID
    };
    const token = await getManagementToken();
    const headers = { 'Authorization': `Bearer ${token}` }

    try {
        const response = await axios.post(API_URL, payload, { headers });
        return response.data;
    } catch (err) {
        console.log(err);
    }
}

export default async function handler(req, res) {
    const { roomName, userName } = req.query;
    const room = await createOrGetRoom(roomName);
    const appToken = await getAppToken(room.id, userName, 'host');
    res.status(200).json({
        room,
        appToken
    })
}

function httpsPost({ body, ...options }) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            method: 'POST',
            ...options,
        }, res => {
            const chunks = [];
            res.on('data', data => chunks.push(data))
            res.on('end', () => {
                let resBody = Buffer.concat(chunks);
                switch (res.headers['content-type']) {
                    case 'application/json':
                        resBody = JSON.parse(resBody);
                        break;
                }
                resolve(resBody)
            })
        })
        req.on('error', reject);
        if (body) {
            req.write(body);
        }
        req.end();
    })
}
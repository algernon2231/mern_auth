const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();

app.use(express.json());

const ACCESS_TOKEN_SECRET = "secretkey";
const REFRESH_TOKEN_SECRET = "refreshkey";
const ACCESS_TOKEN_EXPIRATION = "10s";
const REFRESH_TOKEN_EXPIRATION = "15m";

app.use(cors({
    origin: "http://127.0.0.1:5173", // update with your actual origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
const users = [
    {
        id: '1',
        username: 'admin1',
        password: '123456',
        isAdmin: true
    },
    {
        id: '2',
        username: 'user1',
        password: '123456',
        isAdmin: false
    }
];

let refreshTokens = [];


const generateAccessToken = (user) => {
    return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION })
}
const generateRefreshToken = (user) => {
    return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION })
}
app.post('/api/refresh', (req, res) => {
    const refreshToken = req.body.token;
    if (!refreshToken) return res.status(401).json('You are not authenticated');
    if (!refreshTokens.includes(refreshToken)) {
        return res.status(403).json('Refresh Token is not valid')
    }
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) console.log(err);
        refreshTokens = refreshTokens.filter(token => token !== refreshToken);

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.push(newRefreshToken);
        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    })

})
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => {
        return u.username == username && u.password === password;
    })
    if (user) {
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        refreshTokens.push(refreshToken);
        res.json({
            username: user.username,
            isAdmin: user.isAdmin,
            accessToken,
            refreshToken
        });
    }
    else {
        res.status(400).json('Username or Password not correct');
    }
})

const verify = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(401).json('Token is not valid');
            }
            req.user = user;
            next();
        })
    } else {
        res.status(401).json('Unauthorized')
    }
}

app.delete('/api/users/:userId', verify, (req, res) => {
    if (req.user.id === req.params.userId || req.user.isAdmin) {
        res.status(200).json('User has been deleted');
    } else {
        res.status(403).json('You are not allowed to delele this user')
    }
})
app.listen(5000, () => {
    console.log('Server is running...');
})
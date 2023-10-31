require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
var cron = require('node-cron');
const routes = require('./routes/index.route');
const bodyParser = require('body-parser');
const { port } = require('./env');
const { makeDb } = require('_helpers/db');
const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');
const path = require('path');
const { STRIPE_SECRET, TRIALDAYS } = require("./env");
const { request } = require("express");
const stripe = require("stripe")(STRIPE_SECRET);
const passport = require('passport');
// const busboy = require('connect-busboy');   // Middleware to handle the file upload https://github.com/mscdex/connect-busboy
const http = require('http').Server(app);
// const https = require('https').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*"
      }
});
const {stripe_restaurant_cronjob} = require('./_helpers/stripe_restaurant_commision')
// var hbs = require('nodemailer-express-handlebars');

// app.use(busboy({
//     highWaterMark: 2 * 1024 * 1024, // Set 2MiB buffer
// }));
// app.engine(
//     'hbs',
//     hbs({
//       defaultLayout: false,
//       partialsDir: __dirname + '/views/email'
//     })
//   );
// app.set("view engine", "hbs");
app.set("view engine", "ejs");
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '/views/')))
app.set('views', __dirname + '/views/email')
app.use(express.static('public'))
app.use('/public', express.static('public'));
app.use('/css',express.static(path.join('node_modules','bootstrap','dist','css')))
app.use(cors());
// var distDir = '../dist/';
/**
 * Serve the basic index.html with upload form
 */
// app.use(express.static(path.join(__dirname, distDir)))
// app.use(/^((?!(api)).)*/, (req, res) => {
//     // res.sendFile(path.join(__dirname, distDir + '/index.html'));
//     res.send("Server is working")
// });


var publicDir = path.join(__dirname,''); 
app.use(express.static(publicDir)); 



app.use(jwt());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if (req.headers["content-type"] === "multipart/form-data") {
        req.body = req.body;
    }
    next();
});

app.use(express.static('public'))
app.use(passport.initialize());
app.use(passport.session());

// api routes
app.use('/', routes);

// global error handler
app.use(errorHandler);

//// Socket.io
io.on('connection', (socket) => {
    // console.log('a user connected');
    var address = socket.handshake.address;
    console.log('New connection from ' + address );
    // socket.on('disconnect', () => {
    //     console.log('user disconnected');
    // });
    socket.on('msgRoute', (data) => {
        io.sockets.emit('message', data);
    });
    interval = setInterval(() => getApiAndEmit(socket), 1000);
    socket.on("disconnect", () => {
        console.log("Client disconnected");
        clearInterval(interval);
    });
});
cron.schedule('0 0 3 * *', () => {
// Stripe commision restaurant corn job //
    stripe_restaurant_cronjob()
})
cron.schedule('0 0 5 * *', () => {
    // Stripe commision restaurant corn job //
        stripe_restaurant_cronjob()
    })
cron.schedule('0 0 7 * *', () => {
        // Stripe commision restaurant corn job //
            stripe_restaurant_cronjob()
})

// Stripe commision restaurant corn job end //
const getApiAndEmit = socket => {
    // console.log('here');
    const response = new Date();
    // Emitting a new message. Will be consumed by the client
    socket.emit("FromAPI", response);
  };


// http.listen(port, 'ipaddress', () => {
//     console.log(`Socket.IO servers running at http://ipaddress:${port}/`);
// });


http.listen(port, '0.0.0.0', () => {
    console.log(`Socket.IO servers running at http://localhost:${port}/`);
    // console.log(`Server listening on port ${port}`);
});


// const server = app.listen(5000, '0.0.0.0', function () {
//     console.log('Server listening on port ' + 5000);
//     const { address, _port } = server.address();
//   console.log(`Listening at http://${address}:${5000}`);
// });
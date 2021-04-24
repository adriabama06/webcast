async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const ChromecastAPI = require('chromecast-api');

var __video;

var chromecast = {
    have: false,  
};

var __chromecast;
var _isplaying = false;

const client = new ChromecastAPI();

client.on('device', async (device) => {

    chromecast = {
        have: true,
        name: device.friendlyName,
        ip: device.host,
    };

    __chromecast = device;

    /*device.play(media, function (err) {
        if (!err) console.log('Playing in your chromecast')
    });*/
});

const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
const transform = require('./transform.js');
const config = require('./config.json');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const PORT = process.env.PORT || config.port;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/admin', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin.html'));
});

app.get('/files', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/files.html'));
});

app.get('/video', async (req, res) => {
    res.sendFile(path.join(__dirname, `files/${__video}`));
});

app.post('/upload', async (req, res) => {
    const form = new formidable.IncomingForm({
        multiples: false,
        encoding: 'utf-8',
        uploadDir: path.join(__dirname, `files`),
        maxFileSize: 4000 * 1024 * 1024,
        keepExtensions: true
    });

    form.parse(req, async (err, fields, files) => {
        if(err) console.log(err);
    });

    form.on('fileBegin', async (name, file) => { //NAME = UPLOAD OR NAME IN HTML FOR THE UPLOAD
        //console.log(name);
    });

    form.on('file', async (name, file) => { //NAME = UPLOAD OR NAME IN HTML FOR THE UPLOAD
        var spl = file.name.split(".");
        const extension = spl.splice(spl.length - 1, spl.length - 1);
        const nname = spl.join(".");

        var newPath = path.join(__dirname, `files/${file.name}`);
        new transform(file.path, path.join(__dirname, `files/${nname}.mp4`))
        .on('start', async (frames) => {
            // START
        })
            
        .on('data', async (data) => {
            io.sockets.emit('server/progress', data);
        })
            
        .on('end', async ({ start, end }) => {
            io.sockets.emit('server/end');
            fs.unlink(file.path, async (err) => {
                if(err) console.log(err);
            });
        });
        res.send('ok');
    });
});

io.on('connection', async (socket) => {
    console.log(`Se conecto el cliente: ${socket.id}, con la ip: ${socket.handshake.address.replace('::ffff:', '')}`);

    socket.on('client/newclient', async (data) => {
        if(data == 'index') {
            if(chromecast.have == true) {
                socket.emit('server/ok', chromecast);
            } else {
                socket.emit('server/ok', {
                    have: false,
                    name: "?",
                    ip: "?",
                });
            };

            /*socket.emit('server/ok', {
                have: chromecast.have == true ? true : false,
                name: `${chromecast.have == true ? chromecast.name : false}`,
                ip: `${chromecast.ip == true ? chromecast.ip : false}`,
            });*/
        };

        if(data == 'files') {
            const files = fs.readdirSync(path.join(__dirname, 'files'));
            if(!files.length) {
                socket.emit('server/ok', false);
            } else {
                socket.emit('server/ok', files);
            };
        };

        if(data == 'admin') {
            socket.emit('server/ok', {
                name: chromecast.name,
                video: __video,
            });
        };
    });


    socket.on('client/loadvideo', async (loadvideo) => {
        __video = loadvideo;
        var mediaURL = `${config.publicip}:${config.port}/video`;
        __chromecast.play(mediaURL, async (err) => {
            if (!err) console.log('Playing in your chromecast');
            await sleep(1000);
            __chromecast.pause();
            __chromecast.seekTo(0);
            __chromecast.setVolume(1.0);
        });
    });

    socket.on('client/delete', async (loadvideo) => {
        fs.unlink(path.join(__dirname, `files/${loadvideo}`), async (err) => {
            if(err) console.log(err);
        });
    });

    socket.on('pause', async () => {
        __chromecast.pause();
    });

    socket.on('resume', async () => {
        __chromecast.resume();
    });

    socket.on('stop', async () => {
        __chromecast.stop();
        await sleep(2000);
        __chromecast.close();
    });

    socket.on('skip', async (data) => {
        __chromecast.seekTo(data);
    });

});


/* <-- API v0 ZONE not finished --> */

app.get('/api/v0/:info', async (req, res) => {
    var json = {};
    if(req.params.info == 'chromecast') {
        if(chromecast.have == false) {
            json = {
                err: "No hay chromecast!",
            };
        } else {
            json = {
                name: chromecast.name,
                ip: chromecast.ip,
                realname: __chromecast.name,
                isplaying: _isplaying,
            };
        };
    };
    if(json.err) {
        res.redirect(`/api/v0/?err=${json.err}`);
        return;
    };
    res.send(json);
    return;
});

app.get('/api/v0/', async (req, res) => {
    var json = {
        error: "Necesitas especificar a donde quieres ir",
        example: "/api/v0/chromecast",
    };

    if(req.query.err) {
        json.error = req.query.err;
    };

    res.send(json);
    return;
});

server.listen(PORT, async () => {
    console.log(`Server running in http://localhost:${PORT}`)
});
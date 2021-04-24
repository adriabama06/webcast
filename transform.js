const child_process = require('child_process');
const { EventEmitter } = require('events');
module.exports = class extends EventEmitter {
    constructor(input, output) {
        super();
        this.frames = 0;
        this.endframes = 0;
        this.main(input, output);
    };

    async __sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    };

    async main(input, output) {
        child_process.exec(`ffmpeg -i ${input} -map 0:v:0 -c copy -f null -`).stderr.on('data', async (data) => {
            const args = data.toString().split('=');
            if(!args || !args.length) {
                return;
            };
            var index = false;
            for(const arg of args) {
                var text = arg.replace(' ', '');
                if(text.includes('frame')) {
                    index = args.indexOf(arg);
                };
            };
            if(isNaN(parseInt(args[index+1]))) {
                return;
            };
            this.frames = parseInt(args[index+1].replace(/\sfps/g, ''));
            //console.log('!-! ' + args[index+1] + ' !-!');
        });
        await this.__sleep(2000);
        this.emit('start', this.frames);
        // Nvidia
        // ffmpeg -i ${input} -map 0:0 -map 0:1 -acodec mp3 -vcodec h264_nvenc -profile high -preset medium ${output}
        child_process.exec(`ffmpeg -i ${input} -map 0:0 -map 0:1 -acodec mp3 -vcodec h264_nvenc -profile high -preset medium ${output}`).stderr.on('data', async (data) => {
            const args = data.toString().split('=');
            if(!args || !args.length) {
                return;
            };
            var index = false;
            for(const arg of args) {
                var text = arg.replace(' ', '');
                if(text.includes('frame')) {
                    index = args.indexOf(arg);
                };
            };
            if(isNaN(parseInt(args[index+1]))) {
                return;
            };
            var f = parseInt(args[index+1].replace(/\sfps/g, ''));
            this.endframes = f;
            this.emit('data', Math.floor((f/this.frames) * 100));
        }).on('close', async () => {
            this.emit('end', {
                start: this.frames,
                end: this.endframes,
            });
        });
    };
};
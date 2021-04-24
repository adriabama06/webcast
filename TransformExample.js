const transform = require('./transform.js');
const { join } = require('path');

new transform(join(__dirname, 'VIDEO.MP4 / .MKV / ...'), join(__dirname, 'out.mp4'))

.on('start', async (frames) => {
    console.log('\nHa iniciado ' + frames);
})

.on('data', async (data) => {
    console.log('\n\nTransformExample.js => ' + data + '%');
})

.on('end', async ({ start, end }) => {
    console.log(start + " : " + end);
});
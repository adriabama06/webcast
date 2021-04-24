const transform = require('./transform.js');
const { join } = require('path');

new transform(join(__dirname, '2020-12-19_20-42-19.mkv'), join(__dirname, '2020-12-19_20-42-19.mp4'))

.on('start', async (frames) => {
    console.log('\nHa iniciado ' + frames);
})

.on('data', async (data) => {
    console.log('\n\ntemp.js => ' + data + '%');
})

.on('end', async ({ start, end }) => {
    console.log(start + " : " + end);
});
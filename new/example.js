const transform = require('./transform.js');
const { join } = require('path');

new transform(join(__dirname, 'files/upload_fb5271d50f299d3063abe94da0796162.mp4'), join(__dirname, 'files/as2.mp4'))

.on('start', async (frames) => {
    console.log('\nHa iniciado ' + frames);
})

.on('data', async (data) => {
    console.log('\n\ntemp.js => ' + data + '%');
})

.on('end', async ({ start, end }) => {
    console.log(start + " : " + end);
});

import express from 'express';
import {init} from './init.js';

console.log('Starting server...');
await init()
    .then(() => {
        console.log('Initialization complete');
    })
    .catch(err => {
        console.error('Error initializing: ' + err);
    });

const app = express();
app.use(express.static('public'));
// app.use(express.static('dist'))

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
    });
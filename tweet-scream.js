const needle = require('needle');
const chalk = require('chalk');
const log = console.log;
const write = require('log-to-file');
const timestamp = require('time-stamp');

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamURL = 'https://api.twitter.com/2/tweets/search/stream';

require('dotenv').config()

// Create .env File With Your Twitter Bearer Token
const token = process.env.BEARER_TOKEN 

// Change Value to Catch Different Keywords in Stream
const rules = [{
        'value': 'bitcoin',
    }
];

function streamConnect() {

    const stream = needle.get(streamURL, {
        headers: {
            "User-Agent": "v2FilterStreamJS",
            "Authorization": `Bearer ${token}`
        },
        timeout: 20000
    });

    stream.on('data', data => {
        try {
            const json = JSON.parse(data);
            log(chalk.blue('-'.repeat(process.stdout.columns)))
            log(chalk.grey(timestamp.utc('YYYY/MM/DD:mm:ss')));
            log(chalk.green("https://twitter.com/web/status/" + json.data.id + "\n"));
            log(chalk.yellow(json.data.text));
            write("https://twitter.com/web/status/" + json.data.id + "\n" + json.data.text + "\n", 'stream.txt')
        } catch (e) {
            // Keep alive signal received. Do nothing.
        }
    }).on('error', error => {
        if (error.code === 'ETIMEDOUT') {
            stream.emit('timeout');
        }
    });

    return stream;

}


(async () => {
    const filteredStream = streamConnect();
    let timeout = 0;
    filteredStream.on('timeout', () => {
        // Reconnect on error
        console.warn('A connection error occurred. Reconnecting…');
        setTimeout(() => {
            timeout++;
            streamConnect();
        }, 2 ** timeout);
        streamConnect();
    })

})();

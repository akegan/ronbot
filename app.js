if(process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV !== 'production') require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT;
const bodyParser = require('body-parser');
const axios = require('axios');
const SLACKBOT_TOKEN = process.env.SLACKBOT_TOKEN;
const CIRCLECI_API_TOKEN = process.env.CIRCLECI_API_TOKEN;

const postSlackMessage = function(url, postBody, successCallback, errorCallback) {
  axios.post(url, postBody, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SLACKBOT_TOKEN
    }
  }).then((response) => {
    if(successCallback) {
      successCallback(response);
    }
  }).catch((err) => {
    if(errorCallback) {
      errorCallback();
    }
  })
}

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', (req, res) => {
  res.send('you did it');
});

// the route for slack interactions (like with attachment blocks with buttons)
app.post('/slack-interactive', (req, res) => {
  let payload = JSON.parse(req.body.payload);
  res.sendStatus(200);
  if(payload.actions[0].value === 'sfgov_content_sandbox_yes') {
    let userId = payload.user.id;
    let statusThreadTs = payload.message.ts;
    let statusChannel = payload.container.channel_id;
    // first check to see that the build is not running

    axios.post(payload.response_url, {
      replace_original: "true",
      parse: "none",
      text: 'SF.gov content sandbox building.\nThis will take a few minutes.  I\'ll periodically update you here.'
    }).then((response) => {
      axios.post('https://circleci.com/api/v1.1/project/github/SFDigitalServices/ci-jobs/tree/sfgov?circle-token=' + CIRCLECI_API_TOKEN,
        {build_parameters: { CIRCLE_JOB: 'build_sfgov_content_multidev'} }, {
          headers: {
            'Content-Type': 'application/json',
          }
        }).then((response) => {
          let buildNum = response.data.build_num;
          let checkStatus = setInterval(() => {
            axios.get('https://circleci.com/api/v1.1/project/github/SFDigitalServices/ci-jobs/' + buildNum + '?circle-token=' + CIRCLECI_API_TOKEN)
              .then((response) => {
                let status = response.data.status;
                postSlackMessage('https://slack.com/api/chat.postMessage', {
                  token: SLACKBOT_TOKEN,
                  channel: statusChannel,
                  // "thread_ts": statusThreadTs,
                  parse: 'none',
                  text: '<@' + userId + '> sf.gov content sandbox build status: `' + status + '`'
                });
                if(status === 'success') {
                  setTimeout(() => {
                    clearInterval(checkStatus);
                    postSlackMessage('https://slack.com/api/chat.postMessage', {
                      token: SLACKBOT_TOKEN,
                      channel: statusChannel,
                      text: '<@' + userId + '> <https://content-sfgov.pantheonsite.io|sf.gov content sandbox> completed successfully'
                    });
                  },500);
                }
              });
            }, 150000); // check every 2.5 minutes
      }).catch((err) => {
        console.log(err);
      });
    });
  }
  if(payload.actions[0].value === 'sfgov_content_sandbox_no') {
    axios.post(payload.response_url, {
      replace_original: true,
      text: '...if given the choice between doing something and nothing, I\'d choose to do nothing.\nsf.gov content sandbox will not be built'
    });
  }
});

app.post('/slack-events', (req, res) => {
  if(req.body.challenge) {
    res.send(req.body.challenge); // use this for verifying request url for slack event subscriptions
  } else {
    let payload = req.body;
    res.sendStatus(200);
  
    if(payload.event.type === 'app_mention') {
      if(payload.event.text.includes('quote')) {
        axios.get('http://ron-swanson-quotes.herokuapp.com/v2/quotes').then((response) => {
          let quote = response.data[0];
          postSlackMessage('https://slack.com/api/chat.postMessage', {
            token: SLACKBOT_TOKEN,
            channel: payload.event.channel,
            text: '> ' + quote
          });
        })
      }
      else if(payload.event.text.includes("sfgov-content-sandbox")) {
        postSlackMessage('https://slack.com/api/chat.postMessage', {
          token: SLACKBOT_TOKEN,
          channel: payload.event.channel,
          thread_ts: payload.event.event_ts,
          text: 'Let\'s chat.  I\'ll send you a direct message.'
        })
        postSlackMessage('https://slack.com/api/chat.postMessage', {
          "token": SLACKBOT_TOKEN,
          "channel": payload.event.user, // direct message user
          "user": payload.event.user,
          "as_user": true,
          "attachments": [
            {
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Hello <@" + payload.event.user +">.  You asked me to manually (re)create the <https://content-sfgov.pantheonsite.io|sf.gov content sandbox> on pantheon.  This will wipe out the existing sandbox and create a new one by cloning everything in the current production environment.\n\nAre you sure you want to do this?"
                  }
                },
                {
                  "type": "actions",
                  "elements": [
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Yes"
                      },
                      "style": "primary",
                      "value": "sfgov_content_sandbox_yes"
                    },
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "No"
                      },
                      "style": "danger",
                      "value": "sfgov_content_sandbox_no"
                    }
                  ]
                }
              ]
            }
          ]
        });
      }
      else {
        postSlackMessage('https://slack.com/api/chat.postMessage', {
          token: SLACKBOT_TOKEN,
          channel: payload.event.channel,
          text: 'Help has arrived.\n' +
            '>>>' + 
            '`@ronbot sfgov-content-sandbox` - (re)create content sandbox on pantheon based on production\n' +
            '`@ronbot quote` - be prepared to receive wisdom\n' +
            '`@ronbot help` - this menu\n'
        });
      }
    } 
  }
});

app.listen(port, () => console.log(`app listening on port ${port}!`));
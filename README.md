ronbot is a slackbot that does things

```
@ronbot sfgov-content-sandbox - (re)create content sandbox on pantheon based on production
@ronbot acronym abc - if found, unfurls the acronym abc
@ronbot quote - be prepared to receive wisdom
@ronbot help - this menu
```

# Local development

1. Get added as a collaborator for ronbot at https://api.slack.com/apps
2. Get ngrok
3. Clone this repo, install dependencies, create .env file, start the app
4. Update the event subscriptions url and interactive components request url to your local ngrok url
5. Read lots of docs: https://api.slack.com/#read\_the\_docs

## Get added as a collaborator
You'll need to be added as a collaborator for ronbot in order to see the settings on https://api.slack.com/apps.  Talk to a slack admin or this bot's initial creator (ant) or something.

For local development, the most important thing is to be able to update the **Event Subscriptions** request url.

## ngrok
ngrok (pronounced "en-grok") allows you to expose a web server running on your local machine to the internet.

Get ngrok: https://ngrok.com/download

Once downloaded, open a terminal and start it up:

```
$ ngrok http 4390 # this port number can be anything you like
```

And you should see this:

```
ngrok by @inconshreveable                                                                                                                   (Ctrl+C to quit)
                                                                                                                                                            
Session Status                online                                                                                                                        
Account                       Anthony Kong (Plan: Free)                                                                                                     
Version                       2.3.34                                                                                                                        
Region                        United States (us)                                                                                                            
Web Interface                 http://127.0.0.1:4040                                                                                                         
Forwarding                    http://9cd5682e.ngrok.io -> http://localhost:4390                                                                             
Forwarding                    https://9cd5682e.ngrok.io -> http://localhost:4390                                                                            
                                                                                                                                                            
Connections                   ttl     opn     rt1     rt5     p50     p90                                                                                   
                              2       0       0.02    0.01    2.78    5.01        
```

**The port you use when starting ngrok will the same you assign to the PORT var when you create your .env file**

## Clone this repo, install dependencies, create .env file start the app

```
$ git clone git@github.com:SFDigitalServices/ronbot.git
$ npm install
```

Create a `.env` file in the root of the project.  It should look like this:

```
SLACKBOT_TOKEN=abcdefg12345678 # get this info from https://api.slack.com/apps/AM11J7ULV/oauth
CIRCLECI_API_TOKEN=abcdefg12345678 # get this info from https://circleci.com/account/api
PORT={port number from nrgok above}
```

Start the app

```
$ npm start
```

Now when you go to a browser at the urls that ngrok gives you (https://9cd5682e.ngrok.io) you should get a 200 response.  Any other status means something went wrong.

## Update the event subscriptions url and interactive components request url to your local ngrok url

Go to https://api.slack.com/apps/AM11J7ULV/event-subscriptions and update the Event Subscriptions url to the ngrok url from the steps above (in this case: https://9cd5682e.ngrok.io/slack-events).  Do the same for Interactive Components request url: https://api.slack.com/apps/AM11J7ULV/interactive-messages

Any interactions with ronbot should now be hitting your local environment.  

Be warned - if you forget to update the request url to the deployed app or shut off your computer, ronbot will be unresponsive to anyone trying to interact with him.

## Read lots of docs

The slack api documentation is comprehensive and pretty updated.  https://api.slack.com/#read\_the\_docs
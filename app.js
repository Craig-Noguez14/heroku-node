/**
 * Created by Craig on 10/31/2015.
 */
var fs = require('fs');
var Steam = require('steam');
var express = require('express');
var SteamTradeOffers = require('steam-tradeoffers');
// if we've saved a server list, use it
if (fs.existsSync('servers')) {
    Steam.servers = JSON.parse(fs.readFileSync('servers'));
}

var app = require('http').createServer();
var prerender = module.exports = express();


// Here we require the prerender middleware that will handle requests from Search Engine crawlers
// We set the token only if we're using the Prerender.io service
prerender.use(require('prerender-node').set('prerenderToken', 'YL3T6gRYYhAYhOIVzBPd'));
prerender.use(express.static("public"));

// This will ensure that all routing is handed over to AngularJS
prerender.get('*', function (req, res) {
    res.sendfile('./public/index.cshtml');
});

var io = require('socket.io')(app);
prerender.listen(8081);
app.listen(8080);


var admin = '76561198110421992'; //craigles61493
//var admin = '76561198044742498'; // Symptum put your steamid here so the bot can send you trade offers
//var admin = '76561198207211873'; //Newwow14@gmail.com - Bot1
var steam = new Steam.SteamClient();
var offers = new SteamTradeOffers();

steam.logOn({
    accountName: 'craigles61493',
    password: 'summer#14',
    authCode: 'XY93Y',
    shaSentryfile: (fs.existsSync('sentryfile') ? fs.readFileSync('sentryfile') : undefined)
});

steam.on('loggedOn', function () {
    console.log('Logged in!');
    steam.setPersonaState(Steam.EPersonaState.Online); // to display your steam's status as "Online"
    //steam.setPersonaName('TestNodesteam'); // to change its nickname
});

steam.on('sentry', function (sentryHash) {
    require('fs').writeFile('sentryfile', sentryHash, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('Saved sentry file hash as "sentryfile"');
        }
    });
});

steam.on('servers', function (servers) {
    fs.writeFile('servers', JSON.stringify(servers));
});

/* io.on('connection', function (socket) {
 socket.emit('news', { hello: 'world' });
 socket.on('my other event', function (data) {
 console.log(data);
 });
 });*/
steam.on('webSessionID', function (sessionID) {
    steam.webLogOn(function (newCookie) {
        offers.setup({
            sessionID: steam._sessionID,
            webCookie: newCookie
        }, function (err) {
            if (err) {
                throw err;
            }
        });
    });

    io.on('connection', function (socket) {
        socket.on('trade', function (itemClassId, partnerSteamId) {
            steam.webLogOn(function (data) {
                offers.setup({
                    "sessionID": sessionID,
                    "webCookie": data
                }, function (err) {
                    if (err) {
                        throw err;
                    }
                    offers.loadMyInventory({
                        appId: 570,
                        contextId: 2
                    }, function (err, items) {
                        var item;
                        // picking first tradable item
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].classid == itemClassId) {
                                item = items[i];
                                break;
                            }
                        }
                        // if there is such an item, making an offer with it
                        if (item) {
                            offers.makeOffer({
                                partnerSteamId: partnerSteamId,
                                itemsFromMe: [
                                    {
                                        appid: 570,
                                        contextid: 2,
                                        //amount: 1,
                                        assetid: item.id
                                    }
                                ],
                                itemsFromThem: [],
                                message: 'This is test'
                            }, function (err, response) {
                                if (err) {
                                    throw err;
                                }
                                console.log(response);
                                socket.emit('status', { status: response });
                            });
                        }
                        else {
                            socket.emit('status', { status: 'error' });
                        }
                    });
                });
            });
        });
    });
});

/*steam.on('webSessionID', function (sessionID) {
 steam.webLogOn(function (newCookie) {
 offers.setup({
 sessionID: sessionID,
 webCookie: newCookie
 }, function (err) {
 if (err) {
 throw err;
 }
 offers.loadMyInventory({
 appId: 570,
 contextId: 2
 }, function (err, items) {
 var item;
 // picking first tradable item
 for (var i = 0; i < items.length; i++) {
 if (items[i].tradable) {
 item = items[i];
 break;
 }
 }
 // if there is such an item, making an offer with it
 if (item) {
 offers.makeOffer({
 partnerSteamId: admin,
 itemsFromMe: [
 {
 appid: 570,
 contextid: 2,
 amount: 1,
 assetid: item.id
 }
 ],
 itemsFromThem: [],
 message: 'This is test'
 }, function (err, response) {
 if (err) {
 throw err;
 }
 console.log(response);
 });
 }
 });
 });
 });
 });*/

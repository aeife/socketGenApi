var express = require('express');
var http = require('http');
var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.use(express.logger('dev'));
    app.use(express.static(__dirname));
});
var server = http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);
var api = require('./websocketApi.js');
var sga = require('./socketGenApi.js').init(api);

io.sockets.on('connection', function (socket) {
    socket.emit(sga.news, { hello: 'world' });
    socket.on(sga.myOtherEvent, function (data) {
        console.log(data);
    });
});
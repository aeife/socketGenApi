

    var serverGeneration = {
        init: function(obj){
            if (obj instanceof Array){
                var tempObj = obj[0];
                for (var i = 1; i < obj.length; i++){
                    if (obj[i]) {
                        tempObj = concatObj(tempObj, obj[i]);
                    }
                }
                obj = tempObj;
            }

            return this.generateServerObject(obj);
        },
        generateServerObject: function(obj){
            var self = this;
            console.log('generate');
            var msg = '';
            self.iterateServer(obj, msg);

            return obj;
        },
        iterateServer: function(obj, msg){
            var self = this;
            for (var property in obj) {
                if (obj.hasOwnProperty(property)) {
                    if (typeof obj[property] == 'object' && !obj[property].emit && !obj[property].get && !obj[property].on && Object.keys(obj[property]).length != 0) {
                        // continue iterating till at the deepest message level
                        self.iterateServer(obj[property], msg ? msg + ':' + property : property);
                    } else {
                        // process found end attribute
                        var message = msg ? msg + ':' + property : property;
                        // attach message string to object or generate attach function to construct message at runtime
                        if ((obj[property].get && obj[property].get.attach) ||
                            (obj[property].on && obj[property].on.attach) ||
                            (obj[property].emit && obj[property].emit.attach)) {

                            obj[property] = generateAttachFunction(message);
                        } else {
                            obj[property] = message;
                        }
                    }
                }
            }
        }
    };

    function concatObj(obj1, obj2){
        for (var attrname in obj2){
            obj1[attrname] = obj2[attrname];
        }

        return obj1;
    }

    function generateAttachFunction(msg){
        return function(param){
            if (param){
                return msg + ':' + param;
            } else {
                return msg;
            }

        };
    }

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined'){
        module.exports = serverGeneration;
    } else {


                function on(msgname, callback, onlyForListeners){


                    if (onlyForListeners){
                        if (!socket.socketObj().$events[msgname]){
                            // first listener of that type: subscribe
                            socket.emit('subscribe', {msg: msgname});
                        }

                    }

                    socket.on(msgname, callback);

                    return {
                        forRoute: function(){
                            var self = this;
                            $rootScope.$on('$routeChangeSuccess', function() {
                                self.stop();
                            });
                        },
                        stop: function(){
                            console.log("SocketAPI: stop listener for " + msgname);
                            socket.removeListener(msgname, callback);

                            if (onlyForListeners){
                                if (!socket.socketObj().$events[msgname]){
                                    // last listener of that type: unsubscribe
                                    socket.emit('unsubscribe', {msg: msgname});
                                }

                            }
                        },
                        removeAll: function(){
                            // dont use, each module should remove its own specific listeners
                            socket.removeAllListeners(msgname);
                        },
                        once: function(){
                            // remove normal listener
                            this.stop();
                            // @TODO: can message can be emitted in between?

                            // add once listener
                            socket.once(msgname, callback);

                            return this;
                        },
                        whileLoggedIn: function() {
                            var self = this;
                            socket.once('user:logout', function(){
                                self.stop();
                            });
                        }
                    };
                }

                function once(msgname, callback){
                    socket.once(msgname, callback);
                }

                function emit(msgname, data){
                    socket.emit(msgname, data);
                }

                function get(msgname, callback, data, attach){
                    if (data){
                        emit(msgname, data);
                    } else {
                        emit(msgname);
                    }

                    // @TODO: always emit data? like socketgenapi.get.user.logout({}, function...)
                    // @TODO: always send error as first parameter
                    if (data && attach){
                        // attach a string to the listener message
                        once(msgname + ':' + data[attach], callback);
                    } else {
                        once(msgname, callback);
                    }
                }

                function processSocketApi (obj){
                    var msg = "";
                    iterate(obj, msg);
                    return obj;
                }

                function generateOn(m, opts){
                    if (opts && opts.attach){
                        return function(msg, callback){
                            return on(m + ':' + msg, callback, opts.onlyForListeners);
                        };
                    } else {
                        return function(callback){
                            return on(m, callback, opts.onlyForListeners);
                        };
                    }
                }

                function generateGet(m, opts){
                    if (opts && opts.emitData) {
                        return function(data, callback){
                            get(m, callback, data, opts.attach);
                        };
                    } else {
                        return function(callback){
                            get(m, callback);
                        };
                    }
                }

                function generateEmit(m){
                    return function(data){
                        emit(m, data);
                    };
                }

                function iterate(obj, msg) {
                    for (var property in obj) {
                        if (obj.hasOwnProperty(property)) {
                            if (typeof obj[property] == "object" && property !== 'emit' && property !== 'get' && property !== 'on' && Object.keys(obj[property]).length != 0) {
                                // continue iterating till at the deepest message level
                                iterate(obj[property], msg ? msg + ":" + property : property);
                            } else {
                                // process found end attribute
                                if (property === "get"){

                                    obj[property] = generateGet(msg, obj[property]);

                                    // every get also includes single on
                                    obj['on'] = generateOn(msg, obj['on']);

                                } else if (property === "on"){

                                    obj[property] = generateOn(msg, obj[property]);

                                } else if (property === "emit"){

                                    obj[property] = generateEmit(msg);

                                }
                            }
                        }
                    }
                }



    }





var sga = {
    init: function(obj){
        if (obj instanceof Array){
            var tempObj = obj[0];
            for (var i = 1; i < obj.length; i++){
                if (obj[i]) {
                    tempObj = concatObj(tempObj, obj[i]);
                }
            }

            obj = tempObj;
        }

        return processSocketApi(obj);
    }
};
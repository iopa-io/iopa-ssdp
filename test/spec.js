/*
 * Copyright (c) 2015 Internet of Protocols Alliance (IOPA)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
global.Promise = require('bluebird');

const iopa = require('iopa'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    udp = require('iopa-udp'),
    IopaSSDP = require('../index.js');
   
var should = require('should');

var numberConnections = 0;

const iopaMessageLogger = require('iopa-logger').MessageLogger

describe('#CoAP Server()', function() {
  
  var server, client;
  var events = new EventEmitter();

  before(function (done) {

    var app = new iopa.App();

    app.use(iopaMessageLogger);
    app.use(IopaSSDP);

    app.use(function (context, next) {
       context.log.info("[TEST] SERVER APP USE " + context["iopa.Method"] + " " + context["iopa.Headers"]["NTS"]);
       setTimeout(function () { events.emit("data", context); }, 10);
      return next();

   });
                                 
    server = udp.createServer(app.build());
  
    if (!process.env.PORT)
      process.env.PORT = iopa.constants.IOPA.PORTS.COAP;

    server.listen(process.env.PORT, process.env.IP).then(function () {
      setTimeout(function () { events.emit("SERVER-UDP"); }, 200);
         done();
   
    });
    
  });
    
   it('should listen via UDP', function(done) {   
           server.port.should.equal(5683);
           done();
    });
    
         
   it('should connect via UDP', function (done) {
     server.connect("coap://127.0.0.1")
       .then(function (cl) {
         client = cl;
         client["server.RemotePort"].should.equal(5683);
         done();
       });
   });

   it('should SEND ALIVE via SSDP', function (done) {
    client["server.Capabilities"]["urn:io.iopa:ssdp"].alive()
       .then(function () {
           done();
       });
   });
    
   it('should receive ALIVE', function (done) {
     events.once("data", function (context) {
       context["iopa.Headers"]["NTS"].should.equal("ssdp:alive")
       done();
     });
   });

   it('should close', function(done) {
       server.close().then(function(){
         console.log("[TEST] Server Closed");
         done();});
    });
    
});

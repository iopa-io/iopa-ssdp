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

const iopa = require('iopa')
  
const IopaUDP =  require('iopa-udp'),
    IopaSSDP = require('./index.js'),
    IopaMessageLogger = require('iopa-logger').MessageLogger;
    
const constants = iopa.constants,
  IOPA = constants.IOPA,
  SERVER = constants.SERVER,
   SSDP = IopaSSDP.protocol.constants
  
var app = new iopa.App();
app.use(IopaUDP);
app.use(IopaMessageLogger);
app.use(IopaSSDP);

app.use(function (context, next) {
     context.log.info("[TEST] SERVER APP USE " + context["iopa.Method"] + " " + context["iopa.Headers"]["NTS"]);
     return next();
});

var server = app.createServer("udp:");
server.listen()
  .then(function () {
    console.log("server is on port" + server["server.LocalPort"]);
      return server.connect("ssdp://localhost:" + server["server.LocalPort"]);})
  .then(function(client) {
      return client[SERVER.Capabilities][SSDP.CAPABILITY].alive();})
  
     
  
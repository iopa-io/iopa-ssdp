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
  iopaHttp = require('iopa-http'),
  iopaStream = require('iopa-common-stream'),
  iopaHttp_inboundParseMonitor = iopaHttp.protocol.inboundParseMonitor,
  iopaHttp_outboundWrite = iopaHttp.protocol.outboundWrite;
  
const constants = iopa.constants,
  IOPA = constants.IOPA,
  SERVER = constants.SERVER,
  HTTP = iopaHttp.protocol.constants,
  SSDP = require('../common/constants.js').SSDP,

  packageVersion = require('../../package.json').version;

 /**
 * IOPA Middleware for UPNP Simple Service Discovery Protocol (SSDP) protocol
 *
 * @class IopaSsdp
 * @this app.properties  the IOPA AppBuilder Properties Dictionary, used to add server.capabilities
 * @constructor
 * @public
 */
function IopaSsdp(app) {
  app.properties[SERVER.Capabilities][SSDP.CAPABILITY] = {};
  app.properties[SERVER.Capabilities][SSDP.CAPABILITY][SERVER.Version] = packageVersion;
  app.properties[SERVER.Capabilities][SSDP.CAPABILITY][IOPA.Protocol] = SSDP.PROTOCOL;
  
  if (!(HTTP.CAPABILITY in app.properties[SERVER.Capabilities]))
  app.properties[SERVER.Capabilities][HTTP.CAPABILITY] = {};
  app.properties[SERVER.Capabilities][HTTP.CAPABILITY][SERVER.Version] = packageVersion;
  app.properties[SERVER.Capabilities][HTTP.CAPABILITY][IOPA.Protocol] = HTTP.PROTOCOL;
  
  this.app = app;
   this._factory = new iopa.Factory();
 }
 
/**
 * channel method called for each inbound connection
 *
 * @method channel
 * @this IopaSsdp 
 * @param channelContext IOPA context properties dictionary
 * @param next the next IOPA AppFunc in pipeline 
 */
IopaSsdp.prototype.channel = function IopaSsdp_channel(channelContext, next) { 
    channelContext[IOPA.Scheme] = SSDP.SCHEME;
    
    channelContext[IOPA.Events].on(IOPA.EVENTS.Request, function(context){
       context[IOPA.MessageId]  = context[IOPA.MessageId] || context.getHeader('S');
        return next.invoke(context);
        // evaluate context.using(next.invoke) here instead 
    })
    
    channelContext[IOPA.Events].on(IOPA.EVENTS.Response, function(context){
      context[IOPA.Method] = null;
      context[IOPA.MessageId]  = context[IOPA.MessageId] || context.getHeader('S');  
    })
    
    return next().then(iopaHttp_inboundParseMonitor.bind(this, channelContext, channelContext))
}

/**
 * invoke method called for each inbound request message
 * 
 * @method invoke
 * @this IopaSsdp 
 * @param context IOPA context properties dictionary
 * @param next the next IOPA AppFunc in pipeline 
 */
IopaSsdp.prototype.invoke = function IopaHttp_invoke(context, next) {
    context[SERVER.Capabilities][SSDP.CAPABILITY].respond = IopaSsdp_respond.bind(this, context);
    context.response[IOPA.Body].once("finish", context.response.dispatch);
    
    return next()
}

/**
 * @method connect
 * @this IopaSsdp 
 * @param context IOPA context properties dictionary
 * @param next the next IOPA AppFunc in pipeline 
 */
IopaSsdp.prototype.connect = function IopaSsdp_connect(channelContext, next) {
  channelContext[SERVER.Capabilities][SSDP.CAPABILITY].alive = this._alive.bind(this, channelContext);
  channelContext[SERVER.Capabilities][SSDP.CAPABILITY].bye = this._bye.bind(this, channelContext);
  channelContext[SERVER.Capabilities][SSDP.CAPABILITY].update = this._update.bind(this, channelContext);
  channelContext[SERVER.Capabilities][SSDP.CAPABILITY].search = this._search.bind(this, channelContext);
  
  return next();
};


/**
 * @method create
 * @this IopaSsdp 
 * @param context IOPA context properties dictionary
 * @param next the next IOPA AppFunc in pipeline 
 */
IopaSsdp.prototype.create = function IopaSsdp_create(context) {
    context[IOPA.Body] = new iopaStream.OutgoingStream();
    context[IOPA.Body].once("finish", context.dispatch); 
  
    return context;
};


/**
 * @method dispatch
 * @this IopaSsdp 
 * @param context IOPA context properties dictionary
 * @param next the next IOPA AppFunc in pipeline 
 */
IopaSsdp.prototype.dispatch = function IopaSsdp_dispatch(context, next) {
  console.log("DISPTACH");
     context[IOPA.Events].on(IOPA.EVENTS.Response, this._invokeOnResponse.bind(this, context));
  
     return next().then(function () {
        context[HTTP.ShouldKeepAlive] = false;
        context.setHeader('Host', context.getHeader('Host') ||  SSDP.MULTICASTIPV4 + ":" + SSDP.PORT);
        context.setHeader('Cache-Control', context.getHeader('Cache-Control') ||   SSDP.MAX_AGE);
        return iopaHttp_outboundWrite(context);
     });
};

/**
 * @method _invokeOnResponse
 * @param context IOPA request context dictionary
 * @param responseContext IOPA responseContext context dictionary
 * @param next   IOPA application delegate for the remainder of the pipeline
 */
IopaSsdp.prototype._invokeOnResponse = function IopaSsdp_invokeOnResponse(context, responseContext) {
    if (context[SERVER.Capabilities][SSDP.CAPABILITY][SSDP.OBSERVE]) {
        context[SERVER.Capabilities][SSDP.CAPABILITY][SSDP.OBSERVE](responseContext);
    }
};

// PRIVATE METHODS

IopaSsdp.prototype._alive = function (channelContext, values) {
  return channelContext.create() 
    .setHeader('NTS', SSDP.NOTIFY_TYPES.ALIVE)
    .fn(IopaSsdp_addNotifyHeaders)
    .complete()
};

IopaSsdp.prototype._bye = function (channelContext, values) {
  return channelContext.create()
    .setHeader('NTS', SSDP.NOTIFY_TYPES.BYE)
    .fn(IopaSsdp_addNotifyHeaders)
    .complete()
};

IopaSsdp.prototype._update = function (channelContext, values) {
    return channelContext.create()
    .setHeader('NTS', SSDP.NOTIFY_TYPES.UPDATE)
    .fn(IopaSsdp_addNotifyHeaders)
    .complete()
};

function IopaSsdp_addNotifyHeaders(context) {
    context[IOPA.Method] = SSDP.METHODS.NOTIFY;
    context[IOPA.Path] = "*";
    context[IOPA.Protocol] = IOPA.PROTOCOLS.HTTP;
    context.setHeader('Host', context.getHeader('Host') ||  SSDP.MULTICASTIPV4 + ":" + SSDP.PORT);
    context.setHeader('Cache-Control', context.getHeader('Cache-Control') ||   SSDP.MAX_AGE);
    return context;
};

IopaSsdp.prototype._search = function (channelContext, values, callback) {
  var context = channelContext.create("*", values);
  context[IOPA.Method] = SSDP.METHODS.MSEARCH;
  context[IOPA.Protocol] = IOPA.PROTOCOLS.HTTP;
  iopa.util.shallow.mergeContext(context, values);
  context[IOPA.MessageId] = context.getHeader('S');

  context.setHeader('Host', context.getHeader('Host') || SSDP.MULTICASTIPV4 + ":" + SSDP.PORT);
  context.setHeader('MAN', context.getHeader('MAN') || SSDP.MAN_TYPES.DISCOVER);
  context.setHeader('MX', context.getHeader('MX') || SSDP.MX);
  context[SERVER.Capabilities][SSDP.CAPABILITY][SSDP.OBSERVE] = callback;
  return context.using(function (context) {

    setTimeout(function () {
      context[SERVER.CancelTokenSource].cancel();
    }, (context.getHeader('MX') * 1000));

    return context.dispatch().then(
      new Promise(function (resolve, reject) {
        channelContext[IOPA.CancelToken].onCancelled(resolve);
        context[IOPA.CancelToken].onCancelled(resolve);
      }));
  });
};
 
 /**
 * Private method to send response packet
 * Triggered on data or finish events
 * 
 * @method _ssdpSendResponse
 * @object ctx IOPA context dictionary
 * @private
 */
function IopaSsdp_respond(originalContext, values) {
  var context = originalContext.create();
  context[IOPA.Protocol] = IOPA.PROTOCOLS.HTTP;
  context.setHeader('EXT', "");
  context.setHeader('Cache-Control', SSDP.MAX_AGE);
  iopa.util.shallow.mergeContext(context, values);
  return context.complete();
 };
 
 module.exports = IopaSsdp;
 
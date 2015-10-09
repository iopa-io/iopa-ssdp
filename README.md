# [![IOPA](http://iopa.io/iopa.png)](http://iopa.io)<br> iopa-ssdp

[![Build Status](https://api.shippable.com/projects/TBD/badge?branchName=master)](https://app.shippable.com/projects/TBD) 
[![IOPA](https://img.shields.io/badge/iopa-middleware-99cc33.svg?style=flat-square)](http://iopa.io)
[![limerun](https://img.shields.io/badge/limerun-certified-3399cc.svg?style=flat-square)](https://nodei.co/npm/limerun/)

[![NPM](https://nodei.co/npm/iopa-ssdp.png?downloads=true)](https://nodei.co/npm/iopa-ssdp/)

## About
`iopa-ssdp` is an API-First fabric for Simple Service Discovery Protocol (SSDP) for the Internet of Things (IoT) 
and for Microservices Container-Based Architectures (MCBA) based on the Internet of Protocols Alliance (IOPA) specification 

It servers SSDP messages in standard IOPA format and allows existing middleware for Connect, Express and limerun projects to consume/send each mesage.

Written in native javascript for maximum performance and portability to constrained devices and services, using
native HTTP parser and formatter in [`iopa-http`](https://nodei.co/npm/iopa-http/) 

## Status

Working Release

Includes:


### Server Functions

  * SSDP 1.03 parser
  * Works over UDP and other IOPA transports
  * Optimized pure javascript parser with no expensive callouts to C
  * Provides Alive, Bye, Notify and Search-Responses
  * Enables Universal Plug and Play discovery (uPNP) mechanisms
  
### Client Functions
  * SSDP 1.03 formatter
  * Works over UDP and other IOPA transports
  * Optimized pure javascript parser with no expensive callouts to C
  * Provides Search requests and matches responses
  * Enables Universal Plug and Play discovery (uPNP) mechanisms
  
## Installation

    npm install iopa-ssdp

## Usage
    
### Discovery Server and Client 
``` js
var app = new iopa.App();
app.use(IopaDiscoveryServerSSDP);
app.use(IopaDiscoveryClientSSDP);

var device = new DemoDevice().context;

app.device.register(device.context)
 
app.device.probe("upnp:rootdevice", function(device){
        console.log(device.toString());
      });}
      
``` 
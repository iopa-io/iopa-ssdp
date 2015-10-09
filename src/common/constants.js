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

module.exports.SSDP = {
  CAPABILITY: "urn:io.iopa:ssdp",
  PROTOCOL: "IETF 1.03",
  SCHEME: "ssdp:",
  SESSIONCLOSE: "ssdp.Finish",
  OBSERVE: "ssdp.Observe",

  NOTIFY_TYPES:
  {
    ALIVE: "ssdp:alive",
    BYE: "ssdp:byebye",
    UPDATE: "ssdp:update"
  },

  MAN_TYPES:
  {
    DISCOVER: '"ssdp:discover"',
  },

  METHODS:
  {
    MSEARCH: "M-SEARCH",
    NOTIFY: "NOTIFY",
    RESPONSE: "RESPONSE"
  },

   MULTICASTIPV4: '239.255.255.250',
  PORT: 1901,
  MAX_AGE: "max-age=1800",
  TTL: 128,
  MX: 2,
}

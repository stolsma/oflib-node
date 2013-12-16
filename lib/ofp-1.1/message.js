/*
 * Author: Zoltán Lajos Kis <zoltan.lajos.kis@ericsson.com>
 */

"use strict";

var util = require('util');
var ofp = require('./ofp.js');

var barrierReply = require('./messages/barrier-reply.js');
var barrierRequest = require('./messages/barrier-request.js');
var echoReply = require('./messages/echo-reply.js');
var echoRequest = require('./messages/echo-request.js');
var error = require('./messages/error.js');
var experimenter = require('./messages/experimenter.js');
var featuresReply = require('./messages/features-reply.js');
var featuresRequest = require('./messages/features-request.js');
var flowMod = require('./messages/flow-mod.js');
var flowRemoved = require('./messages/flow-removed.js');
var getConfigReply = require('./messages/get-config-reply.js');
var getConfigRequest = require('./messages/get-config-request.js');
var groupMod = require('./messages/group-mod.js');
var hello = require('./messages/hello.js');
var packetIn = require('./messages/packet-in.js');
var packetOut = require('./messages/packet-out.js');
var portMod = require('./messages/port-mod.js');
var portStatus = require('./messages/port-status.js');
var queueGetConfigReply = require('./messages/queue-get-config-reply.js');
var queueGetConfigRequest = require('./messages/queue-get-config-request.js');
var setConfig = require('./messages/set-config.js');
var statsReply = require('./messages/stats-reply.js');
var statsRequest = require('./messages/stats-request.js');
var tableMod = require('./messages/table-mod.js');

var offsets = ofp.offsets.ofp_header;

module.exports = {
  "struct": 'message',

  "unpack": function(buffer, offset) {
    if (buffer.length < offset + ofp.sizes.ofp_header) {
      return {
        "error" : {
          "desc" : util.format('message at offset %d is too short (%d).', offset, (buffer.length - offset)),
          "type" : 'OFPET_BAD_REQUEST', "code" : 'OFPBRC_BAD_LEN'
        }
      };
    }

    var version = buffer.readUInt8(offset + offsets.version, true);
    if (version != ofp.OFP_VERSION) {
      return {
        "error": {
          "desc": util.format('message at offset %d has wrong version (%d).', offset, version),
          "type": 'OFPET_BAD_REQUEST', "code" : 'OFPBRC_BAD_VERSION'
        }
      };
    }

    var len  = buffer.readUInt16BE(offset + offsets.length, true);

    if (buffer.length < offset + len) {
      return {
        "error": {
          "desc": util.format('message at offset %d is too short (%d).', offset, (buffer.length - offset)),
          "type": 'OFPET_BAD_REQUEST', "code" : 'OFPBRC_BAD_LEN'
        }
      };
    }

    var type = buffer.readUInt8(offset + offsets.type, true);
    var unpack;

    switch (type) {
      case ofp.ofp_type.OFPT_HELLO: 
        unpack = hello.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_ERROR:
        unpack = error.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_ECHO_REQUEST:
        unpack = echoRequest.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_ECHO_REPLY:
        unpack = echoReply.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_EXPERIMENTER:
        unpack = experimenter.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_FEATURES_REQUEST:
        unpack = featuresRequest.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_FEATURES_REPLY:
        unpack = featuresReply.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_GET_CONFIG_REQUEST:
        unpack = getConfigRequest.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_GET_CONFIG_REPLY:
        unpack = getConfigReply.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_SET_CONFIG:
        unpack = setConfig.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_PACKET_IN:
        unpack = packetIn.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_FLOW_REMOVED:
        unpack = flowRemoved.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_PORT_STATUS:
        unpack = portStatus.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_PACKET_OUT:
        unpack = packetOut.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_FLOW_MOD:
        unpack = flowMod.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_GROUP_MOD:
        unpack = groupMod.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_PORT_MOD:
        unpack = portMod.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_TABLE_MOD:
        unpack = tableMod.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_STATS_REQUEST:
        unpack = statsRequest.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_STATS_REPLY:
        unpack = statsReply.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_BARRIER_REQUEST:
        unpack = barrierRequest.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_BARRIER_REPLY:
        unpack = barrierReply.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_QUEUE_GET_CONFIG_REQUEST:
        unpack = queueGetConfigRequest.unpack(buffer, offset);
        break;
      case ofp.ofp_type.OFPT_QUEUE_GET_CONFIG_REPLY:
        unpack = queueGetConfigReply.unpack(buffer, offset);
        break;
      default: {
        return {
          "error": {
            "desc": util.format('message at offset %d has invalid type (%d).', offset, type),
            "type": 'OFPET_BAD_REQUEST', "code" : 'OFPBRC_BAD_TYPE'
          }
        };
      }
    }

    if ('error' in unpack) {
        return unpack;
    }

    unpack.message.version = "1.1";
    unpack.message.header.xid = buffer.readUInt32BE(offset + offsets.xid, true);
    return unpack;
  },

  "pack": function(obj, buffer, offset) { 
    if (buffer.length < offset + ofp.sizes.ofp_header) {
      return {
        error: {
          desc: util.format('message at offset %d does not fit the buffer.', offset)
        }
      };
    }
    
    var message = obj.message;
    var pack;

    switch (message.header.type) {
      case 'OFPT_HELLO': 
        pack = hello.pack(message, buffer, offset);
        break;
      case 'OFPT_ERROR':
        pack = error.pack(message, buffer, offset);
        break;
      case 'OFPT_ECHO_REQUEST':
        pack = echoRequest.pack(message, buffer, offset);
        break;
      case 'OFPT_ECHO_REPLY':
        pack = echoReply.pack(message, buffer, offset);
        break;
      case 'OFPT_EXPERIMENTER':
        pack = experimenter.pack(message, buffer, offset);
        break;
      case 'OFPT_FEATURES_REQUEST':
        pack = featuresRequest.pack(message, buffer, offset);
        break;
      case 'OFPT_FEATURES_REPLY':
        pack = featuresReply.pack(message, buffer, offset);
        break;
      case 'OFPT_GET_CONFIG_REQUEST':
        pack = getConfigRequest.pack(message, buffer, offset);
        break;
      case 'OFPT_GET_CONFIG_REPLY':
        pack = getConfigReply.pack(message, buffer, offset);
        break;
      case 'OFPT_SET_CONFIG':
        pack = setConfig.pack(message, buffer, offset);
        break;
      case 'OFPT_PACKET_IN':
        pack = packetIn.pack(message, buffer, offset);
        break;
      case 'OFPT_FLOW_REMOVED':
        pack = flowRemoved.pack(message, buffer, offset);
        break;
      case 'OFPT_PORT_STATUS':
        pack = portStatus.pack(message, buffer, offset);
        break;
      case 'OFPT_PACKET_OUT':
        pack = packetOut.pack(message, buffer, offset);
        break;
      case 'OFPT_FLOW_MOD':
        pack = flowMod.pack(message, buffer, offset);
        break;
      case 'OFPT_GROUP_MOD':
        pack = groupMod.pack(message, buffer, offset);
        break;
      case 'OFPT_PORT_MOD':
        pack = portMod.pack(message, buffer, offset);
        break;
      case 'OFPT_TABLE_MOD':
        pack = tableMod.pack(message, buffer, offset);
        break;
      case 'OFPT_STATS_REQUEST':
        pack = statsRequest.pack(message, buffer, offset);
        break;
      case 'OFPT_STATS_REPLY':
        pack = statsReply.pack(message, buffer, offset);
        break;
      case 'OFPT_BARRIER_REQUEST':
        pack = barrierRequest.pack(message, buffer, offset);
        break;
      case 'OFPT_BARRIER_REPLY':
        pack = barrierReply.pack(message, buffer, offset);
        break;
      case 'OFPT_QUEUE_GET_CONFIG_REQUEST':
        pack = queueGetConfigRequest.pack(message, buffer, offset);
        break;
      case 'OFPT_QUEUE_GET_CONFIG_REPLY':
        pack = queueGetConfigReply.pack(message, buffer, offset);
        break;
      default: {
        return {
          error: {
            desc: util.format('unknown message at %d (%s).', offset, message.header.type)
          }
        };
      }
    }

    if ('error' in pack) {
        return pack;
    }

    buffer.writeUInt8(ofp.OFP_VERSION, offset + offsets.version, true);
    buffer.writeUInt16BE(pack.offset - offset, offset + offsets.length, true);
    buffer.writeUInt32BE(message.header.xid, offset + offsets.xid, true);
    return pack;
  }
};

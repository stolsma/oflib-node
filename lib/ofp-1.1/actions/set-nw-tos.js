/*
 * Author: Zoltán Lajos Kis <zoltan.lajos.kis@ericsson.com>
 */

"use strict";

(function() {

var util = require('util');
var ofp = require('../ofp.js');
var packet = require('../../packet.js');

var offsets = ofp.offsets.ofp_action_nw_tos;

module.exports = {
            "unpack" : function(buffer, offset) {
                    var action = {
                            "header" : {"type" : 'OFPAT_SET_NW_TOS'},
                            "body" : {}
                        };

                    var len = buffer.readUInt16BE(offset + offsets.len, true);

                    if (len != ofp.sizes.ofp_action_nw_tos) {
                        return {
                            "error" : {
                                "desc" : util.format('%s action at offset %d has invalid length (%d).', action.header.type, offset, len),
                                "type" : 'OFPET_BAD_ACTION', "code" : 'OFPBAC_BAD_LEN'
                            }
                        }
                    }

                    action.body.nw_tos = buffer.readUInt8(offset + offsets.nw_tos);

                    if (action.body.nw_tos > packet.IP_DSCP_MAX) {
                        return {
                            "action" : action,
                            "warnings" : [{
                                "desc" : util.format('%s action at offset %d has invalid tos (%d).', action.header.type, offset, action.body.nw_tos),
                                "type" : 'OFPET_BAD_ACTION', "code" : 'OFPBAC_BAD_OUT_ARGUMENT'
                            }],
                            "offset" : offset + len
                        }
                    }

                    return {
                        "action" : action,
                        "offset" : offset + len
                    }
            },

            "pack" : function(action, buffer, offset) {
                    if (buffer.length < offset + ofp.sizes.ofp_action_nw_tos) {
                        return {
                            error : { desc : util.format('%s action at offset %d does not fit the buffer.', action.header.type, offset)}
                        }
                    }
                    buffer.writeUInt16BE(ofp.ofp_action_type.OFPAT_SET_NW_TOS, offset + offsets.type, true);
                    buffer.writeUInt16BE(ofp.sizes.ofp_action_nw_tos, offset + offsets.len, true);
                    buffer.writeUInt8(action.body.nw_tos, offset + offsets.nw_tos, true);
                    buffer.fill(0, offset + offsets.pad, offset + offsets.pad + 3);

                    if (action.body.nw_tos > packet.IP_DSCP_MAX) {
                        return {
                            warnings: [{
                                desc: util.format('%s action at offset %d has invalid tos (%d).', action.header.type, offset, action.body.nw_tos)
                            }],
                            offset : offset + ofp.sizes.ofp_action_nw_tos
                        }
                    }

                    return {
                        offset : offset + ofp.sizes.ofp_action_nw_tos
                    }
            }


}

})();

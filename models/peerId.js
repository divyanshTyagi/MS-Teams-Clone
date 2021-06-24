const mongoose = require('mongoose');

const peerIdSchema =  new mongoose.Schema({
    peerId: {
        type : String,
        unique : true,
         required: true
    },
    userName: {
        type: String,
        unique: false,
        required : true
    }
    
    
});

const PeerId = new mongoose.model("PeerId", peerIdSchema);

module.exports = { PeerId, peerIdSchema };
const mongoose = require('mongoose');
const {userSchema} = require('./userModel')
const roomDetailsSchema =  new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    participants: {
        type : [userSchema],
        unique : false
    }
    
});

const RoomDetails = new mongoose.model("RoomDetails", roomDetailsSchema);

module.exports = { RoomDetails, roomDetailsSchema };
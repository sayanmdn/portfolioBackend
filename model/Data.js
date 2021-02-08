const mongoose = require('mongoose')
var ObjectId = require('mongodb').ObjectID;

const dataSchema = new mongoose.Schema ({
    userId:{
        type: ObjectId,
        required:true,
        min:6
    },
    data:{
        type: Object,
        max: 128,
        min:8
    },
    time: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Data', dataSchema)
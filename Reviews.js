var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema
var ReviewSchema = new Schema({
    
    objectId: {type: String, required: true, index: {unique: true}},
    username: {type: String, required: true, index: { unique: true }},
    review: {type: String, required: true},
    rating: {type: String, required: true}
});

// return the model
module.exports = mongoose.model('Review', ReviewSchema);
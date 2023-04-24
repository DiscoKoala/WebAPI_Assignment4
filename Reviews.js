var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema
var ReviewSchema = new Schema({
    
    title: {type:String, required: true},
    movieID: {type: mongoose.Types.ObjectId, required: true},
    username: {type: String, required: true, index: { unique: true }},
    review: {type: String, required: true},
    rating: {type: Number, required: true}
});

// return the model
module.exports = mongoose.model('Review', ReviewSchema);
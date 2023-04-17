var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema
var MovieSchema = new Schema({
    title: {type: String, required: true, index: {unique: true}},
    releaseDate: String,
    genre: String,
    actors: {type:
                [
                    {
                    Actor: {type: String, required: true}, 
                    Character: {type: String, required: true}
                    }
                ]
               },
    image: {type: Image, required: true, index: {unique: true}}
});

// return the model
module.exports = mongoose.model('Movie', MovieSchema);
/*
CSC3916 HW3
File: Server.js
Description: Web API scaffolding for Movie API
 */
require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews')
var mongoose = require('mongoose');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.SECRET_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

// GET /Movies request response. If review(s) for movie exist, aggregate data
// from both movie and review entities.
// Otherwise, return list of movies.
router.get('/movies', authJwtController.isAuthenticated, function(req, res) {
    var movies = new Movie()
    movies.title = req.body.title;
    
    if(!movies){
        res.status(404).send({success: false, message: 'Query failed. Movie not found.'});
    } 
    else {
        Movie.find(function(err, movies){
            if(err){
                return res.status(500).send(err)
            } 
            else{
                res.status(200).json(movies);
            }
        })                
    }

});

router.post('/movies', authJwtController.isAuthenticated, function(req, res) {
    if(!req.body.title){
        res.json({success: false, msg: 'Please include movie title.'})
    }
    var newMovie = new Movie()
    newMovie.title = req.body.title;
    newMovie.releaseDate = req.body.releaseDate;
    newMovie.genre = req.body.genre;
    newMovie.actorList = req.body.actorList;
    newMovie.image = req.body.image;
    
    newMovie.save(function(err){
        if (err) {
            if (err.code == 11000)
                return res.json({ success: false, message: 'A movie with that title already exists.'});
            else
                return res.json(err);
        }
        res.json({success: true, msg: 'Successfully add new movie.'})
    });  
});

router.delete('/movies', authJwtController.isAuthenticated, function(req, res) {
    var newMovie = new Movie();
    newMovie.title = req.body.title;
    newMovie.releaseDate = req.body.releaseDate;

    Movie.deleteOne({title: newMovie.title},function(err, movie){
        if(err){
            return res.status(500).send(err)
            }
        else{
            res.status(200).json({success: true, message: "Movie deleted!"});
        }
        })
});

router.put('/movies', authJwtController.isAuthenticated, function(req, res) {
    var movie = new Movie()
    movie.title = req.body.title;
    movie.releaseDate = req.body.releaseDate;
    movie.genre = req.body.genre;
    movie.actorList = req.body.actorList;

    Movie.updateOne(function(err, movie){
        if(err){
            return res.status(500).send(err)
            }
            else{
            res.status(200).json({success: true, message: "Movie updated!", message: movie});
            }
        })
    }
);

router.post('/reviews', authJwtController.isAuthenticated, function(req, res) {
    if(!req.body.movieID){
        res.json({success: false, msg: 'Please include movie ID.'})
    }

    var newReview = new Review()
    newReview.objectId = req.body.movieID,
    newReview.username = req.body.username,
    newReview.review = req.body.review,
    newReview.rating = req.body.rating

    newReview.save(function(err){
        if (err) {
            if (err.code == 500)
                return res.json({ success: false, message: 'Something went wrong.'});
            else
                return res.json(err);
        }
        res.json({success: true, msg: 'Review created!'})
    });
});

router.get('/reviews', authJwtController.isAuthenticated, function(req, res) {
    var review = new Review()
    review.movieID = req.body.ObjectId,
    review.review = req.body.review
    
    if(review.review === "true"){
        review.aggregate(([
            {
                $lookup: 
                {
                    from: "reviews",
                    localField: " _id",
                    foreignField: "movieID",
                    as: "reviews"
                }
            },
            {
                $addField: { average_rating: { $avg: "$reviews.rating"} }
            },
            {
                $sort: {average_rating: -1}
            }

        ])).exec((err, review) =>{
            return res.json(review)
        }) 
    } else{

        if(!review){
            res.status(404).send({success: false, message: 'Query failed. Review not found.'});
        } 
        else {
            Review.find(function(err, review){
                if(err){
                    return res.status(500).send(err)
                }
                else{
                    res.status(200).json(review);
                    }
            })
                
        }
    }
});

router.route('/movies/:movieID')
    .get(authJwtController.isAuthenticated, function(req,res) {
        var movie = new Movie()
        movie.title = req.body.title

        movie.aggregate([
            {
                $match: 
                {
                    title: "Paddington Bear"
                }
            }
        ]).exec((err, movie) =>{
            return res.json(movie)
            })
});

router.route('/testcollection')
    .delete(authJwtController.isAuthenticated, function(req, res) {
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObjectForMovieRequirement(req);
        res.json(o);
    }
    )
    .put(authJwtController.isAuthenticated, function(req, res) {
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObjectForMovieRequirement(req);
        res.json(o);
    }
    );

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


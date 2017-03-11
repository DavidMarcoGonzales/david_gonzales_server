/**
 * Created by David on 10/12/2016.
 */
var express = require('express');
/*var mongoose = require('mongoose');
 mongoose.Promise = global.Promise;*/

var routes = function (MongooseAPIModel) {
    var genericRouter = express.Router();
    /*
     * Root (/) is where we do 2 things.
     *   post brand new routes
     *   get collection of existing routes
     *   No middleware needed
     */
    genericRouter.route('/')
    /*saving an incoming json object with post*/
        .post(function (req, res) {
            /*create a new incoming model*/
            var mongooseAPIObj = new MongooseAPIModel(req.body);

            /*save to db*/
            mongooseAPIObj.save();
            /*add status message to res object then send mongooseAPIObj*/
            res.status(201).send(mongooseAPIObj);
        })
        .get(function (req, res) {
            /*
             *  ...Books?genre=Science Fiction
             *  ...Books?authors=David Gonzales
             *  ?key=value says req.query = {key: "value"}
             *  the browser creates
             *  req.query = {
             *    genre:"Science Fiction"
             *  }
             */
            var query = {};
            /* pull if query.genre is in req */
            if (req.query.genre) {
                /* set req.genre = req.query.genre */
                query.genre = req.query.genre;
            }
            /* Mongoose "get"s the books by finding the books with query, if not empty object */
            MongooseAPIModel.find(query, function (err, mongooseAPIObjs) {
                if (err) {
                    /* If err, set res status(500) throw error*/
                    res.status(500).send(err);
                } else {
                    /* Construct a nested json array */
                    var returnJSONArray = [];

                    /* In order to implement hateoas
                     * for a list of items
                     * we add a link to self for each individual item
                     * */
                    mongooseAPIObjs.forEach(function (element, index, array) {
                        var newJSON = element.toJSON();
                        newJSON.links = {};
                        newJSON.links.self = 'http://' + req.headers.host + '/api/books/' + newJSON._id;
                        returnJSONArray.push(newJSON);
                    });
                    /* res.json returns array of json */
                    res.json(returnJSONArray);
                }
            });
        });

    /*
     * (.use) Middleware genericRouter.use('/:id'...
     * Get the object (ie. book) from the database
     * If found move to .get, .put, .patch, .delete
     * If not, res.send 404 no book found.
     */
    genericRouter.use('/:id', function (req, res, next) {
        console.log(req);
        MongooseAPIModel.findById(req.params.id, function (err, mongooseAPIObj) {
            if (err) {
                res.status(500).send(err);
            }
            /*
             * Add mongooseAPIObj to request object
             * making it available to everything down stream
             * it must hold a reference to original obj
             *
             * */
            else if (mongooseAPIObj) {
                req.mongooseAPIObj = mongooseAPIObj;
                next();
            } else {
                res.status(404).send('no book found');
            }
        });

    });


    /*
     *  http verbs for individual items identified by
     *  /:id of req object
     * */

    genericRouter.route('/:id')
        .get(function (req, res) {
            /*
             * In order to implement hateoas,
             * we need to build a new json object with custom links
             * then send back json as modified objects
             *
             * When we get an individual item
             * we can add hyperlink containing query to it's genre
             *
             * */
            var returnJSON = req.mongooseAPIObj.toJSON();
            returnJSON.links = {};

            var newLink = 'http://' + req.headers.host + '/api/books/?genre=' + returnJSON.genre;
            returnJSON.links.FilterByThisGenre = newLink.replace(' ', '%20');
            res.json(returnJSON);
        })
        .put(function (req, res) {
            /*
             * copy elements of req.body into
             * database model
             * */
            for (var p in req.body) {
                req.mongooseAPIObj[p] = req.body[p];
            }
            /* Save changes with asynchronous callback */
            req.mongooseAPIObj.save(function (err) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.json(req.mongooseAPIObj)
                }
            });

        })
        .patch(function (req, res) {
            if (req.body._id) {
                /*
                 * if it contains id, delete ide from obj
                 * */
                delete req.body._id
            }
            for (var p in req.body) {
                req.mongooseAPIObj[p] = req.body[p];
            }
            /* Save changes with asynchronous callback */
            req.mongooseAPIObj.save(function (err) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.json(req.mongooseAPIObj)
                }
            });
        })
        .delete(function (req, res) {
            req.mongooseAPIObj.remove(function (err) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(204).send('Removed');
                }
            });
        });
    return genericRouter;
};

module.exports = routes;
var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

var mongoose = require('mongoose');
var Talk = mongoose.model('Talk');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

var auth = jwt({secret: process.env.USER_SECRET, userProperty: 'payload'});

router.param('talk', function(req, res, next, id) {
  var query = Talk.findById(id);

  query.exec(function (err, talk) {
    if(err) {return next(err);}
    if(!talk) {return next(new Error('can\'t find talk'));}

    req.talk = talk;
    return next();
  });
});

router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment) {
    if(err) {return next(err);}
    if(!comment) {return next(new Error('can\'t find comment'));}

    req.comment = comment;
    return next();
  });
});

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index');
});

/* GET talks page. */
router.get('/talks', function(req, res, next) {
  Talk.find(function(err, talks) {
    if(err) {return next(err);}

    res.json(talks);
  });
});

/* POST add new talk. */
router.post('/talks', auth, function(req, res, next) {
  var talk = new Talk(req.body);
  talk.author = req.payload.username;

  talk.save(function(err, talk) {
    if(err){return next(err);}

    res.json(talk);
  });
});

/* GET single talk page. */
router.get('/talks/:talk', function(req, res, next) {
  req.talk.populate('comments', function(err, talk) {
    if(err) {return next(err);}

    res.json(talk);
  });
});

/* PUT upvote talk. */
router.put('/talks/:talk/upvote', auth, function(req, res, next) {
  if(req.talk.voted.indexOf(req.payload.username) >= 0) {
    return res.status(400).json({message: 'Already voted.'});
  }

  req.talk.upvote(function(err, talk) {
    if(err) {return next(err);}

    req.talk.voted.push(req.payload.username);
    req.talk.save(function(err, talk) {
      if(err) {return next(err);}

      res.json(talk);
    });
  });
});

/* PUT downvote talk. */
router.put('/talks/:talk/downvote', auth, function(req, res, next) {
  if(req.talk.voted.indexOf(req.payload.username) >= 0) {
    return res.status(400).json({message: 'Already voted.'});
  }

  req.talk.downvote(function(err, talk) {
    if(err) {return next(err);}

    req.talk.voted.push(req.payload.username);
    req.talk.save(function(err, talk) {
      if(err) {return next(err);}

      res.json(talk);
    });
  });
});

/* POST add new comment */
router.post('/talks/:talk/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.talk = req.talk;

  comment.save(function(err, comment) {
    if(err) {return next(err);}

    req.talk.comments.push(comment);
    req.talk.save(function(err, talk) {
      if(err) {return next(err);}

      res.json(comment);
    });
  });
});

/* PUT upvote comment */
router.put('/talks/:talk/comments/:comment/upvote', auth, function(req, res, next) {
  if(req.comment.voted.indexOf(req.payload.username) >= 0) {
    return res.status(400).json({message: 'Already voted.'});
  }

  req.comment.upvote(function(err, comment) {
    if(err) {return next(err);}

    req.comment.voted.push(req.payload.username);
    req.comment.save(function(err, comment) {
      if(err) {return next(err);}

      res.json(comment);
    });
  });
});

/* PUT downvote comment */
router.put('/talks/:talk/comments/:comment/downvote', auth, function(req, res, next) {
  if(req.comment.voted.indexOf(req.payload.username) >= 0) {
    return res.status(400).json({message: 'Already voted.'});
  }

  req.comment.downvote(function(err, comment) {
    if(err) {return next(err);}

    req.comment.voted.push(req.payload.username);
    req.comment.save(function(err, comment) {
      if(err) {return next(err);}

      res.json(comment);
    });
  });
});

/* POST register user */
router.post('/register', function(req, res, next) {
  if(!req.body.username || !req.body.password) {
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;
  user.setPassword(req.body.password);

  user.save(function(err){
    if(err) {return next(err);}

    return res.json({token: user.generateJWT()});
  });
});

/* POST authenticate user */
router.post('/login', function(req, res, next) {
  if(!req.body.username || !req.body.password) {
    return res.status(400).json({message: 'Please fill out all the fields'});
  }

  passport.authenticate('local', function(err, user, info) {
    if(err){return next(err);}

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

module.exports = router;

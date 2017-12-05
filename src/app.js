const Sequelize = require('sequelize');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const app = express();

// const { Client } = require('pg')
// const client = new Client({
// 	database: 'blog_application',
//   host: 'localhost',
//   user: process.env.POSTGRES_USER,
//   password: process.env.POSTGRES_PASSWORD
// });
const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 'myPassword';
const someOtherPlaintextPassword = 'somePassword';

const sequelize = new Sequelize('blog_application', process.env.POSTGRES_USER, null, {
	host: 'localhost',
	dialect: 'postgres',
	storage: './session.postgres'
})

app.set('views', 'src/views');
app.set('view engine', 'pug')

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
	store: new SequelizeStore({
		db: sequelize,
		checkExpirationInterval: 15 * 60 * 1000,
		expiration: 24 * 60 * 60 * 1000
	}),
	secret: "safe",
	saveUnitialized: true,
	resave: false
}))

//MODEL DEFINITION
const User = sequelize.define('users', {
	username: {
		type: Sequelize.STRING
	},
	email: {
		type: Sequelize.STRING,
		unique: true
	},
		password: {
    		type: Sequelize.STRING
  	}
	},{
  		timestamps: false
	}
)

const Blogpost = sequelize.define('blogposts', {
	title: {
		type: Sequelize.STRING
	},
	body: {
		type: Sequelize.STRING
	},
})

const Comment = sequelize.define('comments', {
	body: {
		type: Sequelize.STRING
	},

})

//TABLE RELATIONSHIP
User.hasMany(Blogpost)
User.hasMany(Comment)
Blogpost.belongsTo(User)
Blogpost.hasMany(Comment)
Comment.belongsTo(User)
Comment.belongsTo(Blogpost)

sequelize.sync();

//--------------------ROUTES-----------------//

//GET AND RENDER INDEX PAGE
app.get('/', function(request, response){
	console.log(request.session)
	const user = request.session.user
	const message = request.query.message
	response.render('index', {user: user, message: message} )
});

//LOG USER IN, SEARCH FOR MATCH IN DB, SHOW HOME
app.get('/home', function(req, res){

	const user = req.session.user;
	// console.log('Session at home '+user)
	// console.log('THE SESSION IS: ' + req.session.user);
	var message = req.query.message;
	res.render('home', {user: user, message: message})
});

app.post('/login', function(req, response){
	var email = req.body.email;
	var password = req.body.password;
	//var message = req.query.message;

	User.findOne({
		where: {
			email: email
		}
	}).then((user) => {
        if (user !== null) {
          bcrypt.compare(password, user.password, function(err,res){
            if (res) {
            	//console.log('do i make it here?')
              req.session.user = user
              console.log(user);
              response.redirect('/profile')
            } else {
            	//console.log('do i make it here?   2')
              response.redirect('/?message=' + encodeURIComponent('Incorrect password'))
            }
          })
        } else {
          response.redirect('/?message=' + encodeURIComponent('Unknown user'))
        }
	}).catch( function(err) {
		console.error(err)
	})
	})

//REGISTER FORM ON INDEX
app.post('/register', function(req, res){
	const user = req.session.user;
	const inputusername = req.body.username
	const inputemail = req.body.email
	const inputpassword = req.body.password

	console.log("Following sign in data received: "+inputusername+" "+inputemail+" "+inputpassword);

//BCRYPT ADDED
	User.findOne({
		where: {
			username: inputusername
		}
	}).then((returnUser) => {
		if(returnUser !== null) {
			res.redirect('/?message=' + encodeURIComponent('Username not available, please select a new one'))
		} else {
			User.findOne({
				where: {
					email: inputemail
				}
		}).then((returnEmail) => {
			if(returnEmail!==null) {
				res.redirect('/?message=' + encodeURIComponent('Email address already in use, please select a new one'))
			} else {
				bcrypt.hash(inputpassword, saltRounds).then(function(hash){
					return hash
				}).then ((hash) =>{
					User.create({
						username: inputusername,
						email: inputemail,
						password: hash

					})
					.then( (user) => {
						req.session.user = user;
						res.redirect('/home?message=' + encodeURIComponent("You have succesfully registered"))//redirecting to home with the message ...
					})
					})
				}
			})
			}
			})
			.catch(function(err) {
			console.log(err);
				 })
	})

////BCRYPT END
		


//IS SOMEONE LOGGED IN, 
//IF YES, WHO? 
//SHOW PROFILE WITH USER DETAILS
app.get('/profile', (req,res) => {
	const user = req.session.user;

	Blogpost.findAll({
		include: [{
			model: User
		}]
	})
	.then((blogposts) => {
		res.render('profile', {user: user});
	})
});

//DATA VALIDATION(SERVER SIDE, on pug files required to required fields, and enctype to form must be added)
// if(email.length === 0) {
// 		res.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
// 		return;
// 	}

// 	if(password.length === 0) {
// 		res.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
// 		return;
// 	}


//CREATEPOST PAGE ROUTE
app.get('/createpost', (req, res) => {
	const user = req.session.user;
	var message = req.query.message
	res.render('createpost', {user: user, message: message})
})

//CREATE NEW BLOGPOST
app.post('/createpost', (req, res) =>{
	var createBlogposttitle = req.body.title
	var createBlogpostbody = req.body.body
	var userId = req.session.user.id


	console.log("Following blogpost info received: "+createBlogposttitle+" "+createBlogpostbody)

	User.findOne({
		where: {
			id: userId
		}
	})
		.then(function(user){
			return user.createBlogpost({
				title: createBlogposttitle,
				body: createBlogpostbody,
				userId: userId
			})
		})
		.then((blogpost) =>{
			res.redirect(`/viewnewcreatedpost/${blogpost.id}`);
		})
	});

//RENDER NEWLY CREATED POST(dynamic params) + PUG
app.get('/viewnewcreatedpost/:blogpostId', function(req, res) {
    
    const blogpostId = req.params.blogpostId;

    Blogpost.findOne({
            where: {
                id: blogpostId
            },
            include: [{
                model: User
            }]
        })
        .then(function(blogpost) {
          
                

            res.render('viewnewcreatedpost', { title: blogpost.title, body: blogpost.body, id: blogpostId, userValue: blogpost.user});
        })
});

//YOURPOSTS PAGE ROUTe
app.get('/yourposts', function(req, res){
  const username = req.session.user.username
  const userId = req.session.user.id

  User.findOne({
  	where: {
  		username: username
  	}
  }).then((user)=>{
  	if(user !== null){

  	Blogpost.findAll({
  	where: {
		userId: userId
	},
    	include: [{
 	   	model: User
  	}]
  })
  .then((blogposts)=>{
    console.log('There are '+blogposts.length)
    res.render('yourposts',{user: user, blogposts: blogposts})//send to pugpage as a property blogPost
  })
}
  	})
  })

//VIEW SINGLE POST
app.get('/blogposts/:blogpostId', function (req, res){

	const blogpostId = req.params.blogpostId;
	console.log(blogpostId);

	Blogpost.findOne({
		where: {
		id: blogpostId
	},
	include: [{
		model: User,
    	model: Comment
		}]
	})
	.then(function(blogpost){
		res.render('blogpost', {title: blogpost.title, body: blogpost.body, blogpostId: blogpostId, user: blogpost.user, comments: blogpost.comments});
	})
});

//COMMENTS
app.post('/comments', (req, res) => {
  const user = req.session.user;
  const commentText = req.body.body;
  const postComment = req.body.postId;

  //console.log('hey')
  if (user === undefined) {
    res.redirect('/?message=' + encodeURIComponent("Please log in"));
  } else {
    User.findOne({
      where: {username: user.username}
    })
    .then((user) => {
      return user.createComment({
        body: commentText,
        blogpostId: postComment
      });
    })
    .then((userComment) => {
      console.log(userComment.body);
      res.redirect(`/blogposts/${req.body.postId}`);
    });
  };
});
  

//BLOGFEED
app.get('/blogposts', function(req, res){
  const user = req.session.user

  Blogpost.findAll({
    include: [{
    model: User
  }]
  })
  .then((blogposts)=>{
    console.log(blogposts)
    res.render('blogposts', {user: user, blogposts: blogposts})//send to pugpage as a property blogPost
  })
})


//LOGOUT
app.get('/logout', (req,res)=>{
  req.session.destroy(function(error) {
		if(error) {
			throw error;
		}
		res.redirect('/home?message=' + encodeURIComponent("Successfully logged out."));
	})
})


//IS APP CONNECTED TO PORT?
app.listen(3000, function(){
	console.log("ARTicle app is listening on port 3000")
})

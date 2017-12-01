const Sequelize = require('sequelize');
const express = require('express');
// const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// const { Client } = require('pg')
// const client = new Client({ 
// 	database: 'blog_application',
//   	host: 'localhost',
//   	user: 'biancaspoelstra'
// })

// client.connect()

const app = express();
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
// const User = sequelize.define('users', { username: {type: Sequelize.STRING, unique:true }, email: Sequelize.STRING })

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
Comment.belongsTo(User)

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

app.post('/login', function(req, res){
	var email = req.body.email;
	var password = req.body.password;
	//var message = req.query.message;

	User.findOne({
		where: {
			email: email
		}
	})
	.then(function(user){
		if(user!== null && password === user.password){
			console.log('AFTER LOGGING IN, WE FOUND USER ' + user.email)
			req.session.user = user;
			console.log('ASSIGNED SESSION ' + req.session.user.email)
			res.render('profile', {user: user});
		} else {
			res.redirect('/?message=' + encodeURIComponent('Invalid email or password. Please try again!'));
		}
	})
	.catch( function(err) {
		console.error(err)
	});
});

//REGISTER FORM ON INDEX
//CREATE NEW USER IN DB, LOG USER IN, SHOW HOME
app.post('/register', function(req, res){
	var inputusername = req.body.username
	var inputemail = req.body.email
	var inputpassword = req.body.password

	console.log("Following sign in data received: "+inputusername+" "+inputemail+" "+inputpassword);

		User.create({
			username: inputusername,
			email: inputemail,
			password: inputpassword
		})
		.then( (user) => {
			req.session.user = user;
			res.redirect('/home?message=' + encodeURIComponent("You have succesfully registered"))//redirecting to home with the message ...
		})
});


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

//DATA VALIDATION



//CREATEPOST PAGE ROUTE
//SHOW PUGFILE WITH FIELDS TO ENTER POST
//SUBMIT BTN TO POST on pug
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

//YOURPOSTS PAGE ROUTE
//user logged in? 
//get posts from database(fkey user in blogposts), 
//render user's posts

// app.get('/yourposts', function (req, res){
// 	const user = req.session.user
// 	res.render('yourposts', {user: user})
// });

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
		model: User
		}]
	})
	.then(function(blogpost){
		console.log(blogpost)
		console.log(blogpost.users);
		console.log('Userdate: ' +blogpost.user.name);
		res.render('blogpost', {title: blogpost.title, body: blogpost.body, blogpostId: blogpostId, user: blogpost.user});
	})
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

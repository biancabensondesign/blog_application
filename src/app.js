const Sequelize = require('sequelize');
const express = require('express');
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const { Client } = require('pg')
const client = new Client({ 
	database: 'blog_application',
  	host: 'localhost',
  	user: 'biancaspoelstra'
})

client.connect()

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
// app.use(session({
// 	secret: "safe",
// 	saveUnitialized: true,
// 	store: new SequelizeStore({
// 		db: sequelize,
// 		checkExpirationInterval: 15 * 60 * 1000,
// 		expiration: 24 * 60 * 60 * 1000
// 	})
// }))

//MODEL DEFINITION
const User = sequelize.define('users', {
	username: {
		type: Sequelize.STRING
	},
		email: {
		type: Sequelize.STRING,
		unique: true
	},
		password:{
    	type: Sequelize.STRING
  	}
	},{
  		timestamps: false
})

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

//GET AND RENDER HOMEPAGE
app.get('/', function(request, response){
	response.render('index')
});

//
app.get('/', function(req, res){

	var user = req.session.user //variable to catch req.session.user property
	res.render("home", {user: user})

});

// app.post('/', function (req, res) {

//   	var email = req.body.email;//input from form, input data stored on server as req.body
// 	var password = req.body.password;

// 	console.log('Just to make sure I get: '+email+" "+password);

// //DATA VALIDATION
// ////


// //FIND MATCH IN DB
// 	User.findOne({//look in db to see if there is user with matching name
// 		where: {
// 			username: username //match whatever was entered in form
// 		}
// 	}).then(function(user){//if user was found successfully, session can start
// 			if(user!== null && password === user.password){//
//         req.session.user = user; //creating new session indentifier which is set equal user, = to current user we just found, req.session object will give us access to his information as long as he is logged in
// 				res.redirect('/profile'); //redirecting user to /myprofile, session is now active, same as making get request to /myprofile
// 			} else {
// 				res.redirect('/?message=' + encodeURIComponent('Invalid username or password.'));
// 			}
// 	});
// });


// //PROFILE PAGE ROUTE
// app.get('/profile', function (request, response) {
// 	res.render('profile')
// });

// //BLOGFEED PAGE ROUTE
// app.get('/blogfeed', function (request, response){
// 	res.render('blogfeed')
// });

// //CREATEPOST PAGE ROUTE
// app.get('/createpost', function (request, response){
// 	res.render('createpost')
// });

// //YOURPOSTS PAGE ROUTE
// app.get('/yourposts', function (reqeust, response){
// 	res.render('yourposts')
// });


// //LOGOUT
// app.get('/logout', (req,res)=>{
//   req.session.destroy(function(error) {
// 		if(error) {
// 			throw error;
// 		}
// 		res.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
// 	})
// })


//IS APP CONNECTED TO PORT?
app.listen(3000, function(){
	console.log("ARTicle app is listening on port 3000")
})
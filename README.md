# blog_application
NYCDA project to apply everything the course covered in one application, such as 
- setting up an application in Node.js
- using RESTful routing to define the routes server-side
- utilizing Sequelize for database management 
- utilizing PUG pages for defining client-side behaviour
- utilizing Github as version control tool

FINAL PROJECT SPECIFICATION:
For my final project I will keep working on my blog application.
Since the backend is in place, I will focus on improving the front end, by using a front end framework such as Sass.
And of course I will keep on tinkering in the backend to fine tune some functionalities.


REQUIREMENTS (for first phase of blog application): 
Sequelize
Restful routing
Connection string read from environment variables

PROJECT SPECIFICATION 
Create a blogging application that allows users to do the following:
- register an account X 
- login X 
- logout X
Once logged in, a user should be able to: 
- create a post X 
- view a list of their own posts X 
- view a list of everyone's posts X 
- view a specific post X, including the comments people have made about it 
- leave a comment on a post X

TABLE RELATIONSHIPS

User.hasMany(Blogpost)
User.hasMany(Comment)
Blogpost.belongsTo(User)
Blogpost.hasMany(Comment)
Comment.belongsTo(User)
Comment.belongsTo(Blogpost

TABLES						
Blogposts	id	title	body	createdAt	updatedAt	userId
Users id	username	email	password		
Comments	id	body	createdAt	updatedAt	userId	

Where	        Type of request
Landing page	app.get
Home	        app.get
Log in	      app.post
Register	    app.post
Profile	      app.get
Create post	  app.get 
Show new post	app.get 
Your posts	  app.get 
Blogfeed	    app.get
Blogfeed	    app.get
Comment	      app.post
View single post with comment	app.get
Bcrypt	      N/A
Data Validation	
Logout	      app.get
Listen on port app.listen
						


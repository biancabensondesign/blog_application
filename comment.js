//APP.JS
app.post('/viewsinglepost', function(req, res) {
   
    var argument = req.body.argument;
    var userId = req.session.user.id
    var blogpostId = parseInt(req.body.blogpostId)
    // console.log(blogpostId)
    // console.log(typeof(blogpostId))
    // console.log(req.body)
    User.findOne({
        where: {
            id: userId
        }
    })
        .then(function(user) {
            return user.createComment({
                argument: argument,
                userId: userId,
                blogpostId: blogpostId
            })
        })
        .then((comment) => {
            res.redirect(`/blogfeed/${comment.blogpostId}`);
        })
});


//PUGPAGESIDE

	form.(action='/viewsinglepost', method='POST', autocomplete='off')
		h4 Leave a comment!
		textarea#argument(rows='5', name='argument', placeholder='comment')
		input(type='number',name='blogpostId', value= `${id}`, style='display:none;')
		br
		br
		button.btn.btn-default(type="submit", name="submit") SUBMIT
	.comments
		if commentValue
			each comment in commentValue
				.single-comment
					.comment-body
						p "#{comment.argument}"
						p From user: #{comment.userId}
					.createdAt
						p #{comment.createdAt}
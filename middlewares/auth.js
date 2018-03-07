// This is an custom middleware used for authentication to check whether the any user session exists or not //
// Here, 'exports' is used so that other files and functions can also call this function throughout the app //
exports.checkLogin = function(req,res,next){
	// If Session does not exist //
    if(!req.session.user)
    {
      // Redirect ser to the login screen //
      res.redirect('/v1/users/login/screen'); // WRITE LOGIN SCREEN HERE
    }
    else {
      // Execute the next command //
      next();
    }
}

exports.isLoggedIn = function(req,res,next){
  // If Session does not exist //
  //console.log("inside logged in")
    if(req.session.user)
    {
    //  console.log("inside if")
      // Redirect ser to the login screen //
      res.redirect('/v1/users/dashboard'); // WRITE LOGIN SCREEN HERE
    }
    else {
    //  console.log("inside else")
      // Execute the next command //
      next();
    }
}

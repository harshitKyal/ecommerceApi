

// This is an custom middleware used for authentication to check whether the any user session exists or not //
// Here, 'exports' is used so that other files and functions can also call this function throughout the app //
// checks for login , if user already logged in then program will go to next command otherwise redirects to login screen
exports.checkLogin = function(req,res,next){
	// If Session does not exist //
    if(!req.session.user)
      
      res.redirect('/v1/users/login/screen'); // Redirect ser to the login screen //

    else 
      
      next();   // Execute the next command //
    
}


exports.isLoggedIn = function(req,res,next){

  // If Session does not exist //
    if(req.session.user)

      res.redirect('/v1/users/dashboard');   // Redirects to the dashboard screen //

    else 

      next();// Execute the next command //

}

// Including express, mongoose and uniqid modules //
var mongoose = require('mongoose'); // Database //
var express = require('express'); // Simplified node.js //
var uniqid = require('uniqid'); // For generating unique id for specific purposes //

// Storing inbuilt node module 'events' in a varibale //
var events = require('events');

// Intitalizing the events to emit accordingly using it //
var eventEmitter = new events.EventEmitter();

// Inititalizing express router for creating routes for the API in a variable //
var userRouter = express.Router();

// Calling User model from the user schema //
var userModel = mongoose.model('User');
// Calling Product model from the product schema //
var productsModel = mongoose.model('Product');

// Including 'node-mailer' module which is used to send emails through our node application //
var nodemailer = require('nodemailer');
// Creating a transporter for the node mailer //
// Transporter stores the email service vendor's name and it's authentication data //
var transporter = nodemailer.createTransport({
    service:'gmail', // Gmail is used as the service here //
    auth: {
      user : 'testingnode7@gmail.com', // Write your gmail user name //
      pass : 'testing12@@' // Write your gmail passowrd //
    }
});

// This is an library file which generates response format for all API's accordingly //
var responseGenerator = require('./../../libs/responseGenerator');

// This is an custom middleware which has a function inside used for checking if user's session exists or not //
var auth = require('./../../middlewares/auth');

module.exports.controllerFunction = function(app){

     // Login Screen //
     // 'GET' http method //

     userRouter.get('/',function(req,res){
         res.redirect('/v1/users/login/screen');
     });

     userRouter.get('/login/screen',auth.isLoggedIn,function(req,res){
         // Displays login.jade //
         // It is a jade templating engine document which is used to create html data //
         res.render('login');
     });

     // Signup Screen //
     // 'GET' http method //
     userRouter.get('/signup/screen',auth.isLoggedIn,function(req,res){
         // Displays signup.jade //
         // It is a jade templating engine document which is used to create html data //
         res.render('signup');
     });
     
     // User's dashboard Screen //
     // 'GET' http method //
     // Here, you can see we have used 'auth.checkLogin' which is used to check whether user session exists or not //
     // If it doesn't exist, it will redirect you to login page //
     userRouter.get('/dashboard',auth.checkLogin,function(req,res){
         // Displays home.jade and pass data to it //
         // It is a jade templating engine document which is used to create html data //
      //   res.send(req.flash());
         res.render('home',{user:req.session.user});
     });
    
     // Add to cart Screen //
     // 'GET' http method //
     userRouter.get('/addToCart',auth.checkLogin,function(req,res){
         // Displays addToCart.jade //
         // It is a jade templating engine document which is used to create html data //
         res.render('addToCart');
     });

     // Remove from cart Screen //
     // 'GET' http method //
     userRouter.get('/removeFromCart',auth.checkLogin,function(req,res){
         // Displays removeFromCart.jade //
         // It is a jade templating engine document which is used to create html data //
         res.render('removeFromCart');
     });

     // Log out user from the app API//
     // 'GET' http method //
     userRouter.get('/logout',function(req,res){
         // Destroy the user's session //
         req.session.destroy(function(err){
             // After destroying, redirect the route //
             res.redirect('/v1/users/login/screen');
         });
     });

     // If the event is emitted //
     eventEmitter.on('welcomeEmail',function(data){
              // Creating mail body //
              var mailOptions = {
                  from    : 'testingnode7@gmail.com',
                  to      :  data.description.email,
                  subject :  'Welcome User',
                  html    :  '<h2> Thank you for creating an account on our website. We hope to be in touch for your further queries. </h2></br> <h4> Your Email ID is : </h4>' + data.description.email + ' </br> <h4> Your Password is : </h4>' + data.description.password
              };
              
              // Sending the mail body using 'nodemailer' transporter //
              transporter.sendMail(mailOptions,function(error,info){
                  // If error //
                  if(error)
                  {
                    // Show error (For developers reference) //
                    console.log(error);
                  }
                  else
                  {
                    // If mail sent succesfully, redirect user to the login screen //
                    res.redirect('/v1/users/dashboard');
                  }
              });
        });

     
     // Create/Signup user API //
     // 'POST' http method for signing up user //
     userRouter.post('/signup',function(req,res){
         // Check if all condition satisfies or not //
         // Here, 'req.body' is used to get data from the html body created using jade templating engine (bodyParser)//
         if(req.body.firstName != undefined && req.body.lastName != undefined && req.body.email != undefined && req.body.password != undefined ){
             
             // Creating a new user model and adding data we want to store in database into it //
             var userData = new userModel({
                userId    : uniqid(), // To generate a unique id //
                firstName : req.body.firstName,
                lastName  : req.body.lastName,
                email     : req.body.email,
                password  : req.body.password
             });
             
//             userData.cart = {};
             // Creating phone numbers object which is inside the users schema as a field //
             var phoneNumbers = {'primaryMobile': req.body.primaryPhone, 'secondaryMobile': req.body.secondaryPhone};
             // Passing above created phone numbers object to the users schema //
             userData.mobileNumbers = phoneNumbers;

             // Creating secuity questions object which is inside the users schema as a field //
             var securityQuestions = {'securityQuestion':req.body.securityQuestion , 'securityAnswer':req.body.securityAnswer};
             // Passing above created security question object to the users schema //
             userData.recoveryDetails = securityQuestions;

             // Check if user's email entered in the signup screen matches any user's email in the user model //
             userModel.findOne({'email': req.body.email},function(err,result){
                 // If email exists //
                 if(result)
                 {
                   // Send error response by using our custom library function to create custom json object //
                   var errorResponse = responseGenerator.generate(true,'Email ID already Exists',500,null);
                   // Send error response as the response //
                   res.send(errorResponse);
                 }
                 // If email doesn't exists //
                 else
                 {
                    // Saving the model to the database //                   
                    userData.save(function(error){
                    // If error //
                    if(error){
                      // Send error response by using our custom library function to create custom json object as the response to the browser //
                      var errorResponse = responseGenerator.generate(true,'some error occured',500,null);
                      res.send(errorResponse);
                    }
                    // If successfuly saved //
                    else
                    {
                      // Delete user's password from the session cookie for security purposes //
                      req.session.user = userData;
                      delete req.session.user.password;
                      

                      // Emitting event and passing data to it //
                      // Events are used in order to make an explicit function call which just emits the event and moves forward //
                      // The events then gets executed in it's own time //
                      // Main usage can be 'making user not to wait for things not required' //
                      eventEmitter.emit('welcomeEmail',{description : req.session.user});
                      // Redirect to the dashboard //
                      res.redirect('/v1/users/dashboard');
                      
                    }
                    });
                 }
             });

         }
         // If the condition doesn't matches which include the body paramaters declared in the condition need to be present //
         else
         {
             // Send error response by using our custom library function to create custom json object as the response to the browser and pass data to it//
             var errorResponse = responseGenerator.generate(true,'Some values which are required are not present. Please, refer to the API documentation.',500,null);
             res.render('error',{
                 // Passing data to the jade template from the response created above //
                 message   : errorResponse.message,
                 status  : errorResponse.status
             });
         }
     });

     // User Login API //
     // 'POST' http method for logging in user //
     userRouter.post('/login',function(req,res){
         // Find particular inside the users model //
         // The condition for finding is written inside: | find({--here--},func... |  //
         userModel.findOne({$and:[{'email':req.body.email},{'password':req.body.password}]},function(error,foundUser){
            // If error //
            if(error)
            {
              // Send error response generated by our library function as the response //
              var errorResponse = responseGenerator.generate(true,'some error occured',500,null);
              res.send(errorResponse);
            }
            // If user is null or undefined //
            else if(foundUser == undefined || foundUser.email == undefined || foundUser.password == undefined)
            {
              // Send error response generated by our library function as the response //
              var errorResponse = responseGenerator.generate(true,'user data not found',500,null);
              // Passing data to the jade template from the response created above //
              res.render('error',{
                  message : errorResponse.message,
                  status  : errorResponse.status
              });
            }
            // If user found //
            else
            {
              // Delete user's password from the user's session cookie for security purposes //
              req.session.user = foundUser;
              delete req.session.user.password;
              // After deleting, redirect user to the dashborad.jade template //
              res.redirect('/v1/users/dashboard');
            }
         });
     });


        // to change passwoord of  user //
       // 'GET' http request for getting data //
       userRouter.get('/changePassword/screen',function(req,res){

            res.render('changePassword',{errror:false});
       });


      // to change passwoord of  user //
       // 'GET' http request for getting data //
       userRouter.post('/changePassword',function(req,res){

        //checks for new password
         if (req.body.newPassword != req.body.reNewPassword){
              
              var successResponse = responseGenerator.generate(true,'Password doesnt matches',500,null);
              res.send(successResponse);
         
         }
         else{

            //var popupS = require('popups');
          // Find inside the user model //
           // The condition for finding is written inside: | find({--here--},func... |  //
            var newPassword = req.body.newPassword;
            //console.log("inside DSADfunciton")
            //console.log(req.session.user.email)
            userModel.findOneAndUpdate({$and:[{'email':req.session.user.email},{'password':req.body.oldPassword}]},{$set:{password:newPassword}},{new:true},function(error,foundUser){
            // If error //
            //console.log("inside funciton")
            //c//onsole.log(foundUser)
            //console.log(error)
            if(error)
            {
              //console.log("inside error")
              // Send error response generated by our library function as the response //
              var errorResponse = responseGenerator.generate(true,'some error occured',500,null);
              res.send(errorResponse);
            }
            // If user is null or undefined //
            else if(foundUser == undefined || foundUser.email == undefined || foundUser.password == undefined)
            {

       
             // res.render('changePassword');

              // Send error response generated by our library function as the response //
              var errorResponse = responseGenerator.generate(true,'check your password',500,null);
              // Passing data to the jade template from the response created above //
              res.render('error',{
                  message : errorResponse.message,
                  status  : errorResponse.status
              });
            }
            // If user found //
            else
            {
              req.session.user = foundUser;
              delete req.session.user.password;
                    // Creating mail body //

                var mailOptions = {
                   // from    : 'harshitkyal@gmail.com',
                    to      :  req.session.user.email,
                    subject :  'Password Changes succesfully',
                    html    :  '<h4> This is a system generated mail. Please do not reply to this email ID. If you have a query or need any clarification you may </h4> <hr> <h4> (1) Email Us harshitkyal@gmail.com</h4> <hr><h3> Dear User , </h3> <h3>A request was recieved to change your password, and your password changed succesfully. </h3><h4> Your New Password is :' + foundUser.password + '</h4>'
                };
                
                // Sending the mail body using 'nodemailer' transporter //
                transporter.sendMail(mailOptions,function(error,info){
                    // If error //
                    if(error)
                      // Show error (For developers reference) //
                      console.log(error);
                    
                });
                     // req.flash("messages",  "Password changes succesfully" );
                    // res.locals.messages = req.flash();
                     //console.log(res.locals.messages.messages[0])
                      //res.redirect('/v1/users/dashboard');
                      //res.render("login', { title: 'Login"});
             //               console.log("inside success")
              // Delete user's password from the user's session cookie for security purposes //
              var successResponse = responseGenerator.generate(true,'Password changes succesfully',500,foundUser);
              res.send(successResponse);
             // windows.alert("password changes succesfully");
              // After deleting, redirect user to the dashborad.jade template //
              
              
            }
         });
          }
       });

//       userRouter.get('/dashboardd', function(req,res) {
 //   res.send(req.flash());  
//});


       // to get cart info of user //
       // 'GET' http request for getting data //
       userRouter.get('/cartInfo',auth.checkLogin,function(req,res){
           // Find inside the user model //
           // The condition for finding is written inside: | find({--here--},func... |  //
           //console.log(req.session.user)
           userModel.find({'userId':req.session.user.userId},function(error,allProducts){
              // If lengthh of cart array of user module is zero   means cart is empty //
              //if cart is not empty then render cartInfo view and pass cart info
              
              if(error){
                      
                      var errorResponse = responseGenerator.generate(true,'Your Cart Is Empty',204,null);
                      res.send(errorResponse);
                 
              }
              else if(allProducts.hasOwnProperty('cart')){

                  //checks if product is there or not in cart
                  if(allProducts[0].cart.length != 0)
                  {
                      var successResponce = responseGenerator.generate(false,'All products',200,allProducts[0].cart);
                      res.send(successResponce);
                  }
                  //if cart is empty then pass as null to 
                  else{
                      // Send error response generated by our library function as the response //
                      var errorResponse = responseGenerator.generate(true,'Your Cart Is Empty',204,null);
                      res.send(errorResponse);
                  }
                }

              else{

                    var errorResponse = responseGenerator.generate(true,'Your Cart Is Empty',204,null);
                    res.send(errorResponse);

              }

           });
              
       });

     // Get all users API //
     // 'GET' method for getting all users //
     userRouter.get('/all',function(req,res){
        // Find inside the users model //
        // The condition for finding is written inside: | find({--here--},func... |  //
        userModel.find({},function(error,allUsers){
          // If error //
          if(error)
          {
            // Send error response generated by our library function as the response //
            var errorResponse = responseGenerator.generate(true,'some error occured',500,null);
            res.send(errorResponse);
          }
          // If success //
          else
          {
            // Send success response generated by our library function as the response //
            var successResponce = responseGenerator.generate(false,'All users',200,allUsers);
            res.send(successResponce);
          }
        });
     });


     // Get particular user API //
     // 'GET' method for getting a particular user //
     userRouter.get('/:id',function(req,res){
        // Find Particular inside the users model //
        // The condition for finding is written inside: | find({--here--},func... |  //
        userModel.findOne({'userId':req.params.id},function(error,foundUser){
           // If error //
           if(foundUser)
           {
              // Send success response generated by our library function as the response //
             var successResponce = responseGenerator.generate(false,'User Found',200,foundUser);
             res.send(successResponce);
           }
           // If user is found //
           else
           {
            // Send error response generated by our library function as the response //
             var errorResponse = responseGenerator.generate(true,'user not found',500,null);
             res.send(errorResponse);
            
           }
        });
     });
 



     // Forgot Password Screen //
     // 'GET' method used //
     userRouter.get('/forgot/screen',function(req,res){
        // Display 'forgot.jade' //
        // This is an jade template(requires html knowledge) created using jade templating engine //
        res.render('forgot');
     });

     // Forgot Password API //
     // 'POST' method used for sending recovery information to the particular user //
     userRouter.post('/forgot',function(req,res){
        // Find particular inside the users model //
        // The condition for finding is written inside: | find({--here--},func... |  //
        userModel.findOne({'email':req.body.email},function(error,foundUser){
            // If error //
            if(error)
            {
              // Send error response generated by our library function as the response //
              var errorResponse = responseGenerator.generate(true,'email not found',500,null);
              res.send(errorResponse);
            }
            // If user found is undefined or null //
            else if (foundUser == undefined || foundUser.email == undefined)
            {
              // Send error response generated by our library function as the response //
              var errorResponse = responseGenerator.generate(true,'email not found',500,null);
              // Passing data to the jade template from the response created above //
              res.render('error',{
                 message : errorResponse.message,
                 status  : errorResponse.status
              });
            }
            // If user is found //
            else
            {
              // Creating mail body //
              var mailOptions = {
                 //from    : 'harshitkyal@gmail.com',
                  to      :  req.body.email,
                  subject :  'Password Recovery Request',
                  html    :  '<h2> A request was recieved to reset you password, Please ignore this mail if you didnot request the reset. </h2></br> <h4> Your Password is : </h4>' + foundUser.password
              };
              
              // Sending the mail body using 'nodemailer' transporter //
              transporter.sendMail(mailOptions,function(error,info){
                  // If error //
                  if(error)
                  {
                    // Show error (For developers reference) //
                    console.log(error);
                  }
                  else
                  {
                    // If mail sent succesfully, redirect user to the login screen //
                    res.redirect('/v1/users/login/screen');
                  }
              });
            }
        });

     });

    // Add product to user's cart API //
    // 'POST' method used to add product information to the user's cart //
    userRouter.post('/cart/add',function(req,res){

         // Store the product id passed from the body in a variable //
         var productsId = req.body.productId;

         // Find Particular inside the users model //
         // The condition for finding is written inside: | find({--here--},func... |  //
         productsModel.findOne({'productId':productsId},function(err,productFound){

           // If product is found //
           if(productFound)
           {
              //check if product is already added or not in the card
              userModel.findOne({$and:[{'email':req.session.user.email},{'cart.productId': productsId}]},function(err,productFoundInUserCart){

                if(productFoundInUserCart){
                  console.log("inside user")
                    // Send error response generated by our library function as the response //
                    var errorResponse = responseGenerator.generate(true,'Product Already Added to Cart',200,null);
                    res.send(errorResponse);
                
                }
                else{
                   // console.log("in else")
                    // Creating a cart object from the found product and storing it in a varibale //
                    var createCart = {'cart': productFound};

                    // Find particular inside the users model and update it //
                    // Here, '$push' is used to add data to cart not replace it whenever the api is called //
                    // The condition for finding is written inside: | find({--here--},func... |  //
                    userModel.findOneAndUpdate({'email':req.session.user.email},{$push : createCart},function(err,success){
                      // If error //
                      if(err)
                      {
                        // Send error response generated by our library function as the response //
                        var errorResponse = responseGenerator.generate(true,'Some Error Occured',500,null);
                        res.send(errorResponse);
                      }
                      // If success //
                      else
                      {

                        // Send success response generated by our library function as the response //
                        var successResponce = responseGenerator.generate(false,'Product has been added to the cart',200,success);
                        res.send(successResponce);
                      }
                    });
                   
                  }
                });

              }
               // If product doesn't exists //
               else
               {
                 console.log("insodede")
                // Send error response generated by our library function as the response //
                var errorResponse = responseGenerator.generate(true,'Product ID not found',500,null);
                res.send(errorResponse);
                }
           
            });
        
         
     });

     // Remove product from user's cart API //
     // 'POST' method used to remove the product from the cart //
     userRouter.post('/cart/remove',function(req,res){

         // Strore the product id passed from the body in a variable //
         var productsId = req.body.productId;
         // Find Particular inside the products model //
         // The condition for finding is written inside: | find({--here--},func... |  //
         productsModel.findOne({'productId':productsId},function(err,productFound){
           // If product is found in the products model //
           if(productFound)
           {
            // Create an object for passing it as an condition for updating the model //
            var removeCart = {'cart':
                                {'productId':productsId}
                             };

            // find in user's model
            // The condition for finding is written inside: | find({--here--},func... |  //
            userModel.findOne({$and:[{'email':req.session.user.email},{'cart.productId': productsId}]},function(err,productFoundInUserCart){

             if(productFoundInUserCart){       
                 // Update the users model //
                  userModel.update({'email':req.session.user.email},{$pull : removeCart},function(err,success){   
                    // If success //{}
                    if(success)
                    {
                     // Send success response generated by our library function as the response //
                     var successResponse = responseGenerator.generate(false,'Product successfully deleted',200,success);
                     res.send(successResponse);
                    }
                  });
                }
              else{
               var errorResponse = responseGenerator.generate(true,'This Product is not in your Cart',500,null);
               res.send(errorResponse);
             }
            });

           }
           // If product not found in products model //
           else
           {
            // Send error response generated by our library function as the response //
            var errorResponse = responseGenerator.generate(true,'Product ID does not exist',500,null);
            res.send(errorResponse);
           }
         });        
         
     });

     
     // Here, router level middleware makes the below route as the default route for the products router // 
     app.use('/v1/users',userRouter);

}

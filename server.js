/*********************************************************************************
*
*  Author Name: Yuchi Zheng
*  Online (Cyclic) URL: https://filthy-fez-lamb.cyclic.app/blog
*
********************************************************************************/
const authData = require("./auth-service.js");//ass6
const clientSessions = require("client-sessions");//ass6

const express = require("express");//var express
const path =  require("path");//var express
const data = require("./blog-service.js");
const exphbs = require('express-handlebars');

const app = express();

//New add library
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const upload = multer();
const stripJs = require('strip-js');
const { addAbortSignal } = require("stream");


app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));//--ass5

var HTTP_PORT = process.env.PORT || 8080;

//Set the cloudinary config
cloudinary.config({
    cloud_name: 'df2dlyfvc',
    api_key: '266576127142429',
    api_secret: 'LepFIxb-sWZhiEnOiKQfdKF3p-g',
    secure: true
});

//client-sessions middleware---------------ass6
app.use(clientSessions({
    cookieName: "session", 
    secret: "week10example_web322", 
    duration: 2 * 60 * 1000, 
    activeDuration: 1000 * 60
}));

//----------------------------------------ass6
app.use(function(req, res, next) {//request, response
    res.locals.session = req.session;
    next();
  });

// helper middleware (ensure login)--------ass6
// make sure the user is logged in 
function ensureLogin(req, res, next){
    if(!req.session.user){
        res.redirect("/login");
    }
    else{
        next();
    }
}
  
//Fixing the Navigation Bar to Show the correct "active" item
//1)Add the property "activeRoute" to "app.locals"
app.use(function(req,res,next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

//2) custom "helper"
app.engine('.hbs', exphbs.engine({ 
    extname: '.hbs',
    helpers: { 
        //replace all of our existing navbar links
        navLink: function(url, options){
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },

        //evaluate conditions for equality
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        //Adding a new "Helper" to handle unsafe HTML in posts
        safeHTML: function(context){
            return stripJs(context);
        },       
        
        //Date format help ---ass5
        formatDate: function(dateObj){
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
        }
        
    }
}));

function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
}

app.get("/", function(req,res){
    //res.redirect("/about"); 
    res.redirect("/blog"); 
}); 

//Route to all published posts by category
app.get('/blog', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{
        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            //posts = await BlogData.getPublishedPostsByCategory(req.query.category);
            posts = await data.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            //posts = await BlogData.getPublishedPosts();
            posts = await data.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest post from the front of the list (element 0)
        let post = posts[0]; 

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;

    }catch(err){
        viewData.message = "no results";
    }
    try{
        // Obtain the full list of "categories"
        //let categories = await BlogData.getCategories();
        let categories = await data.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})
});

/*app.get("/blog", (req, res)=>{
    data.getPublishedPosts().then((data)=>{
        res.json(data);
    })
    .catch((err)=>{
        res.json(err);
    });
});*/

//Adding the Blog/:id Route and render
app.get('/blog/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{
        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            //posts = await blogData.getPublishedPostsByCategory(req.query.category);
            posts = await data.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            //posts = await blogData.getPublishedPosts();
            posts = await data.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the post by "id"
        viewData.post = await data.getPostById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }

    try{
        // Obtain the full list of "categories"
        //let categories = await blogData.getCategories();
        let categories = await data.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})
});

app.get("/post/:id", ensureLogin, (req, res)=>{  
    data.getPostById(req.params.id).then((data)=>{
        res.json(data);
    })
    .catch((err)=>{
        res.json(err);
    }); 
});

app.get("/about", function(req,res){
    //res.sendFile(path.join(__dirname, "/views/about.html"));
    res.render("about");
});

//Updated route to filtered posts with render------------ass5
app.get("/posts", ensureLogin,  (req, res)=>{
    if(req.query.category){
        data.getPostsByCategory(req.query.category).then((data)=>{
            if(data.length > 0){
                //res.json(data);
                res.render("posts", {posts: data});
            }else{
                res.render("posts", {message: "no results"});
            }
            
        })
        .catch((err)=>{
            //res.json(err);
            res.render("posts", {message: "no results"});
        });
    }else if(req.query.minDate){
        data.getPostsByMinDate(req.query.minDate).then((data)=>{
            if(data.length > 0){
                //res.json(data);
                res.render("posts", {posts: data});
            }else{
                res.render("posts", {message: "no results"});
            }
        })
        .catch((err)=>{
            //res.json(err);
            res.render("posts", {message: "no results"});
        });
    }else{
        data.getAllPosts().then((data)=>{
            if(data.length > 0){
                //res.json(data);
                res.render("posts", {posts: data});
            }else{
                res.render("posts", {message: "no results"});
            }
        })
        .catch((err)=>{
            //res.json(err);
            res.render("posts", {message: "no results"});
        });
    }
});

//Route to all categories
app.get("/categories", ensureLogin, (req, res)=>{
    data.getCategories().then((data)=>{
        if(data.length > 0){
            //res.json(data);
            res.render("categories", {categories: data});
        }else{
            res.render("categories", {message: "no results"});
        }
        
    })
    .catch((err)=>{
        //res.json(err);
        res.render("categories", {message: "no results"});
    });
});


//Route to get "Add Post"--ass5
app.get("/posts/add", ensureLogin, (req, res)=>{
    // res.render("addPost");
    data.getCategories().then((data)=>{
        res.render("addPost", {categories: data});//render "addPost.hbs" with "categories: data"
    }).catch((err)=>{
        res.render("addPost", {categories: []}); 
    });
});

//Route to post "Add Post"--ass5
app.post("/posts/add", ensureLogin, upload.single("featureImage"), (req, res) =>{
    if(req.file){
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
        
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };
        
        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded)=>{
            processPost(uploaded.url);
        });
    }else{
        processPost("");
    }
    
    // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts
    function processPost(imageUrl) {
        req.body.featureImage = imageUrl;

        data.addPost(req.body).then(()=>{
            res.redirect("/posts");
        }).catch(err=>{
            res.status(500).send(err);
        });
    }

});


//Route to get "Add Category"---------------------------ass5
app.get("/categories/add", ensureLogin, (req, res)=>{
    res.render("addCategory");
});

//Route to get "Add Category"---------------------------ass5
app.post("/categories/add", ensureLogin, (req, res) =>{
    // TODO: Process the req.body and add it as a new Category before redirecting to /categories
    data.addCategory(req.body).then(()=>{
        res.redirect("/categories");
    }).catch((err)=>{                       //
        res.status(500).send("Unable to Add Category");
    });
});

//Route to get delete category by categoryID-------------ass5
app.get("/categories/delete/:id", ensureLogin, (req, res)=>{//:id use req.params
    data.deleteCategoryById(req.params.id).then(()=>{
        res.redirect("/categories");
    }).catch((err)=>{                       //
        res.status(500).send("Unable to Remove Category / Category not found");//
    });
});

//Route to get delete post by postID----------------------ass5
app.get("/posts/delete/:id", ensureLogin, (req, res)=>{
    data.deletePostById(req.params.id).then(()=>{
        res.redirect("/posts");
    }).catch((err)=>{                       //
        res.status(500).send("Unable to Remove Post / Post not found");//
    });
});

//Route to /login----------------------------------------ass6
app.get("/login", (req, res)=>{
    res.render("login");
});

//Route to /register----------------------------------------ass6
app.get("/register", (req, res)=>{
    res.render("register");
});

//Route to /register----------------------------------------ass6
app.post("/register", (req, res)=>{
    authData.registerUser(req.body).then(()=>{
        res.render("register", {successMessage: "User created"});
    }).catch((err)=>{
        res.render("register", {errorMessage: err, userName: req.body.userName});
    });
});

//Route to /login----------------------------------------ass6
app.post("/login", (req, res)=>{
    // set the value of the client's "User-Agent" to the request body
    req.body.userAgent = req.get('User-Agent');

    authData.checkUser(req.body).then((user)=>{
            req.session.user = {
                "userName": user.userName,// authenticated user's userName
                "email": user.email,// authenticated user's email
                "loginHistory": user.loginHistory// authenticated user's loginHistory
            }
            res.redirect('/posts');
        }).catch((err)=>{
            res.render("login", {errorMessage: err, userName: req.body.userName});
        });
});


//Route to /logout----------------------------------------ass6
app.get("/logout", (req, res)=>{
    req.session.reset();
    res.redirect('/');
});

//Route to /userHistory----------------------------------------ass6
app.get("/userHistory", ensureLogin, (req, res)=>{
    res.render("userHistory");
});


//404 status
app.use((req, res)=>{
    //res.status(404).sendFile(path.join(__dirname, "/views/404.html"));
    res.status(404).render("404");
});

//Initialize data and Listen
data.initialize()
    .then(authData.initialize)
    .then(function(){
    app.listen(HTTP_PORT, onHttpStart);
}).catch(function(err){
    console.log("Unable to start server: " + err);
});

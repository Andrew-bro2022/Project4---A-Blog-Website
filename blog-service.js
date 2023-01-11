const Sequelize = require('sequelize');

// set up sequelize to point to our postgres database
var sequelize = new Sequelize('ulcddttv', 'ulcddttv', 'SIrmNwlO0cVhwR_qeWb6OzWWtjWk2yS2', {
    host: 'peanut.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

//Define a "Post" model
var Post = sequelize.define('Post',{
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
});

//Define a "Category" model
var Category = sequelize.define('Category',{
    category: Sequelize.STRING
});

//Define a relationship
Post.belongsTo(Category, {foreignKey: 'category'});


//Initialize function
//sequelize.sync() connects to the DB and that our Post and Category models are represented in the database as tables
module.exports.initialize = function(){
    return new Promise((resolve, reject) => {
        sequelize.sync().then(()=>{
            resolve();
        }).catch(()=>{
            reject("Unable to sync the database in function initialize");
        });
    });
}

//Get all posts
module.exports.getAllPosts = function(){
    return new Promise((resolve, reject) => {
        Post.findAll().then(function(data){
            resolve(data);
        }).catch((err)=>{
            reject("Unable to sync the database in function getAllPosts");
        });
    });
}

//Get all published posts
module.exports.getPublishedPosts = function(){
    return new Promise((resolve, reject) => {
        Post.findAll({
            where:{
                published: true
            }
        }).then(function(data){
            resolve(data);
        }).catch((err)=>{
            reject("no results returned in function getPublishedPosts");
        });  
    });
}

//Get all categories
module.exports.getCategories = function(){
    return new Promise((resolve, reject) => {
        Category.findAll().then(function(data){
            resolve(data);
        }).catch((err)=>{
            reject("no results returned in function getCategories");
        })
        
    });
}

// Add Post
module.exports.addPost = function(postData){
    return new Promise((resolve, reject) => {
        postData.published = (postData.published) ? true : false;
        for(var d in postData){
            if(postData[d] == '') postData[d] = null;//convert empty data to null
        }
        postData.postDate = new Date();//not postData.Date = new Date(); !!!!!!

        Post.create(postData).then(function(data){
            resolve(data);
        }).catch((err)=>{
            reject("unable to create post in function addPost ");
        });  
    });
}

//Add category--ass5
module.exports.addCategory = function(categoryData){
    return new Promise((resolve, reject) =>{
        for(var d in categoryData){
            if(categoryData[d] == '') categoryData[d] = null;
        }

        Category.create(categoryData).then(function(data){
            resolve(data);
        }).catch((err)=>{
            reject("unable to create category in function addCategory");
        });
    });
}



//Find posts by category
module.exports.getPostsByCategory = function(categoryID){
    return new Promise((resolve, reject) => {
        Post.findAll({
            where:{
                category: categoryID
            }
        }).then(function(data){
            resolve(data);
        }).catch((err)=>{
            reject("no results returned in function getPostsByCategory");
        }); 
    });
}

//Find posts by date
module.exports.getPostsByMinDate = function(minDateStr){
    return new Promise((resolve, reject) => {
        const { gte } = Sequelize.Op;
        Post.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        }).then(function(data){
            resolve(data);
        }).catch((err)=>{
            reject("no results returned in function getPostsByMinDate");
        });
    });
}

//Find posts by id
module.exports.getPostById = function(inputID){
    return new Promise((resolve, reject) => {
        Post.findAll({
            where:{
                id: inputID //id will be generated automatically by the database
            }
        }).then(function(data){
            //resolve(data);
            resolve(data[0]);//or use findOne in line 152
        }).catch((err)=>{
            reject("no results returned in function getPostById");
        });   
    });  
}

//Find posts which are published and categories--ass4
module.exports.getPublishedPostsByCategory = function(categoryID){
    return new Promise((resolve, reject) => {
        Post.findAll({
            where:{
                published: true,
                category: categoryID
            }
        }).then(function(data){
            resolve(data);
        }).catch((err)=>{
            reject("no results returned in function getPublishedPostsByCategory");
        })    
    });
}


//delete categories bu categoryID---ass5
module.exports.deleteCategoryById = function(CategoryID){
    return new Promise((resolve, reject) =>{
        //sequelize.sync().then(function () {});
            Category.destroy({
                where:{
                    id: CategoryID    //categoryID
                }
            }).then(function(data){
                resolve(data);
            }).catch((err)=>{
                reject("Category Delete failed in function deleteCategoryById");
            });
        
    });
}

//delete post by postID---ass5
module.exports.deletePostById = function(id){
    return new Promise((resolve, reject) =>{
        //sequelize.sync().then(function (){});
            Post.destroy({
                where:{
                    id: id
                }
            }).then(function(data){
                resolve(data);
            }).catch((err)=>{
                reject("Post delete failed in function deletePostById");
            });
        
    });
}


import express, { json, response } from "express";
import mongoose from "mongoose"
import 'dotenv/config'
import Blog from "./Schema/Blog.js"
import bcryptjs from "bcrypt";
import User from "./Schema/User.js"
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from 'cors';
import admin from "firebase-admin"
import serviceAccountKey from "./reactjs-blog-4ca96-firebase-adminsdk-5w02u-e201b845b9.json" assert {type: "json"}
import { getAuth } from "firebase-admin/auth"
import { upload } from "./middleware/multer.js"

import { uploadOnCloudinary } from "./util/cloudinary.js";

const server = express();
let PORT = 3000



admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
})

server.use(express.json())
server.use(cors())

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true
})

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

const verifyJWT = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if(token == null){
        return res.status(401).json({ error: "No access token" })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if(err) {
            return res.status(403).json({ error: "access token is invalid" })
        }

        req.user = user.id
        next()
    })

}

const formatDatatoSend = (user) => {

    const access_token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

    return {
        accessToken: access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname
    }
}

const generateUsername = async (email) => {
    let username = email.split("@")[0]
    let isUsernameNotUnique = await User.exists({"personal_info.username": username}).then((result) => result)
    if(!isUsernameNotUnique){
        username += nanoid().substring(0, 5)
    } 
    return username
}

server.post("/signup", (req, res) => {
    let { fullname, email, password } = req.body;
    
        if(fullname.length < 3){
            return res.status(400).json({
                "error": "fullname must be longer than 3 letter"
            })
        }
    

    if(!emailRegex.test(email)){
        return res.status(403).json({
            "error": "Enter is Invalid"
        })
    }

    if(!passwordRegex.test(password)){
        return res.status(403).json({
            "error": "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters"
        })
    }

    bcryptjs.hash(password, 10, async (error, hashed_pass) => {

        let username = await generateUsername(email)

        let user = new User({
            personal_info:{fullname, email, password: hashed_pass, username}
        })

        user.save().then((u) => {

            return res.status(200).json(formatDatatoSend(u))

        }).catch(err => {

            if(err.code == 11000){
                return res.status(500).json({"error": "email already exists"})
            }

            return res.status(500).json({
                "error": err.message
            })
        })

    })

})

server.post("/signin", (req, res) => {
    let { email, password } = req.body;
    console.log("first, ", email, password)
    User.findOne({"personal_info.email":email})
    .then((user) => {
        if(!user){
            console.log("email not found")
            return res.status(403).json({"error": "Email not found"})    
        }

        if(!user.google_auth){
            bcryptjs.compare(password, user.personal_info.password, (err, result)=>{
                if(err) {
                    console.log("error: ", err)
                    return res.status(403).json({'Error': "error occured while login please try again "})
                }
                if(!result) {
                    console.log("incorrect password")
                    return res.status(403).json({"error": "Incorrect password"})
                } else {
                    return res.status(200).json(formatDatatoSend(user))
                }
            })                                     
            
        } else{
            return res.status(403).json({"error": "Account was created using google. Try loggin in with google"})
        }
        
    })
    .catch(err => {
        console.log("newError, ", err);
        return res.status(500).json({"error": err.message})
    })
})

server.post("/google-auth", async (req, res)=>{
    let { accessToken } = req.body

    getAuth().verifyIdToken(accessToken).then(async (decodedUser)=>{
        let { email, name, picture } = decodedUser

        picture = picture.replace("s96-c", "s384-c")

        let user = await User.findOne({"personal_info.email":email}).select("personal_info.fullname personal_info.username personal_info.profile_img google_auth")
        .then((u)=>{
            console.log(u)
            return u || null
        }).catch(err=>{
            return res.status(500).json({"error": err.message})
        })

        if(user){
            if(!user.google_auth){
                return res.status(403).json({
                    "error": "This email was signed in without google"
                })
            }
        } else{
            let username = await generateUsername(email);

            user = new User({
                personal_info: { fullname: name, email, username },
                google_auth: true
            })

            await user.save().then((u) => {
                user = u;
            })
            .catch(err => {
                return res.status(500).json({"error": err.message})
            })
        }

        return res.status(200).json(formatDatatoSend(user))
    }).catch(err => {
        return res.status(500).json({
            "error": "Failed to authenticate. Try with another account"
        })
    })
})

server.post("/blog-editor/upload-img", upload.single('img'), async (req, res) => {
    try {
        const response = await uploadOnCloudinary(req.file.path);

        if (response) {
            console.log(response); // Log the URL
            res.json({ msg: "Item received", imageUrl: response });
        } else {
            res.status(500).json({ error: "Error uploading image" });
        }
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

server.post('/latest-blogs', (req, res) => {
    let { page } = req.body
    let maxLimit = 1

    Blog.find({ draft: false }).populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({ blogs })
    })
    .catch(err => {
        console.log("error")
        return res.status(500).json({ error: err.message })
    })
})

server.get('/tending-blogs', (req, res)=>{
    Blog.find({ draft: false })
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "activity.total_reads": -1, "activity.total_likes": -1, "publishedAt": -1 })
    .select("blog_id title publishedAt -_id")
    .limit(5)
    .then(blogs => {
        return res.status(200).json({ blogs })
    })
    .catch(err => {
        return res.status(500).json({error: err.message})
    })
})

server.post('/create-blog', verifyJWT ,(req, res) => {
    
    let authorId = req.user;

    let { title, banner, des, tags, content, draft = undefined } = req.body;

    if(!draft){
        if(!des.length || des.length > 200){
            return res.status(403).json({error: "You must provide blog description under 200 characters"})
        }
    
        if(!banner.length){
            return res.status(403).json({error: "You must provide a banner to publish the blog"})
        }
    
        if(!content.blocks.length){
            return res.status(403).json({error: "There must be some blog content to publish it"})
        }
    
        if(!tags.length || tags.length > 10){
            return res.status(403).json({error: "Provide tags in order to publish the blog , Maximum 10"})
        }
    }

    if(!title.length){
        return res.status(403).json({error: "You must provide a title"})
    }

    

    tags = tags.map(tag => tag.toLowerCase())

    let blog_id = title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, "-").trim() + nanoid()

    let blog = new Blog({
        title, des, banner, content, tags, author: authorId, blog_id, draft: Boolean(draft)
    })

    blog.save().then(blog => {
        let incrementVal = draft ? 0 : 1;

        User.findOneAndUpdate({ _id: authorId }, {
            $inc: { "account_info.total_posts" : incrementVal }, $push: { "blogs": blog._id }
        }).then(user => {
            return res.status(200).json({ id: blog.blog_id })
        })
        .catch((err) => {
            return res.status(500).json({ error: "failed to update total posts number" })
        })

    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })
    
    // return res.json({status: "done"})

})

server.post('/search-blogs', async (req, res)=>{

    let { tag, query, page, author } = req.body

    let findQuery

    if(tag){
        console.log("sadklfj")
        findQuery = { tags: tag, draft: false }
    }

    else if(query){
        findQuery = { draft: false, title: new RegExp(query, 'i')}
    } else if(author){
        findQuery = { author, draft: false }
    }

    let maxLimit = 1
    
    Blog.find(findQuery)
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page-1)*maxLimit)
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({ blogs })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })

})

server.post('/all-latest-blogs-count', (req, res)=>{
    Blog.countDocuments({ draft: false })
    .then(count => {
        return res.status(200).json({ totalDocs: count })
    })
    .catch(err => {
        console.log(err.message)
        return res.status(500).json({error: err.message}) 
    })
})

server.post('/search-blogs-count', (req, res)=>{
    let { tag, query, author } = req.body

    let findQuery
    if(tag){
        findQuery = { tags: tag, draft: false }
    } else if(query){
        findQuery = { draft: false, title: new RegExp(query, 'i')}
    } else if(author){
        findQuery = { author, draft: false }
    }

    Blog.countDocuments(findQuery)
    .then(count => {  
        return res.status(200).json({ totalDocs: count })
    })
    .catch(err => {
        console.log(err.message)
        return res.status(500).json({ error: err.message })
    })
})

server.post('/search-users', (req, res)=>{

    let { query } = req.body

    User.find({ "personal_info.username": new RegExp(query, 'i') }).limit(50)
    .select("personal_info.fullname personal_info.username personal_info.profile_img -_id ")
    .then(users => {
        return res.status(200).json({
            users
        })
    })
    .catch(err => {
        res.status(500).json({
            error: err.message
        })
    })

})

server.post('/get-profile', async (req, res)=>{
    let {username} = req.body
    User.findOne({ "personal_info.username": username })
    .select("-personal_info.password -google_auth -updatedAt -blogs")
    .then(user=>{
        return res.status(200).json({user})
    })
    .catch(err => {
        console.log(err)
        res.status(500).json({err: err.message})
    })
   
})

server.listen(PORT, ()=>{
    console.log("listening on port ", PORT)
})

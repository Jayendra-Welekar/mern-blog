import { useContext, useEffect } from "react"
import { BlogContext } from "../pages/blog.page"
import { Link } from "react-router-dom"
import { UserContext } from "../App"
import { Toaster, toast } from "react-hot-toast"
import axios from "axios"


const BlogInteraction = ()=>{

    let { blog, blog: {_id, title, blog_id, activity, activity: { total_likes, total_comments }, author: {personal_info: {username: author_username}}}, setBlog, isLikedByUser, setIsLikedByUser, setCommentsWrapper } = useContext(BlogContext)

    let { userAuth: { username, accessToken } } = useContext(UserContext)

    useEffect(()=>{

        if( accessToken ){
            //make req to server for like info
            axios.post(import.meta.env.VITE_SERVER_DOMAIN+"/is-liked-by-user", { _id }, {headers: {'Authorization': `Bearer ${accessToken}`}})
            .then(({data: {result}})=>{
                setIsLikedByUser(Boolean(result))
            })
            .catch(err => {
                console.log(err)
            })
        }

    }, [])

    const handleLike = ()=>{
        if(accessToken){
            //like the blog
            setIsLikedByUser(preVal => !preVal)

            !isLikedByUser ? total_likes++ : total_likes--
 
            setBlog({...blog, activity: {...activity, total_likes} })

            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/like-blog", {
                _id, isLikedByUser
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            .then(({ data })=>{
                console.log(data)
            }).catch(err => {
                console.log(err)
            })
        } else {
            //not logged in 
            toast.error("please login to like this blog")
        }
    }

    return (
        <>
        <Toaster />
        <hr  className="border-grey my-2"/>
        <div className="flex gap-6 justify-between">
            <div className="flex gap-3 items-center"> 
                    <button
                        onClick={handleLike}
                        className={"w-10 h-10 rounded-full flex items-center justify-center " + (isLikedByUser ? "bg-red/20 text-red" : "bg-grey/80")}>
                    <i className={`fi fi-${isLikedByUser?'s':'r'}r-heart`}></i> 
                    </button>
                    <p className="text-xl text-dark-grey">{ total_likes }</p>
            
                    <button
                        onClick={() => setCommentsWrapper(preVal => !preVal)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80">
                    <i className="fi fi-rr-comment-dots"></i> 
                    </button>
                    <p className="text-xl text-dark-grey">{ total_comments }</p>
            </div>

            <div className="flex gap-6 items-center">

                {
                    username == author_username ? <Link className="underline hover:text-purple" to={`/editor/${blog_id}`}>Edit</Link> : ""
                }

                <Link target="_blank" to={`https://twitter.com/intent/tweet?text=Read ${title}&url=${location.href}`}><i className="fi fi-brands-twitter text-xl hover:text-twitter"></i></Link>
            </div>
        </div>
        <hr  className="border-grey my-2"/>
        </>
    )
}

export default BlogInteraction
import { useContext, useState } from "react"
import { UserContext } from "../App"
import toast, { Toaster } from "react-hot-toast"
import axios from "axios"
import { BlogContext } from "../pages/blog.page"

const CommentField = ({ action="comment", replyingTo,  index ,setReplying })=>{
    
    let {blog, setBlog, setTotalParentCommentsLoaded, blog: { _id, author: { _id: blog_author}, comments, comments: {results: commentsArray}, activity,activity: {total_comments, total_parent_comments} } } = useContext(BlogContext)

    let { userAuth: {accessToken, username, fullname, profile_img} } = useContext(UserContext)

    const [comment, setComment] = useState("")

    const handleComment = ()=>{

        if(!accessToken){
            return toast.error("Login to leave a comment")
        } 

        if(!comment.length){
            return toast.error("Write something in the comment")
        }

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/add-comment", {
            _id, blog_author, comment, replyingTo
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(({ data })=>{

            setComment("")

            data.commented_by = { personal_info: { username, profile_img, fullname } }
            
            let newCommentArray;

            if(replyingTo){

                commentsArray[index].children.push(data._id);

                data.childrenLevel = (commentsArray[index].childrenLevel + 1)
                console.log(data.childrenLevel)
                data.parentIndex = index;   

                commentsArray[index].isReplyLoaded = true

                console.log("This is new comments Array", commentsArray)


                commentsArray.splice(index+1, 0, data)


                newCommentArray = commentsArray

                setReplying(false)

            }else{
                data.childrenLevel = 0
                newCommentArray = [ data, ...commentsArray ]
            }

           

            let parentCommentIncrementVal = replyingTo ? 0 : 1;

            setBlog({...blog, comments: { ...comments, results:newCommentArray }, activity: {...activity, total_comments: total_comments + 1, total_parent_comments: total_parent_comments+parentCommentIncrementVal }})

            setTotalParentCommentsLoaded(preVal => preVal + parentCommentIncrementVal)

        })
        .catch(err => {
            console.log(err)
        })
        
    }

    return (
        <>
            <Toaster />
            <textarea value={comment} placeholder="Leave a comment..." className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto" onChange={(e)=>setComment(e.target.value)}></textarea>
            <button onClick={handleComment} className="btn-dark mt-5 px-10">{action}</button>
        </>
    )
}

export default CommentField
import { Link, useNavigate, useParams } from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { useContext, useEffect } from "react";
import { EditorContext } from "../pages/editor.pages";
import EditorJs from "@editorjs/editorjs"
import { tools } from "./tools.component";
import { UserContext } from "../App";

const BlogEditor = () => {

  let navigate = useNavigate()

    let { blog, blog: {title, banner, content, tags, des }, setBlog, textEditor ,setTextEditor, setEditorState, editorState } = useContext(EditorContext)
    let {blog_id} = useParams()
    let { userAuth: {accessToken} } = useContext(UserContext)

    useEffect(()=>{
      if(!textEditor.isReady){
        setTextEditor(new EditorJs({
          holderId: "textEditor",
          data: Array.isArray(content) ? content[0] : content,
          tools: tools,
          placeholder: "Let's write an awesome story"
        }))
      }
    }, [])

  const handleBannerUpload = async (e) => {
    try {
      console.log(e.target.files[0])
      let img = e.target.files[0];
      if (img) {

        let loadingToast = toast.loading("Uploading...")

        const formData = new FormData();
        formData.append("img", img);

        const response = await axios.post(
          import.meta.env.VITE_SERVER_DOMAIN + "/blog-editor/upload-img",
          formData
        );

        const bannerImg = response.data.imageUrl.url
        
        if(bannerImg)  {
            toast.dismiss(loadingToast)
            toast.success("Uploaded")

            setBlog({...blog, banner: bannerImg})


        } else{
            return toast.error("image not uplaoded properly. Please retry")
        }
 
      } else {
        return toast.error("image not uplaoded. Please retry")
      }
    } catch (error) {
    //   return toast.error("erro");
    }
  };

  const handleTitleKeydown = (e) =>{
    console.log(e)
    if(e.keyCode == 13){
        e.preventDefault()
    }
  } 

  const handleTitleChange = (e)=>{
    let input = e.target
    input.style.height = "auto"
    input.style.height = input.scrollHeight + "px"


    setBlog({ ...blog, title: input.value })

 }

 const handleError = (e)=>{
  let img = e.target

  img.src = defaultBanner
 }

 const handlePublish = (e)=>{
    if(!banner.length) {
      return toast.error("upload a blog banner to publish it")
    }

    if(!title.length){
      return toast.error("Write blog title to publish it")
    }

    if(textEditor.isReady) {
      textEditor.save().then((data) => {

        if(data.blocks.length) {

          setBlog({...blog, content: data})
          setEditorState("publish")

        } else {
           return toast.error("Write something in your blog to publish it")
        }
      }).catch((err) => {
        console.log(err)
      })
    }

 }
 
 const handleSaveDraft = (e) => {

        if(e.target.className.includes("disable")){
            return;
        }

        if(!title.length){
            return toast.error("Write blog title before saving it as a draft")
        }

        let loadingToast = toast.loading("Saving Draft...")

        e.target.classList.add('disable')

        if(textEditor.isReady){
          textEditor.save().then(content => {
            let blogObj = {
              title, banner, des, content, tags, draft: true
          }
  
  
  
          axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", {...blogObj, id: blog_id}, {
              headers: {
                  'Authorization': `Bearer ${accessToken}`
              }
          })
          .then(() => {
              
              e.target.classList.remove('disable')
  
              toast.dismiss(loadingToast)
              toast.success("Saved 👍")
  
              setTimeout(() => {
                  navigate("/")
              }, 500)
  
          })
          .catch(( { response } )=>{
              e.target.classList.remove('disable')
              e.target.classList.remove('disable')
  
              toast.error(response.data.error)
          })
          })
        }

        
 }

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={logo} />
        </Link>
        <p className="max-md:hidden text-black ">
            { title.length ? title : "New Blog" }
        </p>

        <div className="flex gap-3 ml-auto">
          <button className="btn-dark py-2" onClick={ handlePublish }>Publish</button>
          <button className="btn-light py-2" onClick={handleSaveDraft} >Save Draft</button>
        </div>
      </nav>
      <Toaster />

      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            <div className="relative aspect-video hover:opacity-[80%] bg-white border-4 border-grey">
              <label htmlFor="uploadBanner">
                <img
                 src={banner} className="z-20 object-contain"
                 onError = {handleError}   />
                 
                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>

            <textarea 
                defaultValue={title}
                placeholder="Blog Title"    
                className="text-4xl font-medium w-full h-20 resize-none mt-10 leading-tight placeholder:opacity-40"
                onKeyDown={handleTitleKeydown}
                onChange={handleTitleChange}
            >

            </textarea>

            <hr className="w-full opacity-20 my-5"/>

            <div id="textEditor" className="font-gelasio"></div>

          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;

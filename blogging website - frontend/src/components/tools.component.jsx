import  Embed from "@editorjs/embed"
import  List from "@editorjs/list"
import  Image from "@editorjs/image"
import Header from "@editorjs/header"
import Quote from "@editorjs/quote"
import Marker from "@editorjs/marker" //highlight
import InlineCode from "@editorjs/inline-code"
import { toast } from "react-hot-toast"
import axios from "axios"

const uploadImageByUrl = (e) => {
    let link = new Promise((resolve, reject) => {
        try{
            resolve(e)
        } 
        catch(err){
            reject(err)
        }
    })

    return link.then(url => {  
        return {
            success: 1,
            file: { url }
        }
    })
}

const uploadImageByFileInner = async (e) => {
    try {
        if (!e) {
            return toast.error("Image not uploaded. Please retry.");
        }

        const img = e;

        let loadingToast = toast.loading("Uploading...");

        const formData = new FormData();
        formData.append("img", img);

        const response = await axios.post(
            import.meta.env.VITE_SERVER_DOMAIN + "/blog-editor/upload-img",
            formData
        );

        const imageUrl = response.data.imageUrl.url;

        if (imageUrl) {
            toast.dismiss(loadingToast);
            toast.success("Image uploaded successfully.");
            return imageUrl

        } else {
            toast.error("Image not uploaded properly. Please retry.");
            
        }
    } catch (error) {
        console.error(error);
        toast.error("Error uploading image. Please try again.");
        
    }
};


const uploadImageByFile  = (e) =>{
    return uploadImageByFileInner(e).then(url => {
        console.log(url)
        return {
            success: 1,
            file: { url }
        }
    })
}

export const tools = {
    embed: Embed,
    list:{ 
        class: List,
        inlineToolbar: true
    }, 
    image: {
        class: Image,
        config: {
            uploader: {
                uploadByUrl: uploadImageByUrl,
                uploadByFile: uploadImageByFile
            }
        }
    },
    quote: Quote,
    header: {
        class: Header,
        config: {
            placeholder: "Type Heading....",
            levels: [2, 3],
            defaultLevel: 2
        }
    },
    marker: Marker,
    inlineCode: InlineCode
}
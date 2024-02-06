import { useContext, useEffect, useState } from "react"
import AnimationWrapper from "../common/page-animation"
import InPageNavigation from "../components/inpage-navigation.component"
import axios from "axios"
import Loader from "../components/loader.component"
import BlogPostCard from "../components/blog-post.component"
import MinimalBlogPost from "../components/nobanner-blog-post.component"
import { activeTabRef } from "../components/inpage-navigation.component"
import NoDataMessage from "../components/nodata.component"
import { filterPaginationData } from "../common/filter-pagination-data"
import LoadMoreDataBtn from "../components/load-more.component"
import { UserContext } from "../App"

const HomePage = () => {

    let [blogs, setBlog] = useState(null)
    let [trendingBlogs, setTrendingBlog] = useState(null)
    let [ pageState, setPageState ] = useState("home")

    let item = sessionStorage.getItem("user")

    let accessToken = null
    if(item){
        let token = JSON.parse(item).accessToken
        accessToken = token
    } 
    


    let categories = ["programming", "hollywood", "film making", "social media", "cooking", "tech", "finances", "travel"]

    const fetchLatestBlogs = ({page= 1}) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs", { page, accessToken })
            .then(async ({ data }) => {
                let formatData = await filterPaginationData({
                    state: blogs,
                    data: data.blogs,
                    page,
                    countRoute: "/all-latest-blogs-count"
                })
                setBlog(formatData)
            })
            .catch(err => {
                console.log(err)
            })

    }

    const fetchTrendingBlogs = () => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/tending-blogs")
            .then(({ data }) => {
                setTrendingBlog(data.blogs)
            })
            .catch(err => {
                console.log(err)
            })
    }

    useEffect(() => {
        
        activeTabRef.current.click()

        if(pageState == "home"){
            fetchLatestBlogs({page: 1})
        } else {
            fetchBlogByCategory({ page: 1 })
        }

        if(!trendingBlogs){
            fetchTrendingBlogs()
        }

    }, [pageState])

    const loadBlogCategory = (e)=>{
        let category = e.target.innerText.toLowerCase()

        setBlog(null)

        if(pageState === category){
            setPageState("home");
            return
        }

        setPageState(category)
    } 
    const fetchBlogByCategory = ({ page = 1 })=>{
        
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {tag: pageState})
            .then( async  ({ data }) => {

                let formatData = await filterPaginationData({
                    state: blogs,
                    data: data.blogs,
                    page,
                    countRoute: "/search-blogs-count",
                    data_to_send: { tag:pageState, page }
                })

                setBlog(formatData)
            })
            .catch(err => {
                console.log(err)
            })
    }

    return (
        <AnimationWrapper>
            <section className="h-cover flex justify-center gap-10">
                {/* latest blogs */}
                <div className="w-full">
                    <InPageNavigation routes={[pageState, "Trending Blogs"]} defaultHidden={["Trending Blogs"]}>

                        <>
                            {
                                (blogs == null ? <Loader /> : blogs.results.length ? (blogs.results.map((blog, i) => {
                                    return <AnimationWrapper transition={{ duration: 1, delay: i * .1 }} key={i} >
                                        <BlogPostCard content={blog} author={blog.author.personal_info} />
                                    </AnimationWrapper>
                                })) : <NoDataMessage message="No Blogs Published" />)
                            }
                            <LoadMoreDataBtn state={blogs} fetchDataFun = {(pageState == "home" ? fetchLatestBlogs : fetchBlogByCategory)} />
                        </>

                        {
                            trendingBlogs == null ? <Loader /> : trendingBlogs.length ? (trendingBlogs.map((blog, i) => {
                                return <AnimationWrapper key={i} transition={{ duration: 1, delay: i * .1 }} >
                                    <MinimalBlogPost blog={blog} index={i} />
                                </AnimationWrapper>
                            })) : <NoDataMessage message="No Blogs Published" />
                        }


                    </InPageNavigation>
                </div>

                {/* filters and trending blogs */}
                <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
                    <div className="flex flex-col gap-10">

                        <div>
                            <h1 className="font-medium text-xl mb-8">Stories from all interests</h1>

                            <div className="flex gap-3 flex-wrap">
                                {
                                    categories.map((category, i) => {
                                        return <button className={"tag " + (pageState == category ? "bg-black text-white" : "")} key={i} onClick={loadBlogCategory}>
                                            {category}
                                        </button>
                                    })
                                }
                            </div>
                        </div>


                        <div>
                            <h1 className="font-medium text-xl mb-8">Trending <i className="fi fi-rr-arrow-trend-up" /></h1>

                            {
                                trendingBlogs == null ? <Loader /> :  (trendingBlogs.length ? (trendingBlogs.map((blog, i) => {
                                    return <AnimationWrapper key={i} transition={{ duration: 1, delay: i * .1 }} >
                                        <MinimalBlogPost blog={blog} index={i} />
                                    </AnimationWrapper>
                                })) : <NoDataMessage message="No Trending blogs" />)
                            }
                        </div>
                    </div>
                </div>
            </section>
        </AnimationWrapper>
    )
}

export default HomePage
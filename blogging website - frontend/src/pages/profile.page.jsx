import axios from "axios";
import { useScroll } from "framer-motion";
import { useContext, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { UserContext } from "../App";
import AboutUser from "../components/about.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import InPageNavigation from "../components/inpage-navigation.component";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import PageNotFound from "./404.page";

export const profileDataStructure = {
    personal_info: {
        fullname: "",
        username: "",
        profile_img: "",
        bio: "",
    },
    account_info: {
        total_posts: 0,
        total_blogs: 0,
    },
    follow: {
        followed_by: [],
        following: [],
    },
    social_links: {},
    joinedAt: " ",
};

const ProfilePage = () => {
    const followBtnRef = useRef(null)
    let { id: profileId } = useParams();
    let [profile, setProfile] = useState(profileDataStructure);
    let [loading, setLoading] = useState(true);
    let [blogs, setBlogs] = useState(null);
    let [profileLoaded, setProfileLoaded] = useState("");
    let [isFollowing, setIsFollowing] = useState();
    let [followersCount, setFollowers] = useState();
    let [followingCount, setFollowing] = useState();
    let [showFollowers, setShowFollowers] = useState(false);
    let [showFollowing, setShowFollowing] = useState(false);
    let [followedBy, setFollowedBy] = useState([]);
    let [followingTo, setFollowingTo] = useState([]);

    let {
        follow: { followed_by, following },
        _id,
        personal_info: { fullname, username: profile_username, profile_img, bio },
        account_info: { total_posts, total_reads },
        social_links,
        joinedAt,
    } = profile;
    let {
        userAuth: { accessToken, username },
    } = useContext(UserContext);

    const fetchUserProfile = () => {
        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-profile", {
                username: profileId,
            })
            .then((data) => {
                if (data.data.user != null) {
                    setProfile(data.data.user);
                    data.data.user.follow.followed_by.map((userId) => {
                        axios
                            .post(
                                import.meta.env.VITE_SERVER_DOMAIN + "/get-minimal-profile",
                                { userId }
                            )
                            .then((user) => {
                                if (user.data.user) {
                                    setFollowedBy((prev) => [...prev, user.data.user]);
                                    console.log(user.data.user);
                                }
                            });
                    });
                    data.data.user.follow.following.map((userId) => {
                        axios
                            .post(
                                import.meta.env.VITE_SERVER_DOMAIN + "/get-minimal-profile",
                                { userId }
                            )
                            .then((user) => {
                                if (user.data.user) {
                                    setFollowingTo((prev) => [...prev, user.data.user]);
                                    console.log(user.data.user);
                                }
                            });
                    });
                }
                setProfileLoaded(profileId);
                getBlogs({ user_id: data.data.user._id });
                setLoading(false);
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
            });
    };

    const getBlogs = ({ page = 1, user_id }) => {
        user_id = user_id == undefined ? blogs.user_id : user_id;

        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {
                author: user_id,
                page,
            })
            .then(async ({ data }) => {
                let formatedData = await filterPaginationData({
                    state: blogs,
                    data: data.blogs,
                    page,
                    countRoute: "/search-blogs-count",
                    data_to_send: { author: user_id },
                });

                formatedData.user_id = user_id;
                setBlogs(formatedData);
            });
    };

    useEffect(() => {
        setFollowers(followed_by.length);
        setFollowing(following.length);
        if(followBtnRef.current){followBtnRef.current.setAttribute("disabled", true)}
        axios
            .post(
                import.meta.env.VITE_SERVER_DOMAIN + "/get-following",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            )
            .then(({ data }) => {
                setIsFollowing(data.user.follow.following.includes(_id));
                followBtnRef.current.removeAttribute("disabled")
            });

        setIsFollowing(followed_by.includes(username));

        if (profileId != profileLoaded) {
            setBlogs(null);
        }

        if (blogs == null) {
            resetState();
            fetchUserProfile();
        }
    }, [profileId, blogs]);

    const resetState = () => {
        setProfile(profileDataStructure);
        setProfileLoaded("");
        setLoading(true);
    };

    const handleFollow = (e) => {
        e.target.setAttribute("diabled", true);

        let route =
            import.meta.env.VITE_SERVER_DOMAIN +
            (isFollowing ? "/handle-unfollow" : "/handle-follow");
        axios
            .post(
                route,
                { profile_id: _id },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            )
            .then((res) => {
                setFollowers((prev) => (isFollowing ? prev - 1 : prev + 1));
                setIsFollowing((prev) => !prev);
                e.target.removeAttribute("disabled");
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleQuickFollow = (e) => {
        console.log(e.target.innerHTML);
        e.target.setAttribute("diabled", true);

        let route =
            import.meta.env.VITE_SERVER_DOMAIN +
            (e.target.innerHTML != "Follow" ? "/handle-unfollow" : "/handle-follow");
        axios
            .post(
                route,
                { profile_id: e.target.value },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            )
            .then((res) => {
                e.target.removeAttribute("disabled");
                if (e.target.innerHTML == "Follow") {
                    e.target.innerHTML = "Unfollow";
                } else {
                    e.target.innerHTML = "Follow";
                }
            })
            .catch((err) => {
                console.log(err);
            });
    };

    return (
        <AnimationWrapper>
            {showFollowers ? (
                <>
                <div style={{zIndex: "199"}} className="fixed top-0 left-0 w-full h-full bg-white bg-opacity-80" />
                <div
                    style={{ zIndex: "200" }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[80%] w-[450px] bg-white border-2 border-grey rounded-md flex flex-col"
                >
                    <div className="block flex border-b-2 border-grey p-8 justify-between items-center">
                        <p className="text-2xl ">Followers</p>
                        <button
                            onClick={() => {
                                setShowFollowers((p) => !p);
                            }}
                        >
                            <i className="fi fi-rr-cross cursor-pointer"></i>
                        </button>
                    </div>
                    <div className="overflow-x-auto ">
                    {followedBy.length &&
                        followedBy.map((user, i) => {
                            let isFollow = false
                            if(following.length){
                                isFollow = following.includes(user._id);
                            }
                            console.log(isFollow);  
                            return (
                                <AnimationWrapper key={i} transition={{duration: 1, delay: i*0.08}}>
                                <div
                                    key={i}
                                    className="px-8 py-4 flex justify-between items-center transition"
                                >
                                    <div className="flex gap-4 items-center">
                                        <img
                                            src={user.personal_info.profile_img}
                                            className="h-12 w-12 rounded-full"
                                        />
                                        <div>
                                            <p className="text-xl black">
                                                {user.personal_info.fullname}
                                            </p>
                                            <a
                                                href={`/user/${user.personal_info.username}`}
                                                className="grey underline"
                                            >
                                                @{user.personal_info.username}
                                            </a>
                                        </div>
                                    </div>
                                    {user.personal_info.username == username ? null : (
                                        <button
                                            className="btn-light p-2 px-4"
                                            onClick={handleQuickFollow}
                                            value={user._id}
                                        >
                                            {!isFollow ? "Follow" : "Unfollow"}
                                        </button>
                                    )}
                                </div>
                                </AnimationWrapper>
                            );
                        })}
                        </div>
                </div></>
            ) : null}

            {showFollowing ? (
                <div
                    style={{ zIndex: "200" }}
                    className="overflow-x-auto fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[80%] w-[450px] bg-white border-2 border-grey rounded-md flex flex-col"
                >
                    <div className="block flex p-8 border-b-2 border-grey justify-between items-center">
                        <p className="text-2xl ">Following</p>
                        <button
                            onClick={() => {
                                setShowFollowing((p) => !p);
                            }}
                        >
                            <i className="fi fi-rr-cross"></i>
                        </button>
                    </div>
                    {following.length &&
                        followingTo.map((user, i) => {
                            return (
                                <div key={i} className="p-8 flex justify-between items-center">
                                    <div className="flex gap-4 items-center">
                                        <img
                                            src={user.personal_info.profile_img}
                                            className="h-10 w-10 rounded-full"
                                        />
                                        <div>
                                            <p className="text-lg black">
                                                {user.personal_info.fullname}
                                            </p>
                                            <a
                                                href={`/user/${user.personal_info.username}`}
                                                className="grey underline"
                                            >
                                                @{user.personal_info.username}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            ) : null}

            {loading ? (
                <Loader />
            ) : profile_username.length ? (
                <section className="touch-none h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12">
                    <div className="flex flex-col max-md:items-center gap-5 min-w-[250px] md:w-[50%] md:pl-8 md:border-l border-grey md:sticky md:top-[100px] md:py-10">
                        <img
                            src={profile_img}
                            className="w-48 h-48 rounded-full bg-grey md:w-32 md:h-32"
                            alt=""
                        />

                        <h1 className="text-2xl font-medium">@{profile_username}</h1>
                        <p className="text-xl capitalize h-6">{fullname}</p>

                        <div className="flex gap-8">
                            <p>{total_posts.toLocaleString()} Blogs</p>
                            <p
                                className="cursor-pointer"
                                onClick={() => {
                                    setShowFollowers((p) => {
                                        if(!p){
                                            setShowFollowing(false)
                                        }
                                        return !p});
                                }}
                            >
                                {followersCount} followers
                            </p>
                            <p
                                className="cursor-pointer"
                                onClick={() => {
                                    setShowFollowing((p) => {
                                        if(!p){
                                            setShowFollowers(false)
                                        }
                                        return !p});
                                }}
                            >
                                {followingCount} following
                            </p>
                        </div>

                        <p>{total_reads.toLocaleString()} Reads</p>

                        {username == profile_username ? null : (
                            <button ref={followBtnRef} className="btn-light" onClick={handleFollow}>
                                {isFollowing ? "Unfollow" : "Follow"}
                            </button>
                        )}

                        <div className="flex gap-4 mt-2">
                            {profileId == username ? (
                                <Link
                                    to="/settings/edit-profile"
                                    className="btn-light rounded-md"
                                >
                                    Edit Profile
                                </Link>
                            ) : (
                                " "
                            )}
                        </div>

                        <AboutUser
                            className="max-md:hidden"
                            bio={bio}
                            social_links={social_links}
                            joinedAt={joinedAt}
                        />
                    </div>

                    <div className="max-md:mt-12 w-full">
                        <InPageNavigation
                            routes={["Blogs Published", "About"]}
                            defaultHidden={["About"]}
                        >
                            <>
                                {blogs == null ? (
                                    <Loader />
                                ) : blogs.results.length ? (
                                    blogs.results.map((blog, i) => {
                                        return (
                                            <AnimationWrapper
                                                key={i}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                            >
                                                <BlogPostCard
                                                    content={blog}
                                                    author={blog.author.personal_info}
                                                />
                                            </AnimationWrapper>
                                        );
                                    })
                                ) : (
                                    <NoDataMessage message="No Blogs Published" />
                                )}
                                <LoadMoreDataBtn state={blogs} fetchDataFun={getBlogs} />
                            </>

                            <AboutUser
                                bio={bio}
                                social_links={social_links}
                                joinedAt={joinedAt}
                            />
                        </InPageNavigation>
                    </div>
                </section>
            ) : (
                <PageNotFound />
            )}
        </AnimationWrapper>
    );
};
export default ProfilePage;

import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup  } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAm2_frJFQHJqGycyW4NMJRlt70JYdpLOs",
  authDomain: "reactjs-blog-4ca96.firebaseapp.com",
  projectId: "reactjs-blog-4ca96",
  storageBucket: "reactjs-blog-4ca96.appspot.com",
  messagingSenderId: "734909991245",
  appId: "1:734909991245:web:11f6e5baa8685c22330f04"
};

const app = initializeApp(firebaseConfig);

//google auth
const provider = new GoogleAuthProvider()

const auth = getAuth();

export const authWithGoogle = async () => {
    
    let user = null

    await signInWithPopup(auth, provider).then(result =>{
        user = result.user
    }).catch((err)=>{
        console.log(err)
    })

    return user;

}
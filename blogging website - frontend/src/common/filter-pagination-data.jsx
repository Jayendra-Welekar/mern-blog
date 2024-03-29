import axios from "axios";

export const filterPaginationData = async ({ create_new_arr = false, state, data, page, countRoute, data_to_send ={  }, user = undefined}) => {
    let obj;

    let headers = {}

    if(user){
        headers.headers = {
            'Authorization': `Bearer ${user}`
        }
    }

    if(state != null && !create_new_arr) {
        obj = { ...state, results: [ ...state.results, ...data], page: page}
    } else{
        let newData = { ...data_to_send, page }
        await axios.post(import.meta.env.VITE_SERVER_DOMAIN + countRoute, newData, headers)
        .then(({data: { totalDocs }}) => {
            obj = { results: data, page, totalDocs}
        })
        .catch(err => {
            console.log(err)
        })

    }

    return obj
}
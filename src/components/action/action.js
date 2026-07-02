import { authClient } from "@/lib/auth-client"
import { useEffect, useState } from "react";
// get user from session
export const GetUser = () => {
    const user = authClient.useSession();
    const { data: session, isPending } = user;
    return session;
}



// get user messid
export const GetUserMessId = () => {
    const[messId, setMessId] = useState(null);
    const user = GetUser();
    const userId = user?.user?.id;
      useEffect(() => {
        if(!userId) return;
     
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/member/messid/${userId}`)
        // .then((res) => res.json())
        .then((data) => {
        console.log("messId data", data);
        setMessId(data?.messId);
         
        //   if (data.createdAt) setJoiningDate(new Date(data.createdAt));
        });

    }, [userId]);
    return messId;
}
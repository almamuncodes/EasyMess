import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import axios from "axios";

// get user from session (custom hook)
export const useUser = () => {
    const { data: session } = authClient.useSession();
    return session;
};

export const GetUser = useUser;

// get user messid
export const GetUserMessId = () => {
    const [messId, setMessId] = useState(null);
    const user = useUser();
    const userId = user?.user?.id;
    
    useEffect(() => {
        if (!userId) return;
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/member/messid/${userId}`)
            .then((res) => {
                setMessId(res.data?.messId);
            })
            .catch((err) => console.error("Error in GetUserMessId:", err));
    }, [userId]);

    return messId;
};
import { authClient } from "@/lib/auth-client"
// get user from session
export const GetUser = () => {
    const user = authClient.useSession();
    const { data: session, isPending } = user;
    return session;
}



// get user messid
export const GetUserMessId = async () => {
     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/member/messid/${userId}`);
        const data = await res.json();
}
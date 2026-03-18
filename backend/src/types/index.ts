//Shape of the JWT payload we encode when a user logs in
export interface AuthPayload{
    userId:string;
    email:string;
}

//t's like telling TypeScript: 
//"I know Express's Request doesn't officially have a user field,
 //but my auth middleware adds one at runtime,
 //so please don't complain when I access req.user
declare global{
    namespace Express{
        interface Request{
            user?: AuthPayload; 
        }
    }
}
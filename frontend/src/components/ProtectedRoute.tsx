import {Navigate} from 'react-router-dom'
import { useAuth } from '../context/useAuth';

//Wraps any route that requires authentication 
//If not logged in, redirects to login page 

export default function ProtectedRoute({ children} :{children:React.ReactNode}){
    const { isAuthenticated } = useAuth();

    if(!isAuthenticated){
        return <Navigate to="/login" replace />;
    }

    return <> { children } </>;
}
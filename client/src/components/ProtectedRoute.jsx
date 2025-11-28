import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getValidToken } from '../utils/auth';

/**
 * ProtectedRoute component to guard routes requiring authentication
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} [props.allowedRoles] - Array of roles allowed to access this route
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(null);

    useEffect(() => {
        const checkAuth = () => {
            const token = getValidToken();
            const userStr = localStorage.getItem('user');

            if (!token || !userStr) {
                setIsAuthenticated(false);
                return;
            }

            try {
                const user = JSON.parse(userStr);
                setIsAuthenticated(true);

                // Check role authorization if roles are specified
                if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                    setIsAuthorized(false);
                } else {
                    setIsAuthorized(true);
                }
            } catch (error) {
                console.error("Error parsing user data:", error);
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, [allowedRoles]);

    // Show nothing while checking authentication state
    if (isAuthenticated === null) {
        return null; // Or a loading spinner
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    // Redirect to appropriate dashboard if authenticated but not authorized
    if (isAuthorized === false) {
        const user = JSON.parse(localStorage.getItem('user'));
        let redirectPath = '/';

        if (user.role === 'student') redirectPath = '/student-dashboard';
        else if (user.role === 'teacher') redirectPath = '/teacher-dashboard';
        else if (user.role === 'parent') redirectPath = '/parent-dashboard';

        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default ProtectedRoute;

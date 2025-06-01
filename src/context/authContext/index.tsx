import React, { useEffect, useState, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { AppUser, AuthContextType } from "../../types/user";

interface AuthProviderProps {
  children: React.ReactNode;
}
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [isEmailUser, setIsEmailUser] = useState<boolean>(false);
  const [isGoogleUser, setIsGoogleUser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, initializeUser);
    return unsubcribe;
  }, []);

  async function initializeUser(user: User | null) {
    if (user) {
      const appUser: AppUser = {
        ...user,
        isEmailUser: user.providerData.some(
          (provider) => provider.providerId === "password"
        ),
        isGoogleUser: user.providerData.some(
          (provider) => provider.providerId === "google.com"
        ),
        firestoreData: undefined,
      };
      setCurrentUser(appUser);
      setIsGoogleUser(appUser.isGoogleUser);
      setIsEmailUser(appUser.isEmailUser);
      setUserLoggedIn(true);
    } else {
      setCurrentUser(null);
      setUserLoggedIn(false);
      setIsEmailUser(false);
      setIsGoogleUser(false);
    }
    setLoading(false);
  }
  const value: AuthContextType = {
    userLoggedIn,
    isEmailUser,
    isGoogleUser,
    currentUser,
    setCurrentUser,
    isAuthenticated: userLoggedIn,
  };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

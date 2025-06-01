import { User } from "firebase/auth";

/**
 * Represents the user data stored in Firestore
 */
export interface FirestoreUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date | string;
  lastLoginAt?: Date | string;
  // Add any additional user fields you store in Firestore
}

/**
 * Extended user type that combines Firebase Auth User with our custom Firestore data
 */
export interface AppUser extends User {
  firestoreData?: FirestoreUser;
  isEmailUser: boolean;
  isGoogleUser: boolean;
}

/**
 * Auth context value type
 */
export interface AuthContextType {
  currentUser: AppUser | null;
  userLoggedIn: boolean;
  isEmailUser: boolean;
  isGoogleUser: boolean;
  setCurrentUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  isAuthenticated: boolean;
  // Add any additional auth methods you expose through the context
}

/**
 * User registration data type
 */
export interface RegistrationData {
  email: string;
  password: string;
  displayName?: string;
  // Add any additional registration fields
}

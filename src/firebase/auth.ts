import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";

export const doCreateUserWithEmailAndPassword = async (
  email: string,
  password: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      name: user.displayName || "",
    });
    console.log("User signed up: ", user.email);
    return user;
  } catch (error) {
    console.error("Error signing up: ", error);
  }
};

export const doSignInWithEmailAndPassword = async (
  email: string,
  password: string
) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const doSignInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      console.log("User already exists in Firestore: ", user.email);
      return user;
    } else {
      await setDoc(
        doc(db, "users", user.uid),
        {
          email: user.email,
          name: user.displayName || "",
        },
        {
          merge: true,
        }
      );
    }

    console.log("User signed up: ", user.email);
    return user;
  } catch (error) {
    console.error("Error signing up: ", error);
  }
};

export const doSignOut = () => {
  return auth.signOut();
};

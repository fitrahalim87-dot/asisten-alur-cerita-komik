import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer,
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  where,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

// Platform custom error schema
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Ensure connection helper
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test-connection-doc', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Generate an automatic human-friendly license key e.g. STORY-XXXX-XXXX-XXXX
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `STORY-${segment()}-${segment()}-${segment()}`;
}

// Save or retrieve user profile
export async function saveUserProfile(user: FirebaseUser) {
  const userRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      const payload = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, payload);
      return payload;
    }
    return userDoc.data();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

// Fetch or automatically create the user's license
export async function getUserLicense(user: FirebaseUser) {
  const colRef = collection(db, 'licenses');
  const q = query(colRef, where('userId', '==', user.uid));
  try {
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docs = snap.docs.map(d => d.data());
      // Prefer an active license if they have multiple
      const activeLic = docs.find(d => d.status === 'active');
      if (activeLic) {
        return activeLic;
      }
      return docs[0];
    }

    // Auto-create a brand new license for the user since none exists
    const key = generateLicenseKey();
    const licRef = doc(db, 'licenses', key);
    const isAdmin = user.email === 'pasukangaming@gmail.com';
    const payload = {
      licenseId: key,
      licenseKey: key,
      userId: user.uid,
      email: user.email || '',
      status: isAdmin ? 'active' : 'inactive',
      createdAt: new Date().toISOString()
    };
    await setDoc(licRef, payload);
    return payload;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'licenses');
  }
}

// Activate / claim an inactive pre-generated license key for the user
export async function activateLicenseKey(licenseKey: string, user: FirebaseUser) {
  const cleanKey = licenseKey.trim().toUpperCase();
  const licRef = doc(db, 'licenses', cleanKey);
  try {
    const licDoc = await getDoc(licRef);
    if (!licDoc.exists()) {
      throw new Error('Kunci lisensi tidak valid atau belum terdaftar di database!');
    }
    
    const data = licDoc.data();
    if (data.status === 'active') {
      if (data.userId === user.uid) {
        return data; 
      } else {
        throw new Error('Kunci lisensi ini sudah aktif dan terikat ke akun Google lain!');
      }
    }
    
    // Associate and activate
    const payload = {
      ...data,
      userId: user.uid,
      email: user.email || '',
      status: 'active',
      activatedAt: new Date().toISOString()
    };
    await setDoc(licRef, payload, { merge: true });
    return payload;
  } catch (err) {
    if (err instanceof Error && (err.message.includes('tidak valid') || err.message.includes('sudah aktif') || err.message.includes('terikat'))) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `licenses/${cleanKey}`);
  }
}

// Developer creates unassigned license key to be sent to user
export async function createPoolLicense(customKey?: string) {
  const key = customKey ? customKey.trim().toUpperCase() : generateLicenseKey();
  const licRef = doc(db, 'licenses', key);
  try {
    const payload = {
      licenseId: key,
      licenseKey: key,
      userId: '',
      email: '',
      status: 'inactive',
      createdAt: new Date().toISOString()
    };
    await setDoc(licRef, payload);
    return payload;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `licenses/${key}`);
  }
}

// For Admin usage to fetch all licenses
export async function fetchAllLicenses() {
  const colRef = collection(db, 'licenses');
  try {
    const snap = await getDocs(colRef);
    return snap.docs.map(d => d.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'licenses');
  }
}

// For Admin usage to update/activate a license
export async function updateLicenseStatus(licenseId: string, status: 'active' | 'inactive') {
  const licRef = doc(db, 'licenses', licenseId);
  try {
    await updateDoc(licRef, {
      status,
      activatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `licenses/${licenseId}`);
  }
}

// For Admin usage to delete a license
export async function deleteLicense(licenseId: string) {
  const licRef = doc(db, 'licenses', licenseId);
  try {
    await deleteDoc(licRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `licenses/${licenseId}`);
  }
}

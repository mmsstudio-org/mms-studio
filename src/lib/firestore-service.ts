import { db } from './firebase';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, deleteDoc, getDoc } from 'firebase/firestore';
import type { Product, AppDetail, Feature, SiteInfo } from './types';

// Collections
const productsCollection = collection(db, 'products');
const appsCollection = collection(db, 'apps');
const siteInfoCollection = collection(db, 'site-info');
const featuresCollection = collection(db, 'features');


// Product Functions
export async function getProductsForApp(appId: string): Promise<Product[]> {
    const q = query(productsCollection, where('appId', '==', appId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<void> {
    await addDoc(productsCollection, product);
}

export async function updateProduct(productId: string, product: Partial<Product>): Promise<void> {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, product);
}

export async function deleteProduct(productId: string): Promise<void> {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
}


// App (Category) Functions
export async function getApps(): Promise<AppDetail[]> {
    const querySnapshot = await getDocs(appsCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppDetail));
}

export async function getApp(appId: string): Promise<AppDetail | null> {
    const docRef = doc(db, 'apps', appId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AppDetail;
    }
    return null;
}

// Feature Functions
export async function getFeatures(): Promise<Feature[]> {
    const querySnapshot = await getDocs(featuresCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feature));
}

// Site Info Functions
export async function getSiteInfo(): Promise<SiteInfo> {
    const docRef = doc(siteInfoCollection, 'info');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as SiteInfo : {};
}

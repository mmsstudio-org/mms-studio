import { db } from './firebase';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, deleteDoc, getDoc, serverTimestamp, orderBy, setDoc } from 'firebase/firestore';
import type { Product, AppDetail, Feature, SiteInfo, Purchase } from './types';

// Collections
const productsCollection = collection(db, 'web-products');
const appsCollection = collection(db, 'web-apps');
const siteInfoCollection = collection(db, 'web-site-info');
const featuresCollection = collection(db, 'web-features');
const purchasesCollection = collection(db, 'payment_sms');


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
    const productRef = doc(db, 'web-products', productId);
    await updateDoc(productRef, product);
}

export async function deleteProduct(productId: string): Promise<void> {
    const productRef = doc(db, 'web-products', productId);
    await deleteDoc(productRef);
}


// App (Category) Functions
export async function getApps(): Promise<AppDetail[]> {
    const querySnapshot = await getDocs(query(appsCollection, orderBy('name')));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppDetail));
}

export async function getApp(appId: string): Promise<AppDetail | null> {
    const docRef = doc(db, 'web-apps', appId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AppDetail;
    }
    return null;
}

export async function addApp(app: Omit<AppDetail, 'id'>): Promise<void> {
    await addDoc(appsCollection, app);
}

export async function updateApp(appId: string, app: Partial<AppDetail>): Promise<void> {
    const appRef = doc(db, 'web-apps', appId);
    await updateDoc(appRef, app);
}

export async function deleteApp(appId: string): Promise<void> {
    const appRef = doc(db, 'web-apps', appId);
    await deleteDoc(appRef);
}

// Feature Functions
export async function getFeatures(): Promise<Feature[]> {
    const querySnapshot = await getDocs(query(featuresCollection, orderBy('title')));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feature));
}

export async function addFeature(feature: Omit<Feature, 'id'>): Promise<string> {
    const docRef = await addDoc(featuresCollection, feature);
    return docRef.id;
}

export async function updateFeature(featureId: string, feature: Partial<Feature>): Promise<void> {
    const featureRef = doc(db, 'web-features', featureId);
    await updateDoc(featureRef, feature);
}

export async function deleteFeature(featureId: string): Promise<void> {
    const featureRef = doc(db, 'web-features', featureId);
    await deleteDoc(featureRef);
}


// Site Info Functions
export async function getSiteInfo(): Promise<SiteInfo> {
    const docRef = doc(siteInfoCollection, 'info');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as SiteInfo : {};
}

export async function updateSiteInfo(siteInfo: SiteInfo): Promise<void> {
    const docRef = doc(siteInfoCollection, 'info');
    // Ensure optional fields are handled correctly.
    const dataToSave = {
        ...siteInfo,
        bkashQrCodeUrl: siteInfo.bkashQrCodeUrl || '',
        paymentApiBaseUrl: siteInfo.paymentApiBaseUrl || '',
        paymentApiKey: siteInfo.paymentApiKey || '',
        couponApiBaseUrl: siteInfo.couponApiBaseUrl || '',
        couponApiKey: siteInfo.couponApiKey || '',
    };
    await setDoc(docRef, dataToSave, { merge: true });
}

// Purchase Functions (from payment_sms collection)
export async function getPurchases(): Promise<Purchase[]> {
    const q = query(purchasesCollection, orderBy('received_time', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase));
}

export async function updatePurchaseRedeemedStatus(purchaseId: string, is_redeemed: boolean): Promise<void> {
    const purchaseRef = doc(db, 'payment_sms', purchaseId);
    await updateDoc(purchaseRef, { is_redeemed });
}

import { db } from './firebase';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, deleteDoc, getDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import type { Product, AppDetail, Feature, SiteInfo, Purchase } from './types';

// Collections
const productsCollection = collection(db, 'products');
const appsCollection = collection(db, 'apps');
const siteInfoCollection = collection(db, 'site-info');
const featuresCollection = collection(db, 'features');
const purchasesCollection = collection(db, 'purchases');


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
    const querySnapshot = await getDocs(query(appsCollection, orderBy('name')));
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

export async function addApp(app: Omit<AppDetail, 'id'>): Promise<void> {
    await addDoc(appsCollection, app);
}

export async function updateApp(appId: string, app: Partial<AppDetail>): Promise<void> {
    const appRef = doc(db, 'apps', appId);
    await updateDoc(appRef, app);
}

export async function deleteApp(appId: string): Promise<void> {
    const appRef = doc(db, 'apps', appId);
    await deleteDoc(appRef);
}

// Feature Functions
export async function getFeatures(): Promise<Feature[]> {
    const querySnapshot = await getDocs(featuresCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feature));
}

export async function addFeature(feature: Omit<Feature, 'id'>): Promise<void> {
    await addDoc(featuresCollection, feature);
}

export async function updateFeature(featureId: string, feature: Partial<Feature>): Promise<void> {
    const featureRef = doc(db, 'features', featureId);
    await updateDoc(featureRef, feature);
}

export async function deleteFeature(featureId: string): Promise<void> {
    const featureRef = doc(db, 'features', featureId);
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
    await updateDoc(docRef, siteInfo);
}

// Purchase Functions
export async function addPurchase(purchaseData: Omit<Purchase, 'id' | 'purchaseDate' | 'status'> & {product: Product}): Promise<void> {
    const price = purchaseData.product.discountedPrice ?? purchaseData.product.regularPrice;
    const newPurchase: Omit<Purchase, 'id'> = {
        productId: purchaseData.product.id!,
        productName: purchaseData.product.name,
        productPrice: price,
        bkashTxnId: purchaseData.bkashTxnId,
        status: 'pending',
        purchaseDate: serverTimestamp()
    };
    await addDoc(purchasesCollection, newPurchase);
}

export async function getPurchases(): Promise<Purchase[]> {
    const q = query(purchasesCollection, orderBy('purchaseDate', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase));
}

export async function updatePurchaseStatus(purchaseId: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
    const purchaseRef = doc(db, 'purchases', purchaseId);
    await updateDoc(purchaseRef, { status });
}
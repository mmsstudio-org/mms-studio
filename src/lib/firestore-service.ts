import { db } from './firebase';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import type { Product } from './types';

const productsCollection = collection(db, 'products');

export async function getProductsForApp(appId: string): Promise<Product[]> {
    const q = query(productsCollection, where('appId', '==', appId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function addProduct(product: Product): Promise<void> {
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

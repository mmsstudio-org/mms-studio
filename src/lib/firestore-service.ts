
import { db } from './firebase';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, deleteDoc, getDoc, serverTimestamp, orderBy, setDoc, writeBatch, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { Product, AppDetail, Feature, SiteInfo, Purchase, Coupon, Blog } from './types';

// Collections
const productsCollection = collection(db, 'web-products');
const appsCollection = collection(db, 'web-apps');
const siteInfoCollection = collection(db, 'web-site-info');
const featuresCollection = collection(db, 'web-features');
const purchasesCollection = collection(db, 'payment_sms');
const couponsCollection = collection(db, 'web-coupons');
const blogsCollection = collection(db, 'blogs');


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

export async function updateFeature(featureId: string, feature: Partial<Omit<Feature, 'id'>>): Promise<void> {
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
    // Ensure optional fields are handled correctly by setting them to an empty string if they are falsy.
    const dataToSave = {
        ...siteInfo,
        bkashQrCodeUrl: siteInfo.bkashQrCodeUrl || '',
        paymentNotice: siteInfo.paymentNotice || '',
        githubUrl: siteInfo.githubUrl || '',
        linkedinUrl: siteInfo.linkedinUrl || '',
        xUrl: siteInfo.xUrl || '',
        instagramUrl: siteInfo.instagramUrl || '',
        whatsappUrl: siteInfo.whatsappUrl || '',
        telegramUrl: siteInfo.telegramUrl || '',
        email: siteInfo.email || '',
        youtubeUrl: siteInfo.youtubeUrl || '',
        facebookUrl: siteInfo.facebookUrl || '',
        location: siteInfo.location || '',
        contactNumber: siteInfo.contactNumber || '',
        googleMapsUrl: siteInfo.googleMapsUrl || '',
        appAdsTxt: siteInfo.appAdsTxt || '',
    };
    await setDoc(docRef, dataToSave, { merge: true });
}

// Purchase Functions (from payment_sms collection)
export async function getPurchases(): Promise<Purchase[]> {
    const q = query(purchasesCollection, orderBy('received_time', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Purchase));
}

export async function getPurchaseByTxnId(txnId: string): Promise<Purchase | null> {
    const q = query(purchasesCollection, where('txn_id', '==', txnId), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        // Fallback to check if the doc ID is the txnId
        const docRef = doc(db, 'payment_sms', txnId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Purchase;
        }
        return null;
    }
    const purchaseDoc = querySnapshot.docs[0];
    return { id: purchaseDoc.id, ...purchaseDoc.data() } as Purchase;
}

export async function updatePurchaseRedeemedStatus(purchaseId: string, is_redeemed: boolean): Promise<void> {
    const purchaseRef = doc(db, 'payment_sms', purchaseId);
    await updateDoc(purchaseRef, { is_redeemed });
}

export async function deletePurchase(purchaseId: string): Promise<void> {
    const purchaseRef = doc(db, 'payment_sms', purchaseId);
    await deleteDoc(purchaseRef);
}

export async function deletePurchasesBatch(purchaseIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    purchaseIds.forEach(id => {
        const purchaseRef = doc(db, 'payment_sms', id);
        batch.delete(purchaseRef);
    });
    await batch.commit();
}


// Coupon Functions
export async function getCoupons(): Promise<Coupon[]> {
    const q = query(couponsCollection, orderBy('created', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
}

export async function getCoupon(code: string): Promise<Coupon | null> {
    const docRef = doc(db, 'web-coupons', code);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Coupon : null;
}

export async function addCoupon(couponData: Omit<Coupon, 'id'>): Promise<void> {
    const couponRef = doc(db, 'web-coupons', couponData.code);
    await setDoc(couponRef, couponData);
}

export async function updateCoupon(code: string, couponData: Partial<Omit<Coupon, 'id' | 'code'>>): Promise<void> {
    const couponRef = doc(db, 'web-coupons', code);
    await updateDoc(couponRef, couponData);
}

export async function deleteCoupon(code: string): Promise<void> {
    const couponRef = doc(db, 'web-coupons', code);
    await deleteDoc(couponRef);
}

export async function deleteCouponsBatch(couponCodes: string[]): Promise<void> {
    const batch = writeBatch(db);
    couponCodes.forEach(code => {
        const couponRef = doc(db, 'web-coupons', code);
        batch.delete(couponRef);
    });
    await batch.commit();
}

// Blog Functions
export async function getBlogs(): Promise<Blog[]> {
    try {
        const querySnapshot = await getDocs(blogsCollection);
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blog));
        return list.sort((a, b) => b.publishedAt - a.publishedAt);
    } catch (error) {
        console.error("Error in getBlogs:", error);
        return [];
    }
}

export async function getPublishedBlogs(): Promise<Blog[]> {
    try {
        const querySnapshot = await getDocs(blogsCollection);
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blog));
        return list
            .filter(blog => blog.status === 'published')
            .sort((a, b) => b.publishedAt - a.publishedAt);
    } catch (error) {
        console.error("Error in getPublishedBlogs:", error);
        return [];
    }
}

export async function getRecentPublishedBlogs(limitNumber: number): Promise<Blog[]> {
    try {
        const querySnapshot = await getDocs(blogsCollection);
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blog));
        return list
            .filter(blog => blog.status === 'published')
            .sort((a, b) => b.publishedAt - a.publishedAt)
            .slice(0, limitNumber);
    } catch (error) {
        console.error("Error in getRecentPublishedBlogs:", error);
        return [];
    }
}

export async function getBlogById(id: string): Promise<Blog | null> {
    try {
        const docRef = doc(db, 'blogs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Blog;
        }
        return null;
    } catch (error) {
        console.error("Error in getBlogById:", error);
        return null;
    }
}

export async function getBlogBySlug(slug: string): Promise<Blog | null> {
    try {
        const q = query(blogsCollection, where('slug', '==', slug), limit(1));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Blog;
    } catch (error) {
        console.error("Error in getBlogBySlug:", error);
        return null;
    }
}

export async function addBlog(blog: Omit<Blog, 'id'>): Promise<string> {
    const docRef = await addDoc(blogsCollection, blog);
    return docRef.id;
}

export async function updateBlog(id: string, blogData: Partial<Omit<Blog, 'id'>>): Promise<void> {
    const docRef = doc(db, 'blogs', id);
    await updateDoc(docRef, blogData);
}

export async function deleteBlog(id: string): Promise<void> {
    const docRef = doc(db, 'blogs', id);
    await deleteDoc(docRef);
}

export async function checkSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
    try {
        const q = query(blogsCollection, where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return true;
        }
        if (excludeId) {
            return querySnapshot.docs.every(doc => doc.id === excludeId);
        }
        return false;
    } catch (error) {
        console.error("Error in checkSlugUnique:", error);
        return true;
    }
}

export async function getPublishedBlogsPaginated(
  limitNum: number,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null,
  searchQuery?: string
): Promise<{ blogs: Blog[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  try {
    let q;
    
    if (searchQuery && searchQuery.trim()) {
      const term = searchQuery.trim();
      q = query(
        blogsCollection,
        where('status', '==', 'published'),
        where('title', '>=', term),
        where('title', '<=', term + '\uf8ff'),
        orderBy('title'),
        limit(limitNum)
      );
    } else {
      q = query(
        blogsCollection,
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(limitNum)
      );
    }

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const querySnapshot = await getDocs(q);
    const blogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blog));
    const lastDoc = (querySnapshot.docs[querySnapshot.docs.length - 1] as QueryDocumentSnapshot<DocumentData>) || null;

    return { blogs, lastDoc };
  } catch (error: any) {
    console.error("Error in getPublishedBlogsPaginated (Index might be missing, check link below):", error);
    
    // Fallback: If it is an index error, query all and paginate in memory so the app never breaks
    try {
      console.warn("Running in-memory fallback for getPublishedBlogsPaginated...");
      const allDocsSnapshot = await getDocs(blogsCollection);
      let allBlogs = allDocsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blog));
      
      // Filter out drafts
      allBlogs = allBlogs.filter(blog => blog.status === 'published');
      
      if (searchQuery && searchQuery.trim()) {
        const term = searchQuery.trim().toLowerCase();
        allBlogs = allBlogs.filter(blog => blog.title.toLowerCase().includes(term));
        allBlogs.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        allBlogs.sort((a, b) => b.publishedAt - a.publishedAt);
      }
      
      // Determine paginated offset
      let startIndex = 0;
      if (startAfterDoc) {
        const prevIndex = allBlogs.findIndex(b => b.id === startAfterDoc.id);
        if (prevIndex !== -1) {
          startIndex = prevIndex + 1;
        }
      }
      
      const paginatedBlogs = allBlogs.slice(startIndex, startIndex + limitNum);
      
      let lastDocSnapshot: QueryDocumentSnapshot<DocumentData> | null = null;
      if (paginatedBlogs.length > 0) {
        const lastBlogId = paginatedBlogs[paginatedBlogs.length - 1].id;
        const matchingDoc = allDocsSnapshot.docs.find(doc => doc.id === lastBlogId);
        if (matchingDoc) {
          lastDocSnapshot = matchingDoc as QueryDocumentSnapshot<DocumentData>;
        }
      }
      
      return { blogs: paginatedBlogs, lastDoc: lastDocSnapshot };
    } catch (fallbackError) {
      console.error("Fallback failed:", fallbackError);
      return { blogs: [], lastDoc: null };
    }
  }
}


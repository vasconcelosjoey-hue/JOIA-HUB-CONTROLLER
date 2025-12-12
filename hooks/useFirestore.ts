
import { useState, useEffect } from 'react';
import { 
    collection, 
    onSnapshot, 
    doc, 
    setDoc, 
    deleteDoc, 
    updateDoc, 
    addDoc,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { DEFAULT_OWNER_ID } from '../constants';

// Hook for Arrays (Lists like Projects, Tools, etc.)
// Automatically filters by ownerId for security
export function useFirestoreCollection<T extends { id: string }>(collectionName: string) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Enforce Owner Isolation
        const q = query(
            collection(db, collectionName), 
            where("ownerId", "==", DEFAULT_OWNER_ID)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: T[] = [];
            snapshot.forEach((doc) => {
                items.push({ ...doc.data(), id: doc.id } as T);
            });
            setData(items);
            setLoading(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName]);

    const addItem = async (item: Omit<T, 'id'> | T) => {
        const payload = {
            ...item,
            ownerId: DEFAULT_OWNER_ID,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if ('id' in item && (item as any).id) {
             const { id, ...rest } = item as any;
             await setDoc(doc(db, collectionName, id), { ...rest, ...payload });
        } else {
             await addDoc(collection(db, collectionName), payload);
        }
    };

    const updateItem = async (id: string, updates: Partial<T>) => {
        const ref = doc(db, collectionName, id);
        await updateDoc(ref, { 
            ...updates,
            updatedAt: new Date().toISOString()
        });
    };

    const deleteItem = async (id: string) => {
        await deleteDoc(doc(db, collectionName, id));
    };

    return { data, loading, addItem, updateItem, deleteItem };
}

// Hook for Subcollections (e.g. wallets/{id}/entries)
// This is critical for the "Event Sourcing" pattern requested
export function useFirestoreSubCollection<T extends { id: string }>(
    parentCollection: string, 
    parentId: string, 
    subCollection: string
) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!parentId) return;

        // Path: parent/{id}/subcollection
        // Order by date desc is standard for financial feeds
        const q = query(
            collection(db, parentCollection, parentId, subCollection),
            orderBy('date', 'desc') 
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: T[] = [];
            snapshot.forEach((doc) => {
                items.push({ ...doc.data(), id: doc.id } as T);
            });
            setData(items);
            setLoading(false);
        }, (error) => {
            console.error("Subcollection Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [parentCollection, parentId, subCollection]);

    const addSubItem = async (item: any) => {
        const payload = {
            ...item,
            ownerId: DEFAULT_OWNER_ID, // Inherit ownership
            createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, parentCollection, parentId, subCollection), payload);
    };

    const deleteSubItem = async (itemId: string) => {
        await deleteDoc(doc(db, parentCollection, parentId, subCollection, itemId));
    };

    const updateSubItem = async (itemId: string, updates: any) => {
         await updateDoc(doc(db, parentCollection, parentId, subCollection, itemId), updates);
    };

    return { data, loading, addSubItem, deleteSubItem, updateSubItem };
}

// Hook for Single Documents
export function useFirestoreDocument<T>(collectionName: string, docId: string, defaultValue: T) {
    const [data, setData] = useState<T>(defaultValue);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!docId) return;

        const unsubscribe = onSnapshot(doc(db, collectionName, docId), (docSnap) => {
            if (docSnap.exists()) {
                setData(docSnap.data() as T);
            } else {
                setData(defaultValue);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName, docId]);

    const setDocument = async (newData: T) => {
        await setDoc(doc(db, collectionName, docId), {
            ...newData,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    };

    return { data, loading, setDocument };
}

// Helper for Subcollections (One-off writes)
export const addSubDocument = async (parentCollection: string, parentId: string, subCollection: string, data: any) => {
    try {
        const path = `${parentCollection}/${parentId}/${subCollection}`;
        await addDoc(collection(db, path), {
            ...data,
            ownerId: DEFAULT_OWNER_ID,
            createdAt: new Date().toISOString()
        });
    } catch (e) {
        console.error("Error adding subdocument", e);
    }
};

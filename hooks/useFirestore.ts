
import { useState, useEffect } from 'react';
import { 
    collection, 
    onSnapshot, 
    doc, 
    setDoc, 
    deleteDoc, 
    updateDoc, 
    addDoc,
    query
} from 'firebase/firestore';
import { db } from '../services/firebase';

// Hook for Arrays (Lists like Projects, Tools, etc.)
// Standardized Pattern: Global Public Collections
export function useFirestoreCollection<T extends { id: string }>(collectionName: string) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Global Query - No Owner Filter
        const q = query(collection(db, collectionName));

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

// Hook for Single Documents (Global Settings, Configuration)
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

    // Changed parameter type to Partial<T> to support partial updates since merge: true is used.
    const setDocument = async (newData: Partial<T>) => {
        await setDoc(doc(db, collectionName, docId), {
            ...newData,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    };

    return { data, loading, setDocument };
}

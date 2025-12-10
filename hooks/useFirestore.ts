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
    orderBy
} from 'firebase/firestore';
import { db } from '../services/firebase';

// Hook for Arrays (Lists like Projects, Tools, etc.)
export function useFirestoreCollection<T extends { id: string }>(collectionName: string, initialData: T[] = []) {
    const [data, setData] = useState<T[]>(initialData);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        // If item has an ID, use setDoc to force that ID, otherwise addDoc
        if ('id' in item && item.id) {
             const { id, ...rest } = item as any;
             await setDoc(doc(db, collectionName, id), rest);
        } else {
             await addDoc(collection(db, collectionName), item);
        }
    };

    const updateItem = async (id: string, updates: Partial<T>) => {
        const ref = doc(db, collectionName, id);
        await updateDoc(ref, updates);
    };

    const deleteItem = async (id: string) => {
        await deleteDoc(doc(db, collectionName, id));
    };

    return { data, loading, addItem, updateItem, deleteItem };
}

// Hook for Single Documents (Like specific Wallet Data)
export function useFirestoreDocument<T>(collectionName: string, docId: string, defaultValue: T) {
    const [data, setData] = useState<T>(defaultValue);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!docId) return;

        const unsubscribe = onSnapshot(doc(db, collectionName, docId), (docSnap) => {
            if (docSnap.exists()) {
                setData(docSnap.data() as T);
            } else {
                // If doc doesn't exist yet, we keep default or set it
                setData(defaultValue);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName, docId]);

    const setDocument = async (newData: T) => {
        // We use setDoc with merge: true or simple set depending on need.
        // For the wallet state, we usually want to overwrite or merge deep.
        await setDoc(doc(db, collectionName, docId), newData as any, { merge: true });
    };

    return { data, loading, setDocument };
}
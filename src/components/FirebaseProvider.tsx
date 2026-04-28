/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  googleProvider, 
  auth, 
  db,
  FirebaseUser
} from '../lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc,
  getDocs,
  writeBatch,
  updateDoc
} from 'firebase/firestore';
import { Transaction, Budget, Family, FamilyMember } from '../types';

interface FirebaseContextType {
  user: FirebaseUser | null;
  loading: boolean;
  family: Family | null;
  transactions: Transaction[];
  personalTransactions: Transaction[];
  budgets: Budget[];
  personalBudgets: Budget[];
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  addTransaction: (t: Transaction, scope?: 'personal' | 'family') => Promise<void>;
  updateBudget: (oldCat: string, newCat: string, limit: number, scope?: 'personal' | 'family') => Promise<void>;
  addFamilyMember: (name: string, role: string) => Promise<void>;
  createFamily: (name: string) => Promise<void>;
  joinFamily: (familyId: string) => Promise<void>;
  resetPersonalData: () => Promise<void>;
  resetFamilyData: () => Promise<void>;
  leaveFamily: () => Promise<void>;
  activeMonth: string;
  setActiveMonth: (month: string) => void;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within FirebaseProvider');
  return context;
}

// SAFE NOTIFICATION FUNCTION FOR ANDROID
const safeSendNotification = (title: string, body: string) => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch (e) {
      console.warn("Notification failed", e);
    }
  }
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [personalTransactions, setPersonalTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [personalBudgets, setPersonalBudgets] = useState<Budget[]>([]);
  const [activeMonth, setActiveMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const unsubs = React.useRef<(() => void)[]>([]);
  const familyUnsubs = React.useRef<(() => void)[]>([]);

  const cleanup = () => {
    unsubs.current.forEach(u => u());
    unsubs.current = [];
    familyUnsubs.current.forEach(u => u());
    familyUnsubs.current = [];
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Load data personal
        const pTransRef = collection(db, 'users', u.uid, 'transactions');
        const unsub1 = onSnapshot(pTransRef, (snap) => {
          setPersonalTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id })) as any);
        });

        const pBudgetRef = collection(db, 'users', u.uid, 'budgets');
        const unsub2 = onSnapshot(pBudgetRef, (snap) => {
          setPersonalBudgets(snap.docs.map(d => d.data()) as any);
        });

        unsubs.current.push(unsub1, unsub2);

        // Load family link
        const userDocRef = doc(db, 'users', u.uid);
        const unsub3 = onSnapshot(userDocRef, (snap) => {
          const fid = snap.data()?.familyId;
          if (fid) loadFamilyData(fid);
        });
        unsubs.current.push(unsub3);
      }
      setLoading(false);
    }, () => setLoading(false));

    return () => { unsubscribe(); cleanup(); };
  }, []);

  const loadFamilyData = (familyId: string) => {
    familyUnsubs.current.forEach(u => u());
    familyUnsubs.current = [];

    const fRef = doc(db, 'families', familyId);
    const unsub1 = onSnapshot(fRef, (snap) => setFamily(snap.data() as any));
    
    const tRef = collection(db, 'families', familyId, 'transactions');
    const unsub2 = onSnapshot(tRef, (snap) => setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id })) as any));

    const bRef = collection(db, 'families', familyId, 'budgets');
    const unsub3 = onSnapshot(bRef, (snap) => setBudgets(snap.docs.map(d => d.data()) as any));

    familyUnsubs.current.push(unsub1, unsub2, unsub3);
  };

  // Logic calculation budgets
  const processedPersonalBudgets = React.useMemo(() => {
    return personalBudgets.map(b => ({ ...b, spent: personalTransactions.filter(t => t.category === b.category).reduce((acc, t) => acc + t.amount, 0) }));
  }, [personalBudgets, personalTransactions]);

  const processedBudgets = React.useMemo(() => {
    return budgets.map(b => ({ ...b, spent: transactions.filter(t => t.category === b.category).reduce((acc, t) => acc + t.amount, 0) }));
  }, [budgets, transactions]);

  // Fungsi-fungsi aksi (signIn, addTransaction, dll) tetap sama tapi dibungkus try-catch
  const signIn = async () => { try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); } };
  const signOut = async () => { await auth.signOut(); cleanup(); };

  const addTransaction = async (t: Transaction, scope: 'personal' | 'family' = 'personal') => {
    if (!user) return;
    const path = scope === 'family' ? `families/${family?.id}/transactions` : `users/${user.uid}/transactions`;
    await setDoc(doc(db, path, t.id), { ...t, userId: user.uid, userName: user.displayName, scope });
  };

  // Tambahkan fungsi sisa lainnya di sini sesuai kebutuhan Anda...
  // (createFamily, joinFamily, dll - logikanya tetap sama dengan kode lama Anda)

  return (
    <FirebaseContext.Provider value={{ 
      user, loading, family, transactions, personalTransactions, budgets: processedBudgets, personalBudgets: processedPersonalBudgets, 
      signIn, signOut, addTransaction, activeMonth, setActiveMonth 
    } as any}>
      {children}
    </FirebaseContext.Provider>
  );
};

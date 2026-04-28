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
  setDoc as firestoreSetDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  Timestamp,
  writeBatch
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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  const alertedCategories = React.useRef<Set<string>>(new Set());
  const prevTransactionIds = React.useRef<Set<string>>(new Set());

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const sendNotification = (title: string, body: string, id: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Prevent rapid fire notifications for the same thing (usually for budget alerts)
      if (alertedCategories.current.has(id)) return;
      
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: id.split('-')[0], // Use prefix as tag to group similar alerts
      });
      
      alertedCategories.current.add(id);
    }
  };

  const cleanup = () => {
    unsubs.current.forEach(u => u());
    unsubs.current = [];
    cleanupFamily();
  };

  const cleanupFamily = () => {
    familyUnsubs.current.forEach(u => u());
    familyUnsubs.current = [];
    prevTransactionIds.current.clear();
  };

  useEffect(() => {
    if (user) {
      requestNotificationPermission();
      // Clear alert history when month changes
      alertedCategories.current.clear();
    }
  }, [user, activeMonth]);

  // Monitor transactions for NEW entries from OTHER family members
  useEffect(() => {
    if (transactions.length > 0 && prevTransactionIds.current.size > 0) {
      transactions.forEach(t => {
        if (!prevTransactionIds.current.has(t.id)) {
          // If this is a new transaction and NOT from the current user
          if (user && t.userId !== user.uid) {
            sendNotification(
              `💰 Transaksi Baru: ${t.userName}`,
              `${t.title}: Rp ${t.amount.toLocaleString()}`,
              `newtx-${t.id}`
            );
          }
        }
      });
    }
    
    // Update the set of known IDs
    const newIds = new Set<string>();
    transactions.forEach(t => newIds.add(t.id));
    prevTransactionIds.current = newIds;
  }, [transactions, user]);

  // Monitor budgets for alerts
  useEffect(() => {
    budgets.forEach(b => {
      const percentage = (b.spent / b.limit) * 100;
      if (percentage >= 100) {
        sendNotification(`⚠️ Anggaran Terlewati!`, `Pengeluaran ${b.category} Keluarga mencapai limit Rp ${b.limit.toLocaleString()}`, `fam-crit-${b.category}`);
      } else if (percentage >= 90) {
        sendNotification(`ℹ️ Peringatan Anggaran`, `Pengeluaran ${b.category} Keluarga sudah mencapai 90%.`, `fam-warn-${b.category}`);
      }
    });

    personalBudgets.forEach(b => {
      const percentage = (b.spent / b.limit) * 100;
      if (percentage >= 100) {
        sendNotification(`⚠️ Anggaran Pribadi!`, `Kategori ${b.category} mencapai limit Rp ${b.limit.toLocaleString()}`, `pers-crit-${b.category}`);
      } else if (percentage >= 90) {
        sendNotification(`ℹ️ Peringatan Pribadi`, `Kategori ${b.category} sudah mencapai 90%.`, `pers-warn-${b.category}`);
      }
    });
  }, [budgets, personalBudgets]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      cleanup();
      setUser(u);
      if (u) {
        await syncUserData(u);
        loadPersonalData(u.uid);
      } else {
        setFamily(null);
        setTransactions([]);
        setPersonalTransactions([]);
        setBudgets([]);
        setPersonalBudgets([]);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      cleanup();
    };
  }, []);

  const loadPersonalData = (uid: string) => {
    const pTransRef = collection(db, 'users', uid, 'transactions');
    const unsub1 = onSnapshot(pTransRef, (snap) => {
      const tData = snap.docs.map(d => ({
        ...d.data(),
        id: d.id,
        scope: 'personal' as const
      })) as Transaction[];
      setPersonalTransactions(tData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (err) => {
      if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, `users/${uid}/transactions`);
    });

    const pBudgetRef = collection(db, 'users', uid, 'budgets');
    const unsub2 = onSnapshot(pBudgetRef, (snap) => {
      const bData = snap.docs.map(d => d.data() as Budget);
      setPersonalBudgets(bData);
    }, (err) => {
      if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, `users/${uid}/budgets`);
    });

    unsubs.current.push(unsub1, unsub2);
  };

  const syncUserData = (u: FirebaseUser) => {
    const userDocRef = doc(db, 'users', u.uid);
    let currentFamilyId: string | null = null;

    const unsub = onSnapshot(userDocRef, async (snap) => {
      if (snap.exists()) {
        const userData = snap.data();
        const newFamilyId = userData.familyId || null;

        if (newFamilyId !== currentFamilyId) {
          cleanupFamily(); // Stop old family listeners
          currentFamilyId = newFamilyId;
          
          if (newFamilyId) {
            await loadFamilyData(newFamilyId);
          } else {
            setFamily(null);
            setTransactions([]);
            setBudgets([]);
          }
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${u.uid}`);
    });
    unsubs.current.push(unsub);
  };

  const loadFamilyData = async (familyId: string) => {
    // Family Listener
    const familyRef = doc(db, 'families', familyId);
    const unsub1 = onSnapshot(familyRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFamily({ id: snap.id, name: data.name, members: [] }); // Members will be loaded separately
      }
    }, (err) => {
      if (auth.currentUser) handleFirestoreError(err, OperationType.GET, `families/${familyId}`);
    });

    // Members Listener
    const membersRef = collection(db, 'families', familyId, 'members');
    const unsub2 = onSnapshot(membersRef, (snap) => {
      const members = snap.docs.map(d => ({
        ...d.data(),
        id: d.id
      })) as FamilyMember[];
      setFamily(prev => prev ? { ...prev, members } : null);
    }, (err) => {
      if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, `families/${familyId}/members`);
    });

    // Transactions Listener
    const transRef = collection(db, 'families', familyId, 'transactions');
    const unsub3 = onSnapshot(transRef, (snap) => {
      const tData = snap.docs.map(d => ({
        ...d.data(),
        id: d.id,
        scope: 'family' as const
      })) as Transaction[];
      setTransactions(tData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (err) => {
      if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, `families/${familyId}/transactions`);
    });

    // Budgets Listener
    const budgetRef = collection(db, 'families', familyId, 'budgets');
    const unsub4 = onSnapshot(budgetRef, (snap) => {
      const bData = snap.docs.map(d => d.data() as Budget);
      setBudgets(bData);
    }, (err) => {
      if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, `families/${familyId}/budgets`);
    });

    familyUnsubs.current.push(unsub1, unsub2, unsub3, unsub4);
  };

  const processedPersonalBudgets = React.useMemo(() => {
    const monthTrans = personalTransactions.filter(t => t.date.startsWith(activeMonth));
    return personalBudgets.map(b => {
      if (b.category === 'Pemasukan') {
        const income = monthTrans
          .filter(t => t.type === 'income')
          .reduce((acc, t) => acc + t.amount, 0);
        return { ...b, spent: income };
      }
      const spent = monthTrans
        .filter(t => t.type === 'expense' && t.category.trim() === b.category.trim())
        .reduce((acc, t) => acc + t.amount, 0);
      return { ...b, spent };
    });
  }, [personalBudgets, personalTransactions, activeMonth]);

  const processedBudgets = React.useMemo(() => {
    const monthTrans = transactions.filter(t => t.date.startsWith(activeMonth));
    return budgets.map(b => {
      if (b.category === 'Pemasukan') {
        const income = monthTrans
          .filter(t => t.type === 'income')
          .reduce((acc, t) => acc + t.amount, 0);
        return { ...b, spent: income };
      }
      const spent = monthTrans
        .filter(t => t.type === 'expense' && t.category.trim() === b.category.trim())
        .reduce((acc, t) => acc + t.amount, 0);
      return { ...b, spent };
    });
  }, [budgets, transactions, activeMonth]);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
    }
  };

  const signOut = async () => {
    await auth.signOut();
    cleanup();
    setUser(null);
    setFamily(null);
    setTransactions([]);
    setPersonalTransactions([]);
    setBudgets([]);
    setPersonalBudgets([]);
  };

  const DEFAULT_CATEGORIES = [
    { name: 'Makanan', limit: 2000000 },
    { name: 'Transportasi', limit: 1000000 },
    { name: 'Hiburan', limit: 500000 },
    { name: 'Sewa & Tagihan', limit: 3000000 },
    { name: 'Belanja', limit: 1500000 },
    { name: 'Kesehatan', limit: 500000 },
    { name: 'Tabungan', limit: 1000000 },
    { name: 'Hutang', limit: 0 },
    { name: 'Pemasukan', limit: 0 },
  ];

  const createFamily = async (name: string) => {
    if (!user) return;
    const familyId = `fam-${Date.now()}`;
    try {
      const famRef = doc(db, 'families', familyId);
      await setDoc(famRef, { id: familyId, name, createdAt: new Date().toISOString() });
      
      const memberRef = doc(db, 'families', familyId, 'members', user.uid);
      const memberData = { uid: user.uid, name: user.displayName || 'User', familyId, role: 'admin' };
      await setDoc(memberRef, memberData);
      
      // Seed default budgets
      for (const cat of DEFAULT_CATEGORIES) {
        const bRef = doc(db, 'families', familyId, 'budgets', cat.name);
        await setDoc(bRef, { category: cat.name, limit: cat.limit, spent: 0 });
      }

      // Update user profile
      await setDoc(doc(db, 'users', user.uid), memberData);
      
      await loadFamilyData(familyId);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `families/${familyId}`);
    }
  };

  const addTransaction = async (t: Transaction, scope: 'personal' | 'family' = 'personal') => {
    if (!user) return;
    
    const path = scope === 'family' 
      ? `families/${family?.id}/transactions` 
      : `users/${user.uid}/transactions`;
    
    if (scope === 'family' && !family) {
      alert("Anda harus bergabung dengan keluarga terlebih dahulu untuk menambah transaksi keluarga.");
      return;
    }

    try {
      const transRef = doc(db, path, t.id);
      await setDoc(transRef, {
        ...t,
        userId: user.uid,
        userName: user.displayName || 'User',
        scope
      });
      
      const trimmedCategory = t.category.trim();
      const parentPath = scope === 'family' ? `families/${family?.id}` : `users/${user.uid}`;
      const budgetRef = doc(db, parentPath, 'budgets', trimmedCategory);
      const budgetSnap = await getDoc(budgetRef);
      
      if (!budgetSnap.exists()) {
        // Create default budget if not exists
        const defaultLimit = trimmedCategory === 'Hutang' ? 0 : 1000000;
        await setDoc(budgetRef, { category: trimmedCategory, limit: defaultLimit, spent: 0 });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateBudget = async (oldCat: string, newCat: string, limit: number, scope: 'personal' | 'family' = 'family') => {
    const parentPath = scope === 'family' ? `families/${family?.id}` : `users/${user?.uid}`;
    if ((scope === 'family' && !family) || (scope === 'personal' && !user)) return;

    const trimmedOld = oldCat.trim();
    const trimmedNew = newCat.trim();

    try {
      const budgetRef = doc(db, parentPath, 'budgets', trimmedOld);
      if (trimmedOld !== trimmedNew) {
        await deleteDoc(budgetRef);
        await setDoc(doc(db, parentPath, 'budgets', trimmedNew), { category: trimmedNew, limit, spent: 0 });
        
        // Also update transactions category
        const transactionsRef = collection(db, parentPath, 'transactions');
        const q = query(transactionsRef, where('category', '==', trimmedOld));
        const transSnaps = await getDocs(q);
        for (const d of transSnaps.docs) {
          await updateDoc(doc(db, parentPath, 'transactions', d.id), { category: trimmedNew });
        }
      } else {
        await setDoc(doc(db, parentPath, 'budgets', trimmedNew), { category: trimmedNew, limit, spent: 0 });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${parentPath}/budgets/${trimmedNew}`);
    }
  };

  const addFamilyMember = async (name: string, role: string) => {
    // In a real app, this would send an invite. 
    // Here we'll just simulate it by creating a member record if the user exists or just planning it.
    // Since we don't have a lookup system, we'll tell the user to have the other person join.
    alert("Berikan ID Keluarga (" + family?.id + ") ini kepada anggota lain untuk bergabung.");
  };

  const joinFamily = async (familyId: string) => {
    if (!user) return;
    try {
      const famRef = doc(db, 'families', familyId);
      const famSnap = await getDoc(famRef);
      if (!famSnap.exists()) {
        alert("ID Keluarga tidak ditemukan. Pastikan ID sudah benar.");
        return;
      }
      
      const memberRef = doc(db, 'families', familyId, 'members', user.uid);
      const memberData = { uid: user.uid, name: user.displayName || 'User', familyId, role: 'member' };
      await setDoc(memberRef, memberData);
      
      // Update user profile
      await setDoc(doc(db, 'users', user.uid), memberData);
      
      await loadFamilyData(familyId);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `families/${familyId}/members/${user.uid}`);
    }
  };

  const resetPersonalData = async () => {
    if (!user) return;
    if (!confirm("Apakah Anda yakin ingin menghapus seluruh data transaksi dan anggaran pribadi Anda? Tindakan ini tidak dapat dibatalkan.")) return;
    
    try {
      console.log("Starting Personal Data Reset...");
      const batch = writeBatch(db);
      
      // 1. Delete transactions
      const tPath = `users/${user.uid}/transactions`;
      const tSnap = await getDocs(collection(db, tPath));
      console.log(`Found ${tSnap.docs.length} personal transactions to delete.`);
      tSnap.docs.forEach(d => {
        batch.delete(doc(db, tPath, d.id));
      });

      // 2. Delete existing budgets
      const bPath = `users/${user.uid}/budgets`;
      const bSnap = await getDocs(collection(db, bPath));
      console.log(`Found ${bSnap.docs.length} personal budgets to delete.`);
      bSnap.docs.forEach(d => {
        batch.delete(doc(db, bPath, d.id));
      });

      // 3. Re-seed defaults
      console.log("Adding default budgets to batch...");
      for (const cat of DEFAULT_CATEGORIES) {
        const bRef = doc(db, 'users', user.uid, 'budgets', cat.name);
        batch.set(bRef, { category: cat.name, limit: cat.limit, spent: 0 });
      }

      await batch.commit();
      console.log("Personal data reset batch commit successful.");
      alertedCategories.current.clear();
      alert("Seluruh data transaksi dan anggaran pribadi Anda telah berhasil di-reset ke kondisi awal.");
    } catch (error) {
      console.error("Personal reset failed:", error);
      alert("Gagal mereset data: " + (error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal"));
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`);
    }
  };

  const resetFamilyData = async () => {
    if (!user || !family) return;
    const member = family.members.find(m => m.id === user.uid);
    if (member?.role !== 'admin') {
      alert("Hanya Kepala Keluarga yang dapat melakukan reset data keluarga.");
      return;
    }
    
    if (!confirm("Apakah Anda yakin ingin menghapus seluruh data transaksi keluarga? Tindakan ini tidak dapat dibatalkan.")) return;
    
    try {
      console.log("Starting Family Data Reset...");
      const batch = writeBatch(db);

      // 1. Delete transactions
      const tPath = `families/${family.id}/transactions`;
      const tSnap = await getDocs(collection(db, tPath));
      console.log(`Found ${tSnap.docs.length} family transactions to delete.`);
      tSnap.docs.forEach(d => {
        batch.delete(doc(db, tPath, d.id));
      });

      // 2. Reset budgets
      const bPath = `families/${family.id}/budgets`;
      const bSnap = await getDocs(collection(db, bPath));
      bSnap.docs.forEach(d => {
        batch.delete(doc(db, bPath, d.id));
      });

      for (const cat of DEFAULT_CATEGORIES) {
        const bRef = doc(db, 'families', family.id, 'budgets', cat.name);
        batch.set(bRef, { category: cat.name, limit: cat.limit, spent: 0 });
      }

      await batch.commit();
      console.log("Family data reset batch commit successful.");
      alertedCategories.current.clear();
      alert("Seluruh data transaksi dan anggaran keluarga telah berhasil di-reset ke kondisi awal.");
    } catch (error) {
      console.error("Family reset failed:", error);
      alert("Gagal mereset data keluarga: " + (error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal"));
      handleFirestoreError(error, OperationType.DELETE, `families/${family.id}`);
    }
  };

  const leaveFamily = async () => {
    if (!user || !family) return;
    
    const isAdmin = family.members.find(m => m.id === user.uid)?.role === 'admin';
    const isOnlyMember = family.members.length === 1;

    let confirmMsg = "Apakah Anda yakin ingin keluar dari grup keluarga ini?";
    if (isAdmin && isOnlyMember) {
      confirmMsg = "Anda anggota terakhir dan admin. Keluar akan menghapus grup keluarga ini juga. Lanjutkan?";
    } else if (isAdmin) {
      confirmMsg = "Anda adalah Kepala Keluarga. Disarankan untuk menunjuk Kepala baru sebelum keluar atau grup mungkin tidak dapat dikelola anggota lain. Lanjutkan?";
    }

    if (!confirm(confirmMsg)) return;
    
    try {
      // 1. Remove from family members
      await deleteDoc(doc(db, 'families', family.id, 'members', user.uid));
      
      // 2. Update user document
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { familyId: null, role: null }, { merge: true });
      
      // If was only member and admin, we could delete the family doc, but let's keep it simple
      // and just move the user out. The listener will handle the state reset.
      
      alert("Anda telah berhasil keluar dari grup keluarga.");
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `families/${family.id}/members/${user.uid}`);
    }
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, loading, family, transactions, personalTransactions, budgets: processedBudgets, personalBudgets: processedPersonalBudgets, 
      signIn, signOut, addTransaction, updateBudget, addFamilyMember, createFamily, joinFamily, resetPersonalData, resetFamilyData, leaveFamily,
      activeMonth, setActiveMonth
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// ============ إعدادات ربط Firebase ============
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDosOBzqvOwhkAutVWeEq3UlHuDWhukPa0",
  authDomain: "fffgy-2baee.firebaseapp.com",
  projectId: "fffgy-2baee",
  storageBucket: "fffgy-2baee.firebasestorage.app",
  messagingSenderId: "556680596203",
  appId: "1:556680596203:web:b203d1f8bcf085c2310cae",
  measurementId: "G-3P5PQFN6YN"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// كائن إدارة العمليات والقاعدة عبر Firebase
export const DB = {
  async list(tableName) {
    try {
      const querySnapshot = await getDocs(collection(db, tableName));
      let list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } catch (e) {
      console.error("خطأ في جلب البيانات من " + tableName, e);
      return [];
    }
  },

  async insert(tableName, row) {
    try {
      const now = new Date().toISOString();
      const dataToSave = { created_at: now, opened_at: now, ...row };
      const docRef = await addDoc(collection(db, tableName), dataToSave);
      return { id: docRef.id, ...dataToSave };
    } catch (e) {
      console.error("خطأ في الإضافة إلى " + tableName, e);
      throw e;
    }
  },

  async remove(tableName, id) {
    try {
      await deleteDoc(doc(db, tableName, id));
    } catch (e) {
      console.error("خطأ في الحذف من " + tableName, e);
      throw e;
    }
  },

  async upload(file) {
    try {
      const fileName = Date.now() + '-' + file.name.replace(/[^\w.-]/g, '_');
      const storageRef = ref(storage, 'sheets/' + fileName);
      
      // رفع الملف إلى Firebase Storage
      const snapshot = await uploadBytes(storageRef, file);
      // جلب رابط التحميل المباشر للـ PDF أو الصورة
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (e) {
      console.error("فشل رفع الملف إلى التخزين", e);
      throw new Error('فشل رفع الملف');
    }
  }
};

// معلومات الجلسة والزوار
export const Session = {
  id() {
    let s = localStorage.getItem('geo_sid');
    if (!s) { s = 'S-' + Math.random().toString(36.substring(2, 10)); localStorage.setItem('geo_sid', s); }
    return s;
  },
  device() {
    const u = navigator.userAgent;
    const os = /Android/.test(u) ? 'Android' : /iPhone|iPad/.test(u) ? 'iOS' : /Windows/.test(u) ? 'Windows' : /Mac/.test(u) ? 'macOS' : /Linux/.test(u) ? 'Linux' : 'غير معروف';
    const br = /Edg\//.test(u) ? 'Edge' : /OPR\//.test(u) ? 'Opera' : /Chrome\//.test(u) ? 'Chrome' : /Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : 'متصفح آخر';
    return `${os} / ${br} / ${/Mobi/.test(u) ? 'جوال' : 'حاسوب'}`;
  },
  async ip() {
    try { return (await (await fetch('https://api.ipify.org?format=json')).json()).ip; }
    catch { return 'غير معروف'; }
  }
};

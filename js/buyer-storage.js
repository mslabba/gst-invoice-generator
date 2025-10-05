import { db, auth } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

class BuyerStorage {
  constructor() {
    this.buyersCollection = 'buyers';
  }

  // Save buyer details
  async saveBuyer(buyerData) {
    try {
      if (!auth.currentUser) {
        return { success: false, message: 'User must be logged in' };
      }

      // Check if buyer with same GST already exists
      if (buyerData.gst) {
        const existing = await this.getBuyerByGST(buyerData.gst);
        if (existing) {
          // Update existing buyer
          await setDoc(doc(db, this.buyersCollection, existing.id), {
            ...buyerData,
            userId: auth.currentUser.uid,
            updatedAt: new Date().toISOString()
          });
          return { success: true, message: 'Buyer updated successfully' };
        }
      }

      // Add new buyer
      const buyerToSave = {
        ...buyerData,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, this.buyersCollection), buyerToSave);
      return { success: true, id: docRef.id, message: 'Buyer saved successfully' };
    } catch (error) {
      console.error('Error saving buyer:', error);
      return { success: false, message: 'Failed to save buyer: ' + error.message };
    }
  }

  // Get buyer by GST number
  async getBuyerByGST(gstNumber) {
    try {
      if (!auth.currentUser || !gstNumber) return null;

      const q = query(
        collection(db, this.buyersCollection),
        where('userId', '==', auth.currentUser.uid),
        where('gst', '==', gstNumber)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting buyer by GST:', error);
      return null;
    }
  }

  // Get all buyers for current user
  async getAllBuyers() {
    try {
      if (!auth.currentUser) {
        return { success: false, buyers: [] };
      }

      const q = query(
        collection(db, this.buyersCollection),
        where('userId', '==', auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const buyers = [];

      querySnapshot.forEach((doc) => {
        buyers.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by name
      buyers.sort((a, b) => a.name.localeCompare(b.name));

      return { success: true, buyers };
    } catch (error) {
      console.error('Error getting buyers:', error);
      return { success: false, buyers: [] };
    }
  }
}

export const buyerStorage = new BuyerStorage();
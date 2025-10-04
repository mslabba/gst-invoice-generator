import { db, auth } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

class InvoiceStorage {
  constructor() {
    this.invoicesCollection = 'invoices';
  }

  // Save invoice to Firebase
  async saveInvoice(invoiceData) {
    try {
      console.log('InvoiceStorage.saveInvoice called with:', invoiceData);
      console.log('Current auth user:', auth.currentUser?.email);

      if (!auth.currentUser) {
        throw new Error('User must be logged in to save invoices');
      }

      const invoiceToSave = {
        ...invoiceData,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Saving invoice to Firestore:', invoiceToSave);
      const docRef = await addDoc(collection(db, this.invoicesCollection), invoiceToSave);
      console.log('Invoice saved with ID:', docRef.id);

      return { success: true, id: docRef.id, message: 'Invoice saved successfully!' };
    } catch (error) {
      console.error('Error saving invoice:', error);
      return { success: false, message: 'Failed to save invoice: ' + error.message };
    }
  }

  // Get all invoices for current user
  async getUserInvoices() {
    try {
      if (!auth.currentUser) {
        return { success: false, invoices: [], message: 'User not logged in' };
      }

      const q = query(
        collection(db, this.invoicesCollection),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const invoices = [];

      querySnapshot.forEach((doc) => {
        invoices.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { success: true, invoices, message: 'Invoices loaded successfully' };
    } catch (error) {
      console.error('Error getting invoices:', error);
      return { success: false, invoices: [], message: 'Failed to load invoices: ' + error.message };
    }
  }

  // Update existing invoice
  async updateInvoice(invoiceId, updatedData) {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be logged in');
      }

      const invoiceRef = doc(db, this.invoicesCollection, invoiceId);
      await updateDoc(invoiceRef, {
        ...updatedData,
        updatedAt: new Date().toISOString()
      });

      return { success: true, message: 'Invoice updated successfully!' };
    } catch (error) {
      console.error('Error updating invoice:', error);
      return { success: false, message: 'Failed to update invoice: ' + error.message };
    }
  }

  // Delete invoice
  async deleteInvoice(invoiceId) {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be logged in');
      }

      await deleteDoc(doc(db, this.invoicesCollection, invoiceId));
      return { success: true, message: 'Invoice deleted successfully!' };
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return { success: false, message: 'Failed to delete invoice: ' + error.message };
    }
  }

  // Listen to real-time updates
  listenToUserInvoices(callback) {
    if (!auth.currentUser) {
      callback({ success: false, invoices: [] });
      return null;
    }

    const q = query(
      collection(db, this.invoicesCollection),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const invoices = [];
      querySnapshot.forEach((doc) => {
        invoices.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback({ success: true, invoices });
    });
  }
}

export const invoiceStorage = new InvoiceStorage();
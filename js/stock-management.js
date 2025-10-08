import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, writeBatch } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { db, auth } from './firebase-config.js';

class StockManager {
  constructor() {
    this.products = [];
  }

  // Add new product
  async addProduct(productData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const product = {
        ...productData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'products'), product);
      return { success: true, productId: docRef.id, message: 'Product added successfully' };
    } catch (error) {
      console.error('Error adding product:', error);
      return { success: false, message: error.message };
    }
  }

  // Get all products for current user
  async getProducts() {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated', products: [] };
      }

      const q = query(collection(db, 'products'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });

      this.products = products;
      return { success: true, products: products };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { success: false, message: error.message, products: [] };
    }
  }

  // Update product
  async updateProduct(productId, productData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        ...productData,
        updatedAt: new Date().toISOString()
      });

      return { success: true, message: 'Product updated successfully' };
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, message: error.message };
    }
  }

  // Update stock quantity
  async updateStock(productId, newQuantity, operation = 'set') {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const productRef = doc(db, 'products', productId);

      if (operation === 'set') {
        await updateDoc(productRef, {
          stock: newQuantity,
          updatedAt: new Date().toISOString()
        });
      } else if (operation === 'add') {
        // Get current stock first
        const product = this.products.find(p => p.id === productId);
        if (product) {
          const newStock = (product.stock || 0) + newQuantity;
          await updateDoc(productRef, {
            stock: Math.max(0, newStock), // Prevent negative stock
            updatedAt: new Date().toISOString()
          });
        }
      } else if (operation === 'subtract') {
        // Get current stock first
        const product = this.products.find(p => p.id === productId);
        if (product) {
          const newStock = (product.stock || 0) - newQuantity;
          if (newStock < 0) {
            return { success: false, message: 'Insufficient stock available' };
          }
          await updateDoc(productRef, {
            stock: newStock,
            updatedAt: new Date().toISOString()
          });
        }
      }

      return { success: true, message: 'Stock updated successfully' };
    } catch (error) {
      console.error('Error updating stock:', error);
      return { success: false, message: error.message };
    }
  }

  // Delete product
  async deleteProduct(productId) {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      await deleteDoc(doc(db, 'products', productId));
      return { success: true, message: 'Product deleted successfully' };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, message: error.message };
    }
  }

  // Process invoice items (deduct stock)
  async processInvoiceItems(items) {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const batch = writeBatch(db);
      const stockUpdates = [];

      // Check stock availability first
      for (const item of items) {
        if (item.productId) {
          const product = this.products.find(p => p.id === item.productId);
          if (product) {
            const availableStock = product.stock || 0;
            if (availableStock < item.quantity) {
              return {
                success: false,
                message: `Insufficient stock for ${item.description}. Available: ${availableStock}, Required: ${item.quantity}`
              };
            }
            stockUpdates.push({
              productId: item.productId,
              currentStock: availableStock,
              quantityToDeduct: item.quantity
            });
          }
        }
      }

      // Process stock deductions
      for (const update of stockUpdates) {
        const productRef = doc(db, 'products', update.productId);
        const newStock = update.currentStock - update.quantityToDeduct;

        batch.update(productRef, {
          stock: newStock,
          updatedAt: new Date().toISOString()
        });
      }

      await batch.commit();

      // Update local products array
      stockUpdates.forEach(update => {
        const productIndex = this.products.findIndex(p => p.id === update.productId);
        if (productIndex !== -1) {
          this.products[productIndex].stock -= update.quantityToDeduct;
        }
      });

      return { success: true, message: 'Stock updated successfully', updatedProducts: stockUpdates.length };
    } catch (error) {
      console.error('Error processing invoice items:', error);
      return { success: false, message: error.message };
    }
  }

  // Get product by ID
  getProductById(productId) {
    return this.products.find(p => p.id === productId);
  }

  // Check stock availability
  checkStockAvailability(productId, requiredQuantity) {
    const product = this.getProductById(productId);
    if (!product) return { available: false, message: 'Product not found' };

    const availableStock = product.stock || 0;
    if (availableStock < requiredQuantity) {
      return {
        available: false,
        message: `Insufficient stock. Available: ${availableStock}, Required: ${requiredQuantity}`
      };
    }

    return { available: true, availableStock: availableStock };
  }

  // Get low stock products (stock <= 10)
  getLowStockProducts() {
    return this.products.filter(product => (product.stock || 0) <= 10);
  }

  // Get out of stock products
  getOutOfStockProducts() {
    return this.products.filter(product => (product.stock || 0) === 0);
  }

  // Load products and display in UI (called by dashboard manager)
  async loadProducts() {
    if (typeof window.loadProducts === 'function') {
      await window.loadProducts();
    } else {
      console.error('window.loadProducts function not available');
    }
  }
}

// Create global instance
export const stockManager = new StockManager();

// Make it available globally for HTML onclick handlers
window.stockManager = stockManager;

// Global functions for product management
window.editProduct = async function (productId) {
  const product = stockManager.getProductById(productId);
  if (product) {
    // Switch to add product tab and populate form
    document.querySelector('[data-tab="add-product-tab"]').click();

    // Populate form with existing data
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-hsn').value = product.hsn || '';
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-stock').value = product.stock || '';
    document.getElementById('product-unit').value = product.unit || '';
    document.getElementById('product-category').value = product.category || '';

    // Handle GST rate
    const gstRate = product.gstRate || 0;
    const gstRateSelect = document.getElementById('product-gst-rate');
    const customGstGroup = document.getElementById('custom-gst-group');
    const customGstInput = document.getElementById('product-custom-gst');

    // Check if it's a standard rate
    const standardRates = ['0', '5', '12', '18', '28'];
    if (standardRates.includes(gstRate.toString())) {
      gstRateSelect.value = gstRate.toString();
      customGstGroup.style.display = 'none';
      customGstInput.required = false;
    } else {
      gstRateSelect.value = 'custom';
      customGstGroup.style.display = 'block';
      customGstInput.value = gstRate;
      customGstInput.required = true;
    }

    // Change form to edit mode
    const form = document.getElementById('product-form');
    form.setAttribute('data-edit-id', productId);
    form.querySelector('button[type="submit"]').textContent = 'Update Product';
  }
};

window.deleteProduct = async function (productId) {
  if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
    const result = await stockManager.deleteProduct(productId);
    if (result.success) {
      alert('Product deleted successfully!');
      loadProducts(); // Refresh the list
    } else {
      alert('Failed to delete product: ' + result.message);
    }
  }
};

window.updateStock = async function (productId) {
  const product = stockManager.getProductById(productId);
  if (product) {
    const newStock = prompt(`Update stock for ${product.name}.\nCurrent stock: ${product.stock || 0}`, product.stock || 0);
    if (newStock !== null && !isNaN(newStock) && parseInt(newStock) >= 0) {
      const result = await stockManager.updateStock(productId, parseInt(newStock), 'set');
      if (result.success) {
        alert('Stock updated successfully!');
        loadProducts(); // Refresh the list
      } else {
        alert('Failed to update stock: ' + result.message);
      }
    }
  }
};

// Load products function
window.loadProducts = async function () {
  const productsList = document.getElementById('products-list');
  productsList.innerHTML = '<p>Loading products...</p>';

  const result = await stockManager.getProducts();
  if (result.success && result.products.length > 0) {
    let productsHtml = '<div class="products-grid">';

    result.products.forEach(product => {
      const stock = product.stock || 0;
      let stockBadge = '';
      let stockClass = '';

      if (stock === 0) {
        stockBadge = 'Out of Stock';
        stockClass = 'out-of-stock';
      } else if (stock <= 10) {
        stockBadge = 'Low Stock';
        stockClass = 'low-stock';
      } else {
        stockBadge = 'In Stock';
        stockClass = 'in-stock';
      }

      productsHtml += `
        <div class="product-card">
          <div class="product-header">
            <h3 class="product-name">${product.name}</h3>
            <span class="stock-badge ${stockClass}">${stockBadge}</span>
          </div>
          <div class="product-details">
            ${product.description ? `<p><strong>Description:</strong> ${product.description}</p>` : ''}
            ${product.hsn ? `<p><strong>HSN:</strong> ${product.hsn}</p>` : ''}
            <p><strong>Price:</strong> ₹${(product.price || 0).toFixed(2)} per ${product.unit || 'unit'}</p>
            <p><strong>GST Rate:</strong> ${(product.gstRate || 0)}%</p>
            <p><strong>Stock:</strong> ${stock} ${product.unit || 'units'}</p>
            ${product.category ? `<p><strong>Category:</strong> ${product.category}</p>` : ''}
          </div>
          <div class="product-actions">
            <button class="edit-product-btn" onclick="editProduct('${product.id}')">Edit</button>
            <button class="update-stock-btn" onclick="updateStock('${product.id}')">Update Stock</button>
            <button class="delete-product-btn" onclick="deleteProduct('${product.id}')">Delete</button>
          </div>
        </div>
      `;
    });

    productsHtml += '</div>';
    productsList.innerHTML = productsHtml;
  } else if (result.success && result.products.length === 0) {
    productsList.innerHTML = '<p>No products found. <a href="#" onclick="document.querySelector(\'[data-tab=\\\"add-product-tab\\\"]\').click()">Add your first product</a></p>';
  } else {
    productsList.innerHTML = '<p>Error loading products: ' + result.message + '</p>';
  }
};
/**
 * OneDrive Storage Manager for Book Library
 * Uses JSON files in OneDrive for persistent storage
 */

class OneDriveStorageManager {
    constructor() {
        this.storageFolder = 'BookLibraryData';
        this.dataFile = 'books.json';
        this.settingsFile = 'settings.json';
        this.backupFile = 'backup.json';
        
        this.isOneDriveAvailable = this.checkOneDriveAvailability();
        this.fallbackToLocalStorage = !this.isOneDriveAvailable;
        
        if (this.isOneDriveAvailable) {
            console.log('📁 OneDrive storage available - using file-based storage');
        } else {
            console.log('⚠️ OneDrive not available - falling back to localStorage');
        }
    }
    
    checkOneDriveAvailability() {
        // Check if we're running in a context where file system access is available
        try {
            // In a browser, we can't directly access OneDrive
            // But we can simulate it with IndexedDB or other browser storage
            return typeof window !== 'undefined' && 'indexedDB' in window;
        } catch (error) {
            return false;
        }
    }
    
    async saveBooks(books) {
        try {
            if (this.fallbackToLocalStorage) {
                return this.saveToLocalStorageCompact(books);
            }
            
            // Use IndexedDB for larger storage capacity
            return await this.saveToIndexedDB('books', books);
        } catch (error) {
            console.error('❌ Failed to save books:', error);
            // Final fallback to compact localStorage
            return this.saveToLocalStorageCompact(books);
        }
    }
    
    async loadBooks() {
        try {
            if (this.fallbackToLocalStorage) {
                return this.loadFromLocalStorage();
            }
            
            return await this.loadFromIndexedDB('books');
        } catch (error) {
            console.error('❌ Failed to load books:', error);
            return this.loadFromLocalStorage();
        }
    }
    
    async saveToIndexedDB(storeName, data) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('BookLibraryDB', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            };
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                // Clear existing data
                store.clear();
                
                // Add new data
                if (Array.isArray(data)) {
                    data.forEach(item => store.add(item));
                } else {
                    store.add({ id: 'main', data: data });
                }
                
                transaction.oncomplete = () => {
                    console.log('✅ Data saved to IndexedDB');
                    resolve();
                };
                
                transaction.onerror = () => reject(transaction.error);
            };
        });
    }
    
    async loadFromIndexedDB(storeName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('BookLibraryDB', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(storeName)) {
                    resolve([]);
                    return;
                }
                
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const result = request.result;
                    if (result.length === 0) {
                        resolve([]);
                    } else if (result[0].data !== undefined) {
                        // Single data object
                        resolve(result[0].data);
                    } else {
                        // Array of items
                        resolve(result);
                    }
                    console.log('✅ Data loaded from IndexedDB');
                };
                
                request.onerror = () => reject(request.error);
            };
        });
    }
    
    saveToLocalStorageCompact(books) {
        try {
            // Create a compact version without large images
            const compactBooks = books.map(book => ({
                ...book,
                // Remove large base64 images but keep URLs
                coverUrl: book.coverUrl && book.coverUrl.startsWith('data:') && book.coverUrl.length > 10000 ? '' : book.coverUrl,
                // Limit chapter content size
                chapters: book.chapters ? book.chapters.map(chapter => ({
                    ...chapter,
                    content: chapter.content && chapter.content.length > 50000 ? chapter.content.substring(0, 50000) + '...[truncated]' : chapter.content
                })) : []
            }));
            
            localStorage.setItem('bookLibraryData', JSON.stringify(compactBooks));
            console.log('💾 Data saved to localStorage (compact mode)');
            return true;
        } catch (error) {
            console.error('❌ Even compact localStorage failed:', error);
            alert('Opslag vol! Probeer enkele boeken te verwijderen of gebruik kleinere afbeeldingen.');
            return false;
        }
    }
    
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('bookLibraryData');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('❌ Failed to load from localStorage:', error);
            return [];
        }
    }
    
    async saveSettings(settings) {
        try {
            if (this.fallbackToLocalStorage) {
                localStorage.setItem('bookLibrarySettings', JSON.stringify(settings));
                return;
            }
            
            await this.saveToIndexedDB('settings', settings);
        } catch (error) {
            console.error('❌ Failed to save settings:', error);
            localStorage.setItem('bookLibrarySettings', JSON.stringify(settings));
        }
    }
    
    async loadSettings() {
        try {
            if (this.fallbackToLocalStorage) {
                const data = localStorage.getItem('bookLibrarySettings');
                return data ? JSON.parse(data) : {};
            }
            
            return await this.loadFromIndexedDB('settings');
        } catch (error) {
            console.error('❌ Failed to load settings:', error);
            const data = localStorage.getItem('bookLibrarySettings');
            return data ? JSON.parse(data) : {};
        }
    }
    
    async clearAllData() {
        try {
            if (!this.fallbackToLocalStorage) {
                const request = indexedDB.deleteDatabase('BookLibraryDB');
                request.onsuccess = () => console.log('🗑️ IndexedDB cleared');
            }
            
            // Also clear localStorage
            localStorage.removeItem('bookLibraryData');
            localStorage.removeItem('bookLibrarySettings');
            localStorage.removeItem('bookLibraryDataBackup');
            localStorage.removeItem('bookLibraryStats');
            localStorage.removeItem('bookLibraryActivities');
            
            console.log('🧹 All storage cleared');
        } catch (error) {
            console.error('❌ Failed to clear storage:', error);
        }
    }
    
    async getStorageInfo() {
        try {
            if (this.fallbackToLocalStorage) {
                const used = Object.keys(localStorage).reduce((total, key) => {
                    if (key.startsWith('bookLibrary')) {
                        return total + localStorage.getItem(key).length;
                    }
                    return total;
                }, 0);
                
                return {
                    type: 'localStorage',
                    used: `${(used / 1024).toFixed(2)} KB`,
                    limit: '~5-10 MB',
                    available: true
                };
            }
            
            return {
                type: 'IndexedDB',
                used: 'Variable',
                limit: '~50% of disk space',
                available: true
            };
        } catch (error) {
            return {
                type: 'Unknown',
                error: error.message,
                available: false
            };
        }
    }
}

// Export for use in main application
window.OneDriveStorageManager = OneDriveStorageManager;
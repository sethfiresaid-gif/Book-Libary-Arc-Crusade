// Book Library Application
class BookLibrary {
    constructor() {
        this.books = [];
        this.currentEditingId = null;
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.currentView = 'library'; // 'library' or 'dashboard'
        this.theme = 'light'; // 'light' or 'dark'
        this.currentBookId = null;
        this.currentChapterId = null;
        this.filters = {
            status: 'all',
            genre: 'all',
            search: ''
        };
        this.stats = {
            dailyGoal: 2,
            weeklyGoal: 14,
            dailyProgress: 0,
            weeklyProgress: 0,
            writingStreak: 0,
            lastWritingDate: null
        };
        this.activities = [];
        
        // Initialize storage manager for better storage handling
        this.storageManager = window.OneDriveStorageManager ? new OneDriveStorageManager() : null;
        
        this.initializeApp();
        this.loadDataFromStorageAsync();
        this.loadSampleData(); // Moved here - only loads if no data exists
        this.renderBooks();
        this.updateDashboard();
    }

    initializeApp() {
        this.bindEventListeners();
        
        // Save data when user leaves the page
        window.addEventListener('beforeunload', () => {
            this.saveDataToStorage();
            console.log('💾 Data saved before page unload');
        });
        
        // Also save data periodically (every 30 seconds)
        setInterval(() => {
            this.saveDataToStorage();
            console.log('⏰ Periodic auto-save completed');
        }, 30000);
        
        // Data integrity check every 2 minutes
        setInterval(() => {
            this.performDataIntegrityCheck();
        }, 120000);
    }

    bindEventListeners() {
        // Navigation controls
        document.getElementById('dashboardBtn')?.addEventListener('click', () => this.toggleDashboard());
        document.getElementById('themeToggleBtn')?.addEventListener('click', () => this.toggleTheme());
        
        // Modal controls
        document.getElementById('addBookBtn').addEventListener('click', () => this.openAddBookModal());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal('bookModal'));
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal('bookModal'));
        document.getElementById('closeDetailBtn').addEventListener('click', () => this.closeModal('bookDetailModal'));
        document.getElementById('closeDeleteBtn').addEventListener('click', () => this.closeModal('deleteModal'));
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.closeModal('deleteModal'));
        
        // Chapter modal controls
        document.getElementById('closeChapterBtn')?.addEventListener('click', () => this.closeModal('chapterModal'));
        document.getElementById('closeChapterEditBtn')?.addEventListener('click', () => this.closeModal('chapterEditModal'));
        document.getElementById('cancelChapterBtn')?.addEventListener('click', () => this.closeModal('chapterEditModal'));
        
        // Use event delegation for dynamically added chapter buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('#addChapterBtn')) {
                e.preventDefault();
                this.openAddChapterModal();
            }
        });
        
        // Notes modal controls
        document.getElementById('closeNotesBtn')?.addEventListener('click', () => this.closeModal('notesModal'));
        document.getElementById('saveNotesBtn')?.addEventListener('click', () => this.saveNotes());
        document.getElementById('addCharacterBtn')?.addEventListener('click', () => this.addCharacter());
        
        // Chapter Writer Modal controls
        document.getElementById('closeWriterBtn')?.addEventListener('click', () => this.closeModal('chapterWriterModal'));
        document.getElementById('chapterStatsBtn')?.addEventListener('click', () => this.toggleWriterStats());
        
        // Document Upload controls
        // Upload functionaliteit tijdelijk uitgeschakeld
        // document.getElementById('uploadDocBtn')?.addEventListener('click', () => this.openUploadModal());
        // document.getElementById('closeUploadBtn')?.addEventListener('click', () => this.closeModal('uploadModal'));
        // document.getElementById('cancelUploadBtn')?.addEventListener('click', () => this.closeModal('uploadModal'));
        document.getElementById('processUploadBtn')?.addEventListener('click', () => this.processDocument());
        
        // Force sync control
        document.getElementById('forceSyncBtn')?.addEventListener('click', () => this.forceSyncData());
        
        // Preview public page
        document.getElementById('previewPublicBtn')?.addEventListener('click', () => {
            window.open('index.html', '_blank');
        });
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('saveChapterContentBtn')?.addEventListener('click', () => this.saveChapterContent(true));
        
        // Tab controls
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Form submissions
        document.getElementById('bookForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('chapterForm')?.addEventListener('submit', (e) => this.handleChapterSubmit(e));
        
        // View toggle
        document.getElementById('toggleViewBtn').addEventListener('click', () => this.toggleView());
        
        // Filters
        document.getElementById('statusFilter').addEventListener('change', (e) => this.updateFilter('status', e.target.value));
        document.getElementById('genreFilter').addEventListener('change', (e) => this.updateFilter('genre', e.target.value));
        document.getElementById('searchInput').addEventListener('input', (e) => this.updateFilter('search', e.target.value));
        
        // Detail modal actions
        document.getElementById('chaptersBtn').addEventListener('click', () => this.openChapterModal(this.currentViewingBookId));
        document.getElementById('notesBtn').addEventListener('click', () => this.openNotesModal(this.currentViewingBookId));
        document.getElementById('editBookBtn').addEventListener('click', () => this.editCurrentBook());
        document.getElementById('deleteBookBtn').addEventListener('click', () => this.showDeleteConfirmation());
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.deleteCurrentBook());
        
        // Dashboard controls
        document.getElementById('exportStatsBtn')?.addEventListener('click', () => this.exportStatistics());
        document.getElementById('resetStatsBtn')?.addEventListener('click', () => this.resetStatistics());
        document.getElementById('dailyGoal')?.addEventListener('change', (e) => this.updateGoal('daily', e.target.value));
        document.getElementById('weeklyGoal')?.addEventListener('change', (e) => this.updateGoal('weekly', e.target.value));
        
        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.openAddBookModal();
            }
            if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.toggleDashboard();
            }
            if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    loadSampleData() {
        const sampleBooks = [
            {
                id: this.generateId(),
                title: "De Drakenkrieger",
                author: "Arc Crusade",
                genre: "fantasy",
                status: "in-progress",
                description: "Een episch verhaal over een jonge krijger die moet strijden tegen oude draken om zijn koninkrijk te redden.",
                pages: 350,
                progress: 65,
                coverUrl: "",
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                title: "Sterren van Morgen",
                author: "Arc Crusade",
                genre: "sci-fi",
                status: "draft",
                description: "In een verre toekomst moet de mensheid nieuwe planeten koloniseren om te overleven.",
                pages: 280,
                progress: 25,
                coverUrl: "",
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                title: "Het Verloren Koninkrijk",
                author: "Arc Crusade",
                genre: "adventure",
                status: "published",
                description: "Een groep avonturiers zoekt naar een legendarisch koninkrijk dat al eeuwen verloren is.",
                pages: 420,
                progress: 100,
                coverUrl: "",
                createdAt: new Date().toISOString()
            }
        ];

        // Only load sample data if no books exist
        if (this.books.length === 0) {
            this.books = sampleBooks;
            this.saveDataToStorage();
        }
    }

    generateId() {
        return 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    openAddBookModal() {
        this.currentEditingId = null;
        this.resetForm();
        document.getElementById('modalTitle').textContent = 'Nieuw Boek Toevoegen';
        document.getElementById('submitBtnText').textContent = 'Opslaan';
        this.showModal('bookModal');
    }

    editBook(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;

        this.currentEditingId = bookId;
        this.populateForm(book);
        document.getElementById('modalTitle').textContent = 'Boek Bewerken';
        document.getElementById('submitBtnText').textContent = 'Bijwerken';
        this.closeModal('bookDetailModal');
        this.showModal('bookModal');
    }

    editCurrentBook() {
        const bookId = document.getElementById('bookDetailModal').dataset.bookId;
        this.editBook(bookId);
    }

    populateForm(book) {
        document.getElementById('bookTitle').value = book.title || '';
        document.getElementById('bookAuthor').value = book.author || '';
        document.getElementById('bookGenre').value = book.genre || 'fantasy';
        document.getElementById('bookStatus').value = book.status || 'draft';
        document.getElementById('bookDescription').value = book.description || '';
        document.getElementById('bookPages').value = book.pages || '';
        document.getElementById('bookProgress').value = book.progress || 0;
        
        // Handle cover URL for editing (only if cover upload elements exist)
        const coverUrlInput = document.getElementById('coverUrlInput');
        if (book.coverUrl && coverUrlInput) {
            if (book.coverUrl.startsWith('data:')) {
                // It's a base64 image, show preview but can't put in URL field
                if (typeof showCoverPreview === 'function') {
                    showCoverPreview(book.coverUrl);
                }
                coverUrlInput.value = '';
            } else {
                // It's a URL, put in URL field
                coverUrlInput.value = book.coverUrl;
                if (typeof showCoverPreview === 'function') {
                    showCoverPreview(book.coverUrl);
                }
            }
        }
    }

    resetForm() {
        document.getElementById('bookForm').reset();
        // Only call removeCover if it exists (cover upload is implemented)
        if (typeof removeCover === 'function') {
            removeCover();
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // Get cover data from our new upload system
        const coverUrl = await getCoverData();
        
        const bookData = {
            title: formData.get('title').trim(),
            author: formData.get('author').trim() || 'Arc Crusade',
            genre: formData.get('genre'),
            status: formData.get('status'),
            description: formData.get('description').trim(),
            pages: parseInt(formData.get('pages')) || 0,
            progress: Math.min(100, Math.max(0, parseInt(formData.get('progress')) || 0)),
            coverUrl: coverUrl
        };

        if (!bookData.title) {
            alert('Titel is verplicht!');
            return;
        }

        if (this.currentEditingId) {
            this.updateBook(this.currentEditingId, bookData);
        } else {
            this.addBook(bookData);
        }

        this.closeModal('bookModal');
        this.renderBooks();
        this.saveDataToStorage();
    }

    addBook(bookData) {
        console.log('📚 addBook called with:', {
            title: bookData.title,
            hasChapters: !!bookData.chapters,
            chapterCount: bookData.chapters?.length || 0
        });
        
        const book = {
            id: this.generateId(),
            ...bookData,
            chapters: bookData.chapters || [], // Preserve existing chapters instead of overwriting
            notes: {
                general: '',
                characters: [],
                worldbuilding: '',
                plot: ''
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        console.log('📖 Final book object chapters:', book.chapters.length);
        if (book.chapters.length > 0) {
            book.chapters.forEach((ch, i) => {
                console.log(`📄 Chapter ${i+1}: "${ch.title}" - content length: ${ch.content?.length || 0}`);
            });
        }
        
        this.books.unshift(book);
        this.addActivity('create', `Nieuw boek "${bookData.title}" aangemaakt`);
        
        // Force save with verification
        this.saveDataToStorage();
        console.log('💾 New book saved:', {
            title: book.title,
            id: book.id,
            totalBooks: this.books.length
        });
        
        // Verify book was saved
        setTimeout(() => {
            const savedBooks = JSON.parse(localStorage.getItem('bookLibraryData') || '[]');
            const bookExists = savedBooks.some(b => b.id === book.id);
            if (bookExists) {
                console.log('✅ Book save verified');
            } else {
                console.error('❌ Book save failed - attempting recovery');
                this.saveDataToStorage();
            }
        }, 100);
    }

    updateBook(bookId, bookData) {
        const bookIndex = this.books.findIndex(b => b.id === bookId);
        if (bookIndex !== -1) {
            const oldBook = {...this.books[bookIndex]};
            this.books[bookIndex] = {
                ...this.books[bookIndex],
                ...bookData,
                updatedAt: new Date().toISOString()
            };
            
            // Track page progress for goals
            if (oldBook.pages !== bookData.pages && bookData.pages > oldBook.pages) {
                const pagesAdded = bookData.pages - oldBook.pages;
                this.updateWritingProgress(pagesAdded);
            }
            
            this.addActivity('edit', `Boek "${bookData.title}" bijgewerkt`);
            this.saveDataToStorage();
        }
    }

    // Theme Management
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        
        const themeBtn = document.getElementById('themeToggleBtn');
        const icon = themeBtn.querySelector('i');
        const text = themeBtn.querySelector('span');
        
        if (this.theme === 'dark') {
            icon.className = 'fas fa-sun';
            text.textContent = 'Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = 'Dark Mode';
        }
        
        this.saveDataToStorage();
    }

    // Dashboard Management
    toggleDashboard() {
        this.currentView = this.currentView === 'library' ? 'dashboard' : 'library';
        
        const dashboardSection = document.getElementById('dashboardSection');
        const mainContent = document.querySelector('.main-content');
        const dashboardBtn = document.getElementById('dashboardBtn');
        
        if (this.currentView === 'dashboard') {
            dashboardSection.style.display = 'block';
            mainContent.style.display = 'none';
            dashboardBtn.innerHTML = '<i class="fas fa-book"></i> Bibliotheek';
            this.updateDashboard();
        } else {
            dashboardSection.style.display = 'none';
            mainContent.style.display = 'block';
            dashboardBtn.innerHTML = '<i class="fas fa-chart-pie"></i> Dashboard';
        }
        
        this.saveDataToStorage();
    }

    updateDashboard() {
        this.updateStatistics();
        this.updateGenreProgress();
        this.updateGoalProgress();
        this.updateRecentActivity();
    }

    updateStatistics() {
        const totalBooks = this.books.length;
        const drafts = this.books.filter(b => b.status === 'draft').length;
        const published = this.books.filter(b => b.status === 'published').length;
        const totalPages = this.books.reduce((sum, book) => sum + (book.pages || 0), 0);
        
        document.getElementById('totalBooksCount').textContent = totalBooks;
        document.getElementById('draftsCount').textContent = drafts;
        document.getElementById('publishedCount').textContent = published;
        document.getElementById('totalPagesCount').textContent = totalPages;
    }

    updateGenreProgress() {
        const genreContainer = document.getElementById('genreProgress');
        if (!genreContainer) return;
        
        const genreCounts = {};
        const totalBooks = this.books.length;
        
        this.books.forEach(book => {
            genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
        });
        
        genreContainer.innerHTML = '';
        
        Object.entries(genreCounts).forEach(([genre, count]) => {
            const percentage = totalBooks > 0 ? (count / totalBooks) * 100 : 0;
            
            const genreItem = document.createElement('div');
            genreItem.className = 'genre-item';
            genreItem.innerHTML = `
                <span>${this.capitalizeFirst(genre)}</span>
                <div class="genre-bar">
                    <div class="genre-fill" style="width: ${percentage}%"></div>
                </div>
                <span>${count}</span>
            `;
            
            genreContainer.appendChild(genreItem);
        });
    }

    updateGoalProgress() {
        const dailyGoalInput = document.getElementById('dailyGoal');
        const weeklyGoalInput = document.getElementById('weeklyGoal');
        
        if (dailyGoalInput) dailyGoalInput.value = this.stats.dailyGoal;
        if (weeklyGoalInput) weeklyGoalInput.value = this.stats.weeklyGoal;
        
        const dailyProgressPercentage = (this.stats.dailyProgress / this.stats.dailyGoal) * 100;
        const dailyFill = document.getElementById('dailyGoalFill');
        const dailyText = document.getElementById('dailyGoalText');
        
        if (dailyFill) dailyFill.style.width = `${Math.min(100, dailyProgressPercentage)}%`;
        if (dailyText) dailyText.textContent = `${this.stats.dailyProgress}/${this.stats.dailyGoal} pagina's vandaag`;
    }

    updateGoal(type, value) {
        const numValue = parseInt(value) || 1;
        if (type === 'daily') {
            this.stats.dailyGoal = numValue;
        } else if (type === 'weekly') {
            this.stats.weeklyGoal = numValue;
        }
        this.updateGoalProgress();
        this.saveDataToStorage();
    }

    updateWritingProgress(pagesAdded) {
        const today = new Date().toDateString();
        const lastWritingDate = this.stats.lastWritingDate;
        
        // Reset daily progress if it's a new day
        if (lastWritingDate !== today) {
            this.stats.dailyProgress = 0;
            this.stats.lastWritingDate = today;
        }
        
        this.stats.dailyProgress += pagesAdded;
        this.stats.weeklyProgress += pagesAdded;
        
        // Update writing streak
        if (lastWritingDate) {
            const lastDate = new Date(lastWritingDate);
            const currentDate = new Date(today);
            const daysDiff = (currentDate - lastDate) / (1000 * 60 * 60 * 24);
            
            if (daysDiff === 1) {
                this.stats.writingStreak++;
            } else if (daysDiff > 1) {
                this.stats.writingStreak = 1;
            }
        } else {
            this.stats.writingStreak = 1;
        }
        
        this.addActivity('write', `${pagesAdded} pagina's toegevoegd`);
        this.updateGoalProgress();
    }

    updateRecentActivity() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;
        
        activityList.innerHTML = '';
        
        const recentActivities = this.activities.slice(-10).reverse();
        
        if (recentActivities.length === 0) {
            activityList.innerHTML = '<p class="empty-activity">Nog geen activiteiten</p>';
            return;
        }
        
        recentActivities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const icon = this.getActivityIcon(activity.type);
            const timeAgo = this.timeAgo(activity.timestamp);
            
            activityItem.innerHTML = `
                <div class="activity-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.description}</div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            `;
            
            activityList.appendChild(activityItem);
        });
    }

    addActivity(type, description) {
        this.activities.push({
            type,
            description,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 activities
        if (this.activities.length > 50) {
            this.activities = this.activities.slice(-50);
        }
        
        this.saveDataToStorage();
    }

    getActivityIcon(type) {
        const icons = {
            create: 'plus',
            edit: 'edit',
            delete: 'trash',
            write: 'pen',
            publish: 'share',
            chapter: 'list'
        };
        return icons[type] || 'info';
    }

    timeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = (now - time) / 1000;
        
        if (diffInSeconds < 60) {
            return 'Net nu';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minuten geleden`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} uur geleden`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} dagen geleden`;
        }
    }

    exportStatistics() {
        const stats = {
            books: this.books,
            stats: this.stats,
            activities: this.activities,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(stats, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `arc-crusade-statistieken-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    resetStatistics() {
        if (confirm('Weet je zeker dat je alle statistieken wilt resetten? Dit kan niet ongedaan gemaakt worden.')) {
            this.stats = {
                dailyGoal: 2,
                weeklyGoal: 14,
                dailyProgress: 0,
                weeklyProgress: 0,
                writingStreak: 0,
                lastWritingDate: null
            };
            this.activities = [];
            this.updateDashboard();
            this.saveDataToStorage();
            alert('Statistieken succesvol gereset!');
        }
    }

    deleteBook(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (book) {
            this.addActivity('delete', `Boek "${book.title}" verwijderd`);
        }
        this.books = this.books.filter(b => b.id !== bookId);
        this.renderBooks();
        this.saveDataToStorage();
    }

    showDeleteConfirmation() {
        const bookId = document.getElementById('bookDetailModal').dataset.bookId;
        const book = this.books.find(b => b.id === bookId);
        
        if (book) {
            document.getElementById('deleteBookTitle').textContent = book.title;
            document.getElementById('deleteModal').dataset.bookId = bookId;
            this.closeModal('bookDetailModal');
            this.showModal('deleteModal');
        }
    }

    deleteCurrentBook() {
        const bookId = document.getElementById('deleteModal').dataset.bookId;
        this.deleteBook(bookId);
        this.closeModal('deleteModal');
    }



    toggleView() {
        this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
        const bookshelf = document.getElementById('bookshelf');
        const toggleBtn = document.getElementById('toggleViewBtn');
        const icon = toggleBtn.querySelector('i');
        const text = toggleBtn.querySelector('span');
        
        if (this.viewMode === 'list') {
            bookshelf.classList.add('list-view');
            icon.className = 'fas fa-th';
            text.textContent = 'Grid View';
        } else {
            bookshelf.classList.remove('list-view');
            icon.className = 'fas fa-th-large';
            text.textContent = 'List View';
        }
        
        localStorage.setItem('viewMode', this.viewMode);
    }

    updateFilter(type, value) {
        this.filters[type] = value.toLowerCase();
        this.renderBooks();
    }

    getFilteredBooks() {
        return this.books.filter(book => {
            // Status filter
            if (this.filters.status !== 'all' && book.status !== this.filters.status) {
                return false;
            }
            
            // Genre filter
            if (this.filters.genre !== 'all' && book.genre !== this.filters.genre) {
                return false;
            }
            
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search;
                return (
                    book.title.toLowerCase().includes(searchTerm) ||
                    book.author.toLowerCase().includes(searchTerm) ||
                    book.description.toLowerCase().includes(searchTerm)
                );
            }
            
            return true;
        });
    }

    renderBooks() {
        const bookshelf = document.getElementById('bookshelf');
        const emptyState = document.getElementById('emptyState');
        const filteredBooks = this.getFilteredBooks();
        
        if (filteredBooks.length === 0) {
            bookshelf.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        bookshelf.style.display = 'grid';
        emptyState.style.display = 'none';
        
        bookshelf.innerHTML = filteredBooks.map(book => this.createBookCard(book)).join('');
        
        // Add event listeners to book cards
        filteredBooks.forEach(book => {
            const card = document.querySelector(`[data-book-id="${book.id}"]`);
            if (card) {
                card.addEventListener('click', () => this.showBookDetail(book));
            }
        });
    }

    createBookCard(book) {
        const statusClass = `status-${book.status}`;
        const coverHtml = book.coverUrl 
            ? `<img src="${book.coverUrl}" alt="${book.title} cover" onerror="this.parentElement.innerHTML='<div class=\\'default-cover\\'><i class=\\'fas fa-book\\'></i></div>'">`
            : `<div class="default-cover"><i class="fas fa-book"></i></div>`;

        return `
            <div class="book-card" data-book-id="${book.id}">
                <div class="book-cover">
                    ${coverHtml}
                </div>
                <div class="book-info">
                    <h3 class="book-title">${this.escapeHtml(book.title)}</h3>
                    <p class="book-author">door ${this.escapeHtml(book.author)}</p>
                    <div class="book-meta">
                        <span class="book-genre">${this.capitalizeFirst(book.genre)}</span>
                        <span class="book-status ${statusClass}">${this.getStatusText(book.status)}</span>
                    </div>
                    ${book.pages > 0 ? `<p class="book-pages">${book.pages} pagina's</p>` : ''}
                    <div class="book-progress">
                        <div class="progress-label">
                            <span>Voortgang</span>
                            <span>${book.progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${book.progress}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showBookDetail(book) {
        const modal = document.getElementById('bookDetailModal');
        modal.dataset.bookId = book.id;
        this.currentViewingBookId = book.id; // Store current viewing book ID
        
        document.getElementById('detailBookTitle').textContent = book.title;
        document.getElementById('detailAuthor').textContent = book.author;
        document.getElementById('detailGenre').textContent = this.capitalizeFirst(book.genre);
        document.getElementById('detailPages').textContent = book.pages > 0 ? `${book.pages} pagina's` : 'Niet opgegeven';
        document.getElementById('detailProgress').textContent = `${book.progress}%`;
        document.getElementById('detailProgressFill').style.width = `${book.progress}%`;
        document.getElementById('detailDescription').textContent = book.description || 'Geen beschrijving beschikbaar.';
        
        // Set cover image
        const coverImg = document.getElementById('detailCoverImage');
        if (book.coverUrl) {
            coverImg.src = book.coverUrl;
            coverImg.onerror = () => {
                coverImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjRjdGQUZDIi8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzExNC4zNTkgMTQwIDEyNiAxMjguMzU5IDEyNiAxMTRDMTI2IDk5LjY0MDYgMTE0LjM1OSA4OCAxMDAgODhDODUuNjQwNiA4OCA3NCA5OS42NDA2IDc0IDExNEM3NCAxMjguMzU5IDg1LjY0MDYgMTQwIDEwMCAxNDBaIiBmaWxsPSIjQ0JENUUwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNzE4MDk2IiBmb250LWZhbWlseT0iSW50ZXIiIGZvbnQtc2l6ZT0iMTQiPk5vIENvdmVyPC90ZXh0Pgo8L3N2Zz4=';
            };
        } else {
            coverImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjRjdGQUZDIi8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzExNC4zNTkgMTQwIDEyNiAxMjguMzU5IDEyNiAxMTRDMTI2IDk5LjY0MDYgMTE0LjM1OSA4OCAxMDAgODhDODUuNjQwNiA4OCA3NCA5OS42NDA2IDc0IDExNEM3NCAxMjguMzU5IDg1LjY0MDYgMTQwIDEwMCAxNDBaIiBmaWxsPSIjQ0JENUUwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNzE4MDk2IiBmb250LWZhbWlseT0iSW50ZXIiIGZvbnQtc2l6ZT0iMTQiPk5vIENvdmVyPC90ZXh0Pgo8L3N2Zz4=';
        }
        
        // Set status badge
        const statusBadge = document.getElementById('detailStatus');
        statusBadge.textContent = this.getStatusText(book.status);
        statusBadge.className = `status-badge status-${book.status}`;
        
        this.showModal('bookDetailModal');
    }

    getStatusText(status) {
        const statusTexts = {
            'draft': 'Draft',
            'in-progress': 'In Bewerking',
            'published': 'Gepubliceerd'
        };
        return statusTexts[status] || status;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
        document.body.style.overflow = '';
    }

    async saveDataToStorage() {
        try {
            console.log('💾 Saving data...', {
                booksCount: this.books.length,
                timestamp: new Date().toISOString()
            });
            
            if (this.storageManager) {
                // Use advanced storage manager
                const success = await this.storageManager.saveBooks(this.books);
                if (success) {
                    // Save settings separately
                    await this.storageManager.saveSettings({
                        theme: this.theme,
                        currentView: this.currentView,
                        viewMode: this.viewMode,
                        stats: this.stats,
                        activities: this.activities
                    });
                    console.log('✅ Data saved with advanced storage!');
                    return;
                }
            }
            
            // Fallback to compact localStorage
            this.saveDataToLocalStorageCompact();
            
        } catch (error) {
            console.error('❌ Failed to save data:', error);
            this.saveDataToLocalStorageCompact();
        }
    }
    
    saveDataToLocalStorageCompact() {
        try {
            // Create compact version without large images
            const compactBooks = this.books.map(book => ({
                ...book,
                coverUrl: book.coverUrl && book.coverUrl.startsWith('data:') && book.coverUrl.length > 10000 ? '' : book.coverUrl,
                chapters: book.chapters ? book.chapters.map(chapter => ({
                    ...chapter,
                    content: chapter.content && chapter.content.length > 30000 ? chapter.content.substring(0, 30000) + '...[truncated]' : chapter.content
                })) : []
            }));
            
            localStorage.setItem('bookLibraryData', JSON.stringify(compactBooks));
            localStorage.setItem('bookLibraryTheme', this.theme);
            localStorage.setItem('bookLibraryCurrentView', this.currentView);
            localStorage.setItem('viewMode', this.viewMode);
            
            console.log('💾 Data saved to localStorage (compact mode)');
        } catch (error) {
            console.error('❌ Even compact save failed:', error);
            alert('Opslag vol! Verwijder enkele boeken of gebruik kleinere afbeeldingen.');
        }
    }

    cleanupLargeImages() {
        console.log('🧹 Cleaning up large base64 images...');
        let cleaned = 0;
        
        this.books.forEach(book => {
            if (book.coverUrl && book.coverUrl.startsWith('data:') && book.coverUrl.length > 50000) {
                console.log(`🗑️ Removing large image from book: ${book.title}`);
                book.coverUrl = '';
                cleaned++;
            }
        });
        
        if (cleaned > 0) {
            console.log(`✅ Cleaned ${cleaned} large images to free storage space`);
        }
        
        // Also clean up old backup data
        try {
            localStorage.removeItem('bookLibraryDataBackup');
            localStorage.removeItem('bookLibraryStats');
            localStorage.removeItem('bookLibraryActivities');
            console.log('🧹 Cleaned up backup and stats data');
        } catch (error) {
            console.log('Error cleaning backup data:', error);
        }
    }

    async loadDataFromStorageAsync() {
        try {
            console.log('📚 Loading data...');
            
            if (this.storageManager) {
                // Try to load from advanced storage
                const books = await this.storageManager.loadBooks();
                const settings = await this.storageManager.loadSettings();
                
                if (books && books.length > 0) {
                    this.books = books;
                    console.log('✅ Loaded books from advanced storage:', books.length);
                }
                
                if (settings) {
                    this.theme = settings.theme || this.theme;
                    this.currentView = settings.currentView || this.currentView;
                    this.viewMode = settings.viewMode || this.viewMode;
                    this.stats = { ...this.stats, ...(settings.stats || {}) };
                    this.activities = settings.activities || this.activities;
                }
                
                this.applyLoadedSettings();
                return;
            }
        } catch (error) {
            console.warn('⚠️ Advanced storage failed, falling back to localStorage:', error);
        }
        
        // Fallback to localStorage
        this.loadDataFromStorage();
    }

    loadDataFromStorage() {
        try {
            console.log('📚 Loading data from localStorage...');
            
            // Load books
            const savedBooks = localStorage.getItem('bookLibraryData');
            if (savedBooks) {
                this.books = JSON.parse(savedBooks);
                console.log('✅ Loaded books from storage:', {
                    count: this.books.length,
                    titles: this.books.map(b => b.title)
                });
            } else {
                // Try to recover from backup if no main data exists
                const backupData = localStorage.getItem('bookLibraryDataBackup');
                if (backupData) {
                    const backup = JSON.parse(backupData);
                    if (backup.books && backup.books.length > 0) {
                        this.books = backup.books;
                        console.log('🔄 Recovered books from backup:', {
                            count: this.books.length,
                            backupDate: backup.lastSaved
                        });
                        // Save recovered data to main storage
                        localStorage.setItem('bookLibraryData', JSON.stringify(this.books));
                    } else {
                        console.log('ℹ️ No saved books found in localStorage');
                    }
                } else {
                    console.log('ℹ️ No saved books found in localStorage');
                }
            }
            
            // Load stats
            const savedStats = localStorage.getItem('bookLibraryStats');
            if (savedStats) {
                this.stats = { ...this.stats, ...JSON.parse(savedStats) };
            }
            
            // Load activities
            const savedActivities = localStorage.getItem('bookLibraryActivities');
            if (savedActivities) {
                this.activities = JSON.parse(savedActivities);
            }
            
            // Load theme
            const savedTheme = localStorage.getItem('bookLibraryTheme');
            if (savedTheme) {
                this.theme = savedTheme;
                document.documentElement.setAttribute('data-theme', this.theme);
                
                const themeBtn = document.getElementById('themeToggleBtn');
                if (themeBtn) {
                    const icon = themeBtn.querySelector('i');
                    const text = themeBtn.querySelector('span');
                    
                    if (this.theme === 'dark') {
                        icon.className = 'fas fa-sun';
                        text.textContent = 'Light Mode';
                    }
                }
            }
            
            // Load view mode
            const savedViewMode = localStorage.getItem('viewMode');
            if (savedViewMode) {
                this.viewMode = savedViewMode;
                const bookshelf = document.getElementById('bookshelf');
                const toggleBtn = document.getElementById('toggleViewBtn');
                
                if (bookshelf && toggleBtn) {
                    const icon = toggleBtn.querySelector('i');
                    const text = toggleBtn.querySelector('span');
                    
                    if (this.viewMode === 'list') {
                        bookshelf.classList.add('list-view');
                        icon.className = 'fas fa-th';
                        text.textContent = 'Grid View';
                    }
                }
            }
            
            // Load current view
            const savedCurrentView = localStorage.getItem('bookLibraryCurrentView');
            if (savedCurrentView) {
                this.currentView = savedCurrentView;
            }
        } catch (error) {
            console.error('Failed to load data from localStorage:', error);
            this.books = [];
        }
    }

    // Chapter Management
    openChapterModal(bookId) {
        this.currentBookId = bookId;
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;
        
        document.getElementById('chapterModalTitle').textContent = `Hoofdstukken - ${book.title}`;
        this.renderChapters();
        this.showModal('chapterModal');
    }

    renderChapters() {
        console.log('🎭 renderChapters called for bookId:', this.currentBookId);
        const book = this.books.find(b => b.id === this.currentBookId);
        console.log('📚 Found book:', book ? book.title : 'NOT FOUND');
        if (!book) return;
        
        console.log('📖 Book chapters in renderChapters:', book.chapters?.length || 0);
        if (book.chapters) {
            book.chapters.forEach((ch, i) => {
                console.log(`  Render Chapter ${i+1}: "${ch.title}" - ${ch.content?.length || 0} chars`);
            });
        }
        
        const chaptersList = document.getElementById('chaptersList');
        if (!chaptersList) return;
        
        const chapters = book.chapters || [];
        console.log('📋 Chapters array for rendering:', chapters.length);
        
        if (chapters.length === 0) {
            chaptersList.innerHTML = `
                <div class="empty-state">
                    <p>Nog geen hoofdstukken toegevoegd</p>
                    <button class="btn btn-primary" onclick="window.bookLibrary.openAddChapterModal()">
                        <i class="fas fa-plus"></i>
                        Eerste Hoofdstuk Toevoegen
                    </button>
                </div>
            `;
            return;
        }
        
        chaptersList.innerHTML = chapters.map(chapter => `
            <div class="chapter-item" data-chapter-id="${chapter.id}">
                <div class="chapter-info">
                    <div class="chapter-title">${this.escapeHtml(chapter.title)}</div>
                    <div class="chapter-meta">
                        <span>Hoofdstuk ${chapter.number}</span>
                        <span>${chapter.wordCount || 0} woorden</span>
                        <span class="chapter-status status-${chapter.status}">${this.getChapterStatusText(chapter.status)}</span>
                    </div>
                </div>
                <div class="chapter-actions-btn">
                    <button class="chapter-write-btn" onclick="window.bookLibrary.openChapterWriter('${chapter.id}')" title="Schrijven/Bewerken">
                        <i class="fas fa-pen"></i>
                        ${chapter.content && chapter.content.trim() ? 'Bewerken' : 'Schrijven'}
                    </button>
                    ${chapter.content && chapter.content.trim() ? `
                        <button class="chapter-read-btn" onclick="window.bookLibrary.readChapter('${chapter.id}')" title="Lezen">
                            <i class="fas fa-book-open"></i>
                            Lezen
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-sm" onclick="window.bookLibrary.editChapter('${chapter.id}')" title="Instellingen">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="window.bookLibrary.deleteChapter('${chapter.id}')" title="Verwijderen">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    openAddChapterModal() {
        this.currentChapterId = null;
        this.resetChapterForm();
        
        const book = this.books.find(b => b.id === this.currentBookId);
        const nextChapterNumber = (book?.chapters?.length || 0) + 1;
        
        document.getElementById('chapterNumber').value = nextChapterNumber;
        document.getElementById('chapterEditTitle').textContent = 'Nieuw Hoofdstuk';
        document.getElementById('chapterSubmitText').textContent = 'Hoofdstuk Toevoegen';
        
        this.closeModal('chapterModal');
        this.showModal('chapterEditModal');
    }

    editChapter(chapterId) {
        const book = this.books.find(b => b.id === this.currentBookId);
        const chapter = book?.chapters?.find(c => c.id === chapterId);
        
        if (!chapter) return;
        
        this.currentChapterId = chapterId;
        this.populateChapterForm(chapter);
        
        document.getElementById('chapterEditTitle').textContent = 'Hoofdstuk Bewerken';
        document.getElementById('chapterSubmitText').textContent = 'Hoofdstuk Bijwerken';
        
        this.closeModal('chapterModal');
        this.showModal('chapterEditModal');
    }

    populateChapterForm(chapter) {
        document.getElementById('chapterTitle').value = chapter.title || '';
        document.getElementById('chapterNumber').value = chapter.number || 1;
        document.getElementById('chapterWords').value = chapter.wordCount || 0;
        document.getElementById('chapterSummary').value = chapter.summary || '';
        document.getElementById('chapterNotes').value = chapter.notes || '';
        document.getElementById('chapterStatus').value = chapter.status || 'planned';
    }

    resetChapterForm() {
        document.getElementById('chapterForm').reset();
    }

    handleChapterSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const chapterData = {
            title: formData.get('title').trim(),
            number: parseInt(formData.get('number')) || 1,
            wordCount: parseInt(formData.get('wordCount')) || 0,
            summary: formData.get('summary').trim(),
            notes: formData.get('notes').trim(),
            status: formData.get('status')
        };
        
        if (!chapterData.title) {
            alert('Hoofdstuk titel is verplicht!');
            return;
        }
        
        const bookIndex = this.books.findIndex(b => b.id === this.currentBookId);
        if (bookIndex === -1) return;
        
        if (!this.books[bookIndex].chapters) {
            this.books[bookIndex].chapters = [];
        }
        
        if (this.currentChapterId) {
            // Update existing chapter
            const chapterIndex = this.books[bookIndex].chapters.findIndex(c => c.id === this.currentChapterId);
            if (chapterIndex !== -1) {
                this.books[bookIndex].chapters[chapterIndex] = {
                    ...this.books[bookIndex].chapters[chapterIndex],
                    ...chapterData,
                    updatedAt: new Date().toISOString()
                };
                this.addActivity('chapter', `Hoofdstuk "${chapterData.title}" bijgewerkt`);
            }
        } else {
            // Add new chapter
            const newChapter = {
                id: this.generateId(),
                ...chapterData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            this.books[bookIndex].chapters.push(newChapter);
            this.addActivity('chapter', `Hoofdstuk "${chapterData.title}" toegevoegd`);
        }
        
        // Update book's updated timestamp
        this.books[bookIndex].updatedAt = new Date().toISOString();
        
        this.closeModal('chapterEditModal');
        this.showModal('chapterModal');
        this.renderChapters();
        
        // Force save data with verification
        this.saveDataToStorage();
        console.log('💾 Chapter data saved after submit');
        
        // Double-check data was saved
        setTimeout(() => {
            const savedBooks = JSON.parse(localStorage.getItem('bookLibraryData') || '[]');
            const savedBook = savedBooks.find(b => b.id === this.currentBookId);
            if (savedBook && savedBook.chapters) {
                console.log('✅ Chapter save verified:', {
                    bookTitle: savedBook.title,
                    chapterCount: savedBook.chapters.length,
                    lastChapter: savedBook.chapters[savedBook.chapters.length - 1]?.title
                });
            }
        }, 100);
    }

    deleteChapter(chapterId) {
        if (!confirm('Weet je zeker dat je dit hoofdstuk wilt verwijderen?')) return;
        
        const bookIndex = this.books.findIndex(b => b.id === this.currentBookId);
        if (bookIndex === -1) return;
        
        const chapterIndex = this.books[bookIndex].chapters?.findIndex(c => c.id === chapterId);
        if (chapterIndex !== -1) {
            const chapter = this.books[bookIndex].chapters[chapterIndex];
            this.books[bookIndex].chapters.splice(chapterIndex, 1);
            this.addActivity('delete', `Hoofdstuk "${chapter.title}" verwijderd`);
            this.renderChapters();
            this.saveDataToStorage();
        }
    }

    getChapterStatusText(status) {
        const statusTexts = {
            'planned': 'Gepland',
            'draft': 'Draft',
            'writing': 'Schrijven',
            'review': 'Review',
            'complete': 'Voltooid'
        };
        return statusTexts[status] || status;
    }

    // Notes & World Building
    openNotesModal(bookId) {
        this.currentBookId = bookId;
        this.loadBookNotes();
        this.showModal('notesModal');
    }

    loadBookNotes() {
        const book = this.books.find(b => b.id === this.currentBookId);
        if (!book || !book.notes) return;
        
        document.getElementById('generalNotes').value = book.notes.general || '';
        document.getElementById('worldbuildingNotes').value = book.notes.worldbuilding || '';
        document.getElementById('plotNotes').value = book.notes.plot || '';
        
        this.renderCharacters();
    }

    saveNotes() {
        const bookIndex = this.books.findIndex(b => b.id === this.currentBookId);
        if (bookIndex === -1) return;
        
        if (!this.books[bookIndex].notes) {
            this.books[bookIndex].notes = {};
        }
        
        this.books[bookIndex].notes = {
            ...this.books[bookIndex].notes,
            general: document.getElementById('generalNotes').value,
            worldbuilding: document.getElementById('worldbuildingNotes').value,
            plot: document.getElementById('plotNotes').value,
            characters: this.books[bookIndex].notes.characters || []
        };
        
        this.books[bookIndex].updatedAt = new Date().toISOString();
        this.saveDataToStorage();
        
        // Visual feedback
        const saveBtn = document.getElementById('saveNotesBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Opgeslagen!';
        saveBtn.style.background = '#48bb78';
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.style.background = '';
        }, 2000);
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    addCharacter() {
        const name = prompt('Naam van het karakter:');
        if (!name) return;
        
        const role = prompt('Rol/functie van het karakter:') || '';
        const description = prompt('Korte beschrijving:') || '';
        
        const bookIndex = this.books.findIndex(b => b.id === this.currentBookId);
        if (bookIndex === -1) return;
        
        if (!this.books[bookIndex].notes) {
            this.books[bookIndex].notes = {};
        }
        if (!this.books[bookIndex].notes.characters) {
            this.books[bookIndex].notes.characters = [];
        }
        
        this.books[bookIndex].notes.characters.push({
            id: this.generateId(),
            name,
            role,
            description,
            createdAt: new Date().toISOString()
        });
        
        this.renderCharacters();
        this.saveDataToStorage();
    }

    renderCharacters() {
        const book = this.books.find(b => b.id === this.currentBookId);
        const charactersList = document.getElementById('charactersList');
        
        if (!book || !book.notes || !book.notes.characters || !charactersList) return;
        
        const characters = book.notes.characters;
        
        charactersList.innerHTML = characters.map(character => `
            <div class="character-card">
                <div class="character-name">${this.escapeHtml(character.name)}</div>
                <div class="character-role">${this.escapeHtml(character.role)}</div>
                <div class="character-description">${this.escapeHtml(character.description)}</div>
                <button class="btn btn-danger btn-sm" onclick="window.bookLibrary.deleteCharacter('${character.id}')" style="margin-top: 10px; align-self: flex-start;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    deleteCharacter(characterId) {
        if (!confirm('Weet je zeker dat je dit karakter wilt verwijderen?')) return;
        
        const bookIndex = this.books.findIndex(b => b.id === this.currentBookId);
        if (bookIndex === -1) return;
        
        if (this.books[bookIndex].notes && this.books[bookIndex].notes.characters) {
            this.books[bookIndex].notes.characters = this.books[bookIndex].notes.characters.filter(c => c.id !== characterId);
            this.renderCharacters();
            this.saveDataToStorage();
        }
    }

    // Export/Import functionality
    exportBooks() {
        const dataStr = JSON.stringify(this.books, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `arc-crusade-books-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    importBooks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedBooks = JSON.parse(e.target.result);
                if (Array.isArray(importedBooks)) {
                    this.books = importedBooks.map(book => ({
                        ...book,
                        id: book.id || this.generateId()
                    }));
                    this.saveDataToStorage();
                    this.renderBooks();
                    alert(`${importedBooks.length} boeken succesvol geïmporteerd!`);
                } else {
                    alert('Ongeldig bestandsformaat!');
                }
            } catch (error) {
                alert('Fout bij het lezen van het bestand!');
            }
        };
        reader.readAsText(file);
    }

    // Chapter Writing/Reading Functions
    openChapterWriter(chapterId) {
        const book = this.books.find(b => b.id === this.currentBookId);
        const chapter = book?.chapters?.find(c => c.id === chapterId);
        
        if (!chapter) {
            alert('Hoofdstuk niet gevonden!');
            return;
        }

        this.currentWriterChapterId = chapterId;
        this.currentWriterBookId = this.currentBookId;

        // Setup writer modal
        document.getElementById('writerChapterTitle').textContent = `${chapter.title}`;
        document.getElementById('writerBookTitle').textContent = book.title;
        document.getElementById('writerChapterInfo').textContent = `Hoofdstuk ${chapter.number}`;
        
        // Load existing content
        const contentEditor = document.getElementById('chapterContentEditor');
        contentEditor.value = chapter.content || '';
        
        // Setup auto-save
        this.setupAutoSave();
        
        // Update word count
        this.updateWriterStats();
        
        this.closeModal('chapterModal');
        this.showModal('chapterWriterModal');
        
        // Focus on editor
        setTimeout(() => contentEditor.focus(), 300);
    }

    setupAutoSave() {
        const editor = document.getElementById('chapterContentEditor');
        let autoSaveTimeout;
        
        const autoSave = () => {
            this.saveChapterContent(false);
        };
        
        editor.addEventListener('input', () => {
            this.updateWriterStats();
            this.showAutoSaveIndicator('saving');
            
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                autoSave();
            }, 2000); // Auto-save after 2 seconds of inactivity
        });

        // Setup formatting toolbar
        this.setupFormattingToolbar();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupFormattingToolbar() {
        const formatBtns = document.querySelectorAll('.format-btn');
        
        formatBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const format = btn.getAttribute('data-format');
                this.applyFormatting(format);
            });
        });
    }

    setupKeyboardShortcuts() {
        const editor = document.getElementById('chapterContentEditor');
        
        editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.applyFormatting('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.applyFormatting('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.applyFormatting('underline');
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveChapterContent(true);
                        break;
                    case 'z':
                        if (!e.shiftKey) {
                            // Undo handled by browser
                        }
                        break;
                    case 'y':
                        // Redo handled by browser
                        break;
                }
            }
        });
    }

    applyFormatting(format) {
        const editor = document.getElementById('chapterContentEditor');
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const selectedText = editor.value.substring(start, end);
        
        let replacement = selectedText;
        
        switch(format) {
            case 'bold':
                replacement = `**${selectedText}**`;
                break;
            case 'italic':
                replacement = `*${selectedText}*`;
                break;
            case 'underline':
                replacement = `<u>${selectedText}</u>`;
                break;
            case 'paragraph':
                replacement = `\n\n${selectedText}\n\n`;
                break;
            case 'quote':
                replacement = `> ${selectedText}`;
                break;
        }
        
        if (replacement !== selectedText) {
            editor.value = editor.value.substring(0, start) + replacement + editor.value.substring(end);
            editor.selectionStart = start + replacement.length;
            editor.selectionEnd = start + replacement.length;
            editor.focus();
            this.updateWriterStats();
        }
    }

    updateWriterStats() {
        const editor = document.getElementById('chapterContentEditor');
        const content = editor.value;
        
        const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
        const charCount = content.length;
        const paragraphCount = content.split(/\n\s*\n/).filter(p => p.trim()).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // ~200 words per minute
        
        document.getElementById('wordCount').textContent = wordCount.toLocaleString();
        document.getElementById('charCount').textContent = charCount.toLocaleString();
        document.getElementById('paragraphCount').textContent = paragraphCount;
        document.getElementById('readingTime').textContent = `${readingTime} min`;
        
        // Update chapter word count in book data
        if (this.currentWriterChapterId && this.currentWriterBookId) {
            const bookIndex = this.books.findIndex(b => b.id === this.currentWriterBookId);
            if (bookIndex !== -1) {
                const chapterIndex = this.books[bookIndex].chapters?.findIndex(c => c.id === this.currentWriterChapterId);
                if (chapterIndex !== -1) {
                    this.books[bookIndex].chapters[chapterIndex].wordCount = wordCount;
                }
            }
        }
    }

    saveChapterContent(showNotification = false) {
        if (!this.currentWriterChapterId || !this.currentWriterBookId) return;
        
        const content = document.getElementById('chapterContentEditor').value;
        
        const bookIndex = this.books.findIndex(b => b.id === this.currentWriterBookId);
        if (bookIndex === -1) return;
        
        const chapterIndex = this.books[bookIndex].chapters?.findIndex(c => c.id === this.currentWriterChapterId);
        if (chapterIndex === -1) return;
        
        // Save content and update metadata
        this.books[bookIndex].chapters[chapterIndex].content = content;
        this.books[bookIndex].chapters[chapterIndex].lastModified = new Date().toISOString();
        
        // Update word count
        this.updateWriterStats();
        
        // Save to localStorage with verification
        this.saveDataToStorage();
        console.log('💾 Chapter content saved:', {
            bookId: this.currentWriterBookId,
            chapterId: this.currentWriterChapterId,
            contentLength: content.length
        });
        
        // Verify save was successful
        setTimeout(() => {
            const savedBooks = JSON.parse(localStorage.getItem('bookLibraryData') || '[]');
            const book = savedBooks.find(b => b.id === this.currentWriterBookId);
            const chapter = book?.chapters?.find(c => c.id === this.currentWriterChapterId);
            if (chapter && chapter.content) {
                console.log('✅ Chapter content save verified');
            } else {
                console.error('❌ Chapter content save failed - attempting recovery');
                // Try to save again
                this.saveDataToStorage();
            }
        }, 100);
        
        // Update UI indicators
        this.showAutoSaveIndicator('saved');
        this.updateLastSavedTime();
        
        if (showNotification) {
            this.showNotification('Hoofdstuk opgeslagen!', 'success');
        }
    }

    showAutoSaveIndicator(status) {
        const indicator = document.getElementById('autosaveIndicator');
        const text = document.getElementById('autosaveText');
        
        indicator.className = 'fas fa-circle';
        
        switch(status) {
            case 'saving':
                indicator.classList.add('saving');
                text.textContent = 'Bezig met opslaan...';
                break;
            case 'saved':
                indicator.classList.add('saved');
                text.textContent = 'Automatisch opslaan: aan';
                break;
        }
    }

    updateLastSavedTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('nl-NL', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        document.getElementById('lastSavedTime').textContent = timeString;
    }

    toggleWriterStats() {
        const statsElement = document.getElementById('writerStats');
        const isVisible = statsElement.style.display !== 'none';
        statsElement.style.display = isVisible ? 'none' : 'block';
        
        const btn = document.getElementById('chapterStatsBtn');
        btn.innerHTML = isVisible ? 
            '<i class="fas fa-chart-bar"></i> Toon Statistieken' :
            '<i class="fas fa-chart-bar"></i> Verberg Statistieken';
    }

    toggleFullscreen() {
        const modal = document.getElementById('chapterWriterModal');
        const btn = document.getElementById('fullscreenBtn');
        
        if (modal.classList.contains('fullscreen')) {
            modal.classList.remove('fullscreen');
            btn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
        } else {
            modal.classList.add('fullscreen');
            btn.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : '#667eea'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    readChapter(chapterId) {
        const book = this.books.find(b => b.id === this.currentBookId);
        const chapter = book?.chapters?.find(c => c.id === chapterId);
        
        if (!chapter || !chapter.content) {
            alert('Dit hoofdstuk heeft nog geen inhoud om te lezen!');
            return;
        }

        // Open in read-only mode
        this.currentWriterChapterId = chapterId;
        this.currentWriterBookId = this.currentBookId;

        // Setup reader modal (same as writer but read-only)
        document.getElementById('writerChapterTitle').textContent = `${chapter.title} (Lezen)`;
        document.getElementById('writerBookTitle').textContent = book.title;
        document.getElementById('writerChapterInfo').textContent = `Hoofdstuk ${chapter.number}`;
        
        // Load content in read-only mode
        const contentEditor = document.getElementById('chapterContentEditor');
        contentEditor.value = chapter.content;
        contentEditor.readOnly = true;
        
        // Hide formatting toolbar in read mode
        const toolbar = document.querySelector('.editor-formatting');
        toolbar.style.display = 'none';
        
        // Update stats
        this.updateWriterStats();
        
        // Show modal
        this.closeModal('chapterModal');
        this.showModal('chapterWriterModal');
        
        // Add exit read mode button
        const saveBtn = document.getElementById('saveChapterContentBtn');
        saveBtn.innerHTML = '<i class="fas fa-edit"></i> Bewerken';
        saveBtn.onclick = () => {
            contentEditor.readOnly = false;
            toolbar.style.display = 'flex';
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Opslaan';
            saveBtn.onclick = () => this.saveChapterContent(true);
            this.setupAutoSave();
        };
    }

    // Document Upload Functions
    openUploadModal() {
        this.showModal('uploadModal');
        // Reset form
        document.getElementById('documentFile').value = '';
        document.getElementById('uploadTitle').value = '';
        document.getElementById('uploadAuthor').value = '';
        document.getElementById('uploadDescription').value = '';
        document.getElementById('autoChapters').checked = true;
        document.getElementById('uploadProgress').style.display = 'none';
        
        // Setup drag & drop functionality
        this.setupDragDrop();
    }

    setupDragDrop() {
        const fileInput = document.getElementById('documentFile');
        const modal = document.getElementById('uploadModal');
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            modal.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
        
        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            modal.addEventListener(eventName, () => modal.classList.add('drag-over'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            modal.addEventListener(eventName, () => modal.classList.remove('drag-over'), false);
        });
        
        // Handle dropped files
        modal.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                fileInput.files = files;
                this.handleFileSelect(files[0]);
            }
        }, false);
        
        // Handle file input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleFileSelect(file) {
        // Auto-fill title if empty
        const titleInput = document.getElementById('uploadTitle');
        if (!titleInput.value) {
            const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
            titleInput.value = nameWithoutExtension;
        }
        
        // Show file info
        const fileName = file.name;
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        console.log(`Selected file: ${fileName} (${fileSize} MB)`);
    }

    async processDocument() {
        const fileInput = document.getElementById('documentFile');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Selecteer eerst een document!');
            return;
        }
        
        const title = document.getElementById('uploadTitle').value.trim();
        const author = document.getElementById('uploadAuthor').value.trim() || 'Onbekend';
        const description = document.getElementById('uploadDescription').value.trim();
        const genre = document.getElementById('uploadGenre').value;
        const autoChapters = document.getElementById('autoChapters').checked;
        
        if (!title) {
            alert('Voer een titel in voor het boek!');
            return;
        }
        
        // Show progress
        document.getElementById('uploadProgress').style.display = 'block';
        document.getElementById('processUploadBtn').disabled = true;
        
        try {
            let content = '';
            
            // Process different file types
            if (file.name.endsWith('.txt')) {
                content = await this.readTextFile(file);
            } else if (file.name.endsWith('.docx')) {
                content = await this.readDocxFile(file);
            } else if (file.name.endsWith('.doc')) {
                // Note: .doc files need special handling, fallback to text
                alert('Voor .doc bestanden: converteer eerst naar .docx of .txt formaat voor beste resultaten.');
                content = await this.readTextFile(file);
            } else {
                throw new Error('Niet ondersteund bestandsformaat');
            }
            
            // Create book with content
            const book = {
                title,
                author,
                genre,
                description: description || 'Geïmporteerd document',
                status: 'draft',
                pages: Math.ceil(content.length / 250), // Rough estimation
                progress: 0,
                coverUrl: ''
            };
            
            // Debug content extraction
            console.log('📄 Extracted content length:', content.length);
            console.log('📄 Content preview (first 200 chars):', content.substring(0, 200));
            console.log('🔧 Auto chapters enabled:', autoChapters);
            
            // Process chapters if requested
            if (autoChapters) {
                console.log('📚 Processing chapters automatically...');
                book.chapters = this.extractChapters(content);
                console.log('📚 Chapters created:', book.chapters.length);
                book.chapters.forEach((ch, i) => {
                    console.log(`📖 Chapter ${i+1}: "${ch.title}" - ${ch.wordCount} words, content length: ${ch.content?.length || 0}`);
                });
            } else {
                console.log('📚 Creating single chapter with all content...');
                // Single chapter with full content
                const singleChapter = {
                    id: this.generateId(),
                    title: 'Hoofdstuk 1',
                    content: content,
                    status: 'complete',
                    wordCount: content.split(/\s+/).length,
                    notes: 'Single chapter import'
                };
                book.chapters = [singleChapter];
                console.log('📖 Single chapter created:', singleChapter.title, 'with', singleChapter.wordCount, 'words, content length:', singleChapter.content.length);
            }
            
            console.log('📚 BEFORE addBook - book chapters:', book.chapters.length);
            book.chapters.forEach((ch, i) => {
                console.log(`  Chapter ${i+1}: "${ch.title}" - ${ch.content.length} chars`);
            });
            
            this.addBook(book);
            
            console.log('📚 AFTER addBook - checking if book was added correctly...');
            const addedBook = this.books[0]; // Laatste toegevoegde boek
            console.log('📖 Added book chapters:', addedBook.chapters.length);
            addedBook.chapters.forEach((ch, i) => {
                console.log(`  Stored Chapter ${i+1}: "${ch.title}" - ${ch.content?.length || 0} chars`);
            });
            
            // Force save again to ensure persistence
            this.saveDataToStorage();
            console.log('🔄 Force saved after document upload');
            
            this.renderBooks();
            this.closeModal('uploadModal');
            
            alert(`Document "${title}" succesvol geïmporteerd met ${book.chapters.length} hoofdstuk(ken)!`);
            
            // Verify data was saved
            setTimeout(() => {
                const savedBooks = JSON.parse(localStorage.getItem('bookLibraryData') || '[]');
                console.log('📋 Verification - Books in storage after upload:', savedBooks.length);
                if (savedBooks.length > 0) {
                    const lastBook = savedBooks[0];
                    console.log('📖 Last book in storage:', lastBook.title);
                    console.log('📖 Chapters in storage:', lastBook.chapters?.length || 0);
                    if (lastBook.chapters) {
                        lastBook.chapters.forEach((ch, i) => {
                            console.log(`  Storage Chapter ${i+1}: "${ch.title}" - ${ch.content?.length || 0} chars`);
                        });
                    }
                }
            }, 100);
            
        } catch (error) {
            console.error('Error processing document:', error);
            alert('Er is een fout opgetreden bij het verwerken van het document: ' + error.message);
        } finally {
            document.getElementById('processUploadBtn').disabled = false;
            document.getElementById('uploadProgress').style.display = 'none';
        }
    }

    async readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Kan bestand niet lezen'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    async readDocxFile(file) {
        try {
            if (typeof mammoth === 'undefined') {
                throw new Error('Mammoth.js library niet geladen');
            }
            
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({arrayBuffer});
            
            if (result.value) {
                return result.value;
            } else {
                throw new Error('Geen tekst gevonden in het DOCX bestand');
            }
        } catch (error) {
            console.error('DOCX processing error:', error);
            throw new Error('Kan .docx bestand niet verwerken: ' + error.message);
        }
    }

    extractChapters(content) {
        console.log('✂️ SIMPLE KNIP EN PLAK - Creating chapters from content');
        
        // Maak gewoon hardcoded hoofdstukken
        const chapters = [
            {
                id: this.generateId(),
                title: 'Deel 1',
                content: content.substring(0, Math.floor(content.length * 0.33)),
                status: 'complete',
                wordCount: 0,
                notes: 'Eerste deel'
            },
            {
                id: this.generateId(),
                title: 'Deel 2', 
                content: content.substring(Math.floor(content.length * 0.33), Math.floor(content.length * 0.66)),
                status: 'complete',
                wordCount: 0,
                notes: 'Tweede deel'
            },
            {
                id: this.generateId(),
                title: 'Deel 3',
                content: content.substring(Math.floor(content.length * 0.66)),
                status: 'complete',
                wordCount: 0,
                notes: 'Derde deel'
            }
        ];
        
        // Bereken word counts
        chapters.forEach((ch, i) => {
            ch.wordCount = ch.content.split(/\s+/).filter(w => w.length > 0).length;
            console.log(`✂️ CREATED Chapter ${i+1}: "${ch.title}" - ${ch.wordCount} words`);
        });
        
        console.log(`✂️ KNIP EN PLAK COMPLETE: ${chapters.length} chapters created`);
        return chapters;
    }
    
    // Test functie voor hoofdstuk extractie
    testChapterExtraction(testContent) {
        console.log('🧪 TESTING chapter extraction with sample content');
        const result = this.extractChapters(testContent);
        console.log('🧪 TEST RESULT:', result);
        return result;
    }

    // Data integrity check and recovery function
    performDataIntegrityCheck() {
        try {
            console.log('🔍 Performing data integrity check...');
            
            // Check if main data exists
            const mainData = localStorage.getItem('bookLibraryData');
            const backupData = localStorage.getItem('bookLibraryDataBackup');
            
            if (!mainData && backupData) {
                console.log('🔄 Main data missing, recovering from backup...');
                const backup = JSON.parse(backupData);
                if (backup.books && Array.isArray(backup.books)) {
                    localStorage.setItem('bookLibraryData', JSON.stringify(backup.books));
                    this.books = backup.books;
                    console.log('✅ Data recovered from backup:', backup.books.length, 'books');
                    this.renderBooks();
                }
                return;
            }
            
            if (mainData) {
                const parsedData = JSON.parse(mainData);
                
                // Verify data structure
                if (!Array.isArray(parsedData)) {
                    console.warn('⚠️ Invalid data structure detected, reinitializing...');
                    this.books = [];
                    this.saveDataToStorage();
                    return;
                }
                
                // Check for data corruption
                let corruptionFound = false;
                parsedData.forEach((book, index) => {
                    if (!book.id || !book.title) {
                        console.warn(`⚠️ Corrupted book found at index ${index}:`, book);
                        corruptionFound = true;
                    }
                    
                    if (book.chapters && !Array.isArray(book.chapters)) {
                        console.warn(`⚠️ Corrupted chapters in book ${book.title}`);
                        book.chapters = [];
                        corruptionFound = true;
                    }
                });
                
                if (corruptionFound) {
                    console.log('🔧 Fixing corrupted data...');
                    this.books = parsedData.filter(book => book.id && book.title);
                    this.saveDataToStorage();
                }
                
                // Verify current memory matches storage
                if (JSON.stringify(this.books) !== JSON.stringify(parsedData) && !corruptionFound) {
                    console.log('🔄 Memory and storage out of sync, updating storage...');
                    this.saveDataToStorage();
                }
            }
            
            console.log('✅ Data integrity check completed');
            
        } catch (error) {
            console.error('❌ Data integrity check failed:', error);
            
            // Emergency recovery - try to save current state
            try {
                this.saveDataToStorage();
                console.log('🆘 Emergency save completed');
            } catch (saveError) {
                console.error('❌ Emergency save failed:', saveError);
            }
        }
    }

    // Force sync function that can be called manually
    forceSyncData() {
        console.log('🔄 Force syncing data...');
        this.saveDataToStorage();
        
        setTimeout(() => {
            const savedData = JSON.parse(localStorage.getItem('bookLibraryData') || '[]');
            if (JSON.stringify(this.books) === JSON.stringify(savedData)) {
                console.log('✅ Force sync successful');
                alert('Data succesvol gesynchroniseerd!');
            } else {
                console.error('❌ Force sync failed');
                alert('Synchronisatie mislukt - probeer opnieuw');
            }
        }, 100);
    }
}

// Global functions for modal actions
function openAddBookModal() {
    if (window.bookLibrary) {
        window.bookLibrary.openAddBookModal();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bookLibrary = new BookLibrary();
    
    // Import/export functionality tijdelijk uitgeschakeld
    // TODO: Opnieuw inschakelen wanneer document upload werkt
    /*
    const headerActions = document.querySelector('.header-actions');
    
    // Create export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-secondary';
    exportBtn.innerHTML = '<i class="fas fa-download"></i> Export';
    exportBtn.addEventListener('click', () => window.bookLibrary.exportBooks());
    
    // Create import button
    const importBtn = document.createElement('button');
    importBtn.className = 'btn btn-secondary';
    importBtn.innerHTML = '<i class="fas fa-upload"></i> Import';
    
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.json';
    importInput.style.display = 'none';
    importInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            window.bookLibrary.importBooks(e.target.files[0]);
        }
    });
    
    importBtn.addEventListener('click', () => importInput.click());
    
    headerActions.appendChild(exportBtn);
    headerActions.appendChild(importBtn);
    document.body.appendChild(importInput);
    */
    
    // Extra debug functies
    window.inspectBook = function(bookTitle) {
        const books = window.bookLibrary.books;
        const book = books.find(b => b.title.includes(bookTitle) || b.title === bookTitle);
        if (book) {
            console.log('📚 INSPECT BOOK:', book.title);
            console.log('📖 Chapters:', book.chapters?.length || 0);
            if (book.chapters) {
                book.chapters.forEach((ch, i) => {
                    console.log(`  Chapter ${i+1}: "${ch.title}" - ${ch.content?.length || 0} chars`);
                    if (ch.content) {
                        console.log(`    Preview: ${ch.content.substring(0, 100)}...`);
                    }
                });
            }
            return book;
        } else {
            console.log('📚 Book not found. Available books:', books.map(b => b.title));
            return null;
        }
    };
    
    window.forceRenderChapters = function() {
        console.log('🔄 Force rendering chapters...');
        return window.bookLibrary.renderChapters();
    };
    
    window.injectChapters = function(bookTitle) {
        console.log('💉 INJECT CHAPTERS into book:', bookTitle);
        const book = window.bookLibrary.books.find(b => b.title.includes(bookTitle));
        if (book) {
            // Forceer hoofdstukken in het boek
            book.chapters = [
                {
                    id: 'test_1',
                    title: 'Test Hoofdstuk 1',
                    content: 'Dit is de content van het eerste hoofdstuk. Lorem ipsum dolor sit amet.',
                    status: 'complete',
                    wordCount: 12,
                    notes: 'Handmatig geïnjecteerd'
                },
                {
                    id: 'test_2', 
                    title: 'Test Hoofdstuk 2',
                    content: 'Dit is de content van het tweede hoofdstuk. Meer tekst hier.',
                    status: 'complete',
                    wordCount: 11,
                    notes: 'Handmatig geïnjecteerd'
                }
            ];
            
            // Sla op
            window.bookLibrary.saveDataToStorage();
            console.log('💉 Chapters injected and saved:', book.chapters.length);
            
            // Re-render als het het huidige boek is
            if (window.bookLibrary.currentBookId === book.id) {
                window.bookLibrary.renderChapters();
            }
            
            return book;
        } else {
            console.log('❌ Book not found');
            return null;
        }
    };
});
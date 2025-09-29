// Error handler for browser extension conflicts
window.addEventListener('error', (e) => {
    if (e.message.includes('Could not establish connection')) {
        console.log('Browser extension conflict detected - ignoring');
        e.preventDefault();
        return true;
    }
});

// Public Book Library - View Published Books Only
class PublicBookLibrary {
    constructor() {
        this.books = [];
        this.currentSection = 'home';
        this.init();
    }

    init() {
        this.loadBooks();
        this.setupNavigation();
        this.setupModal();
        this.displayPublishedBooks();
        this.updateStats();
        
        // Force refresh after a short delay to ensure everything is loaded
        setTimeout(() => {
            this.displayPublishedBooks();
        }, 100);
        
        // Make switchSection function globally available
        window.switchSection = (sectionName) => this.switchSection(sectionName);
    }
    
    switchSection(sectionName) {
        console.log('Switching to section:', sectionName);
        
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionName + 'Section');
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
            
            // If switching to library, refresh books
            if (sectionName === 'library') {
                setTimeout(() => {
                    this.displayPublishedBooks();
                }, 100);
            }
        } else {
            console.warn('Section not found:', sectionName + 'Section');
        }
    }

    // Load books from localStorage (same data as admin)
    loadBooks() {
        try {
            const storedBooks = localStorage.getItem('bookLibraryData');
            console.log('Raw stored books:', storedBooks);
            
            if (storedBooks) {
                const allBooks = JSON.parse(storedBooks);
                console.log('All books loaded:', allBooks);
                console.log('Number of total books:', allBooks.length);
                
                this.books = allBooks.filter(book => book.status === 'published');
                console.log('Published books found:', this.books);
                console.log('Number of published books:', this.books.length);
                
                if (this.books.length === 0) {
                    console.warn('⚠️ No published books found! Make sure to set book status to "published" in admin panel.');
                } else {
                    console.log('✅ Published books loaded successfully!');
                }
            } else {
                console.log('No stored books found in localStorage - loading sample data');
                // Add sample published books if no data exists
                this.books = [
                    {
                        id: 'sample-1',
                        title: "Het Verloren Koninkrijk",
                        author: "Arc Crusade",
                        genre: "adventure",
                        status: "published",
                        description: "Een groep avonturiers zoekt naar een legendarisch koninkrijk dat al eeuwen verloren is. Een episch verhaal vol mysterie, vriendschap en moed.",
                        pages: 420,
                        progress: 100,
                        coverUrl: "",
                        createdAt: new Date().toISOString(),
                        chapters: [
                            {
                                id: 'ch1',
                                title: 'Hoofdstuk 1: De Mysterieuze Kaart',
                                content: 'De oude perkamenten kaart lag uitgespreid op de houten tafel van de herberg "De Gouden Draak". Kaarslicht flakkerde over de vervormde randen en vreemde symbolen die over het oppervlak waren verspreid.\n\nElara, een ervaren avonturier met emeraldgroene ogen, boog zich voorover om de kaart beter te bekijken. "Dit kan het zijn," fluisterde ze tegen haar kompanen. "De kaart naar het Verloren Koninkrijk van Aldantis."\n\nTheron, de dappere krijger naast haar, fronste zijn wenkbrauwen. "Verhalen beweren dat iedereen die het koninkrijk heeft gezocht, nooit is teruggekeerd."\n\n"Daarom noemen ze het verloren," antwoordde Elara met een glimlach. "Maar wij zijn anders dan de rest."',
                                status: 'published'
                            },
                            {
                                id: 'ch2',
                                title: 'Hoofdstuk 2: De Reis Begint',
                                content: 'Bij zonsopgang vertrok de groep uit het dorp. De kaart wees naar het noordoosten, door het Donkere Woud en over de Bergpassen van Krathen.\n\nNaarmate ze dieper het woud in trokken, werd de atmosfeer grimmiger. Oude bomen torenden boven hen uit als stille wachters, hun takken verweven tot een dicht baldakijn dat het zonlicht nauwelijks doorliet.\n\n"Ik voel ogen op ons gericht," mompelde Zara, de groeps tovenaares, terwijl ze nerveus om zich heen keek.\n\nInderdaad, vanuit de schaduwen gluurden verschillende paar gloeiende ogen naar de avonturiers. Maar nog hielden de wezens afstand, alsof ze de groep observeerden in plaats van aanvielen.',
                                status: 'published'
                            },
                            {
                                id: 'ch3',
                                title: 'Hoofdstuk 3: Het Eerste Mysterie',
                                content: 'Drie dagen later bereikten ze een verlaten ruïne midden in het woud. De stenen structuren waren bedekt met mos en klimop, maar de architectuur was duidelijk oud en indrukwekkend.\n\nIn het centrum van de ruïne stond een mysterieus altaar met inscripties in een onbekende taal. Elara vergeleek de symbolen met die op hun kaart en haar ogen lichtten op.\n\n"Dit is een wegwijzer," verklaarde ze opgewonden. "De inscripties vertellen een verhaal over een test van moed. We moeten bewijzen dat we waardig zijn om verder te gaan."\n\nPlotseling begon het altaar te gloeien en de grond onder hun voeten trilde. Het avontuur was pas net begonnen...',
                                status: 'published'
                            }
                        ]
                    },
                    {
                        id: 'sample-2',
                        title: "Mysteries van de Sterrennevel",
                        author: "Arc Crusade",
                        genre: "sci-fi",
                        status: "published",
                        description: "In de verre uithoeken van de melkweg ontdekt een ruimte-onderzoeker een mysterieuze sterrennevel die de wetten van de fysica tart.",
                        pages: 340,
                        progress: 100,
                        coverUrl: "",
                        createdAt: new Date().toISOString(),
                        chapters: [
                            {
                                id: 'sci1',
                                title: 'Hoofdstuk 1: Anomalie Gedetecteerd',
                                content: 'Commandant Sarah Chen staarde naar de sensor readings op haar scherm aan boord van het onderzoeksschip "Horizon Explorer". De data klopte niet - er was iets fundamenteel verkeerd met de sterrennevel die ze naderden.\n\n"Computer, verifieer de sensor calibratie," sprak ze tegen de AI.\n\n"Alle sensoren functioneren binnen normale parameters, Commandant," antwoordde de kunstmatige intelligentie met haar kalme, synthetische stem.\n\nSarah fronste. De nevel voor hen boog letterlijk het licht om zich heen, creëerde patronen die volgens de bekende fysica onmogelijk waren. In haar vijftien jaar als ruimte-onderzoeker had ze nooit zoiets gezien.',
                                status: 'published'
                            },
                            {
                                id: 'sci2',
                                title: 'Hoofdstuk 2: Binnen de Nevel',
                                content: 'Tegen alle protocollen in besloot Sarah de nevel binnen te varen. Zodra het schip de buitenrand raakte, gebeurden er vreemde dingen.\n\nDe sterren buiten verdwenen niet gewoon - ze leken te vervagen als aquarelverf in de regen. Tijd zelf leek anders te verlopen; haar chronometer toonde conflicterende tijden.\n\n"Commandant," riep haar navigator, "onze positie... het klopt niet. Volgens de instrumenten zijn we tegelijkertijd op drie verschillende locaties."\n\nSarah voelde een rilling over haar ruggengraat. Ze waren niet meer in de normale ruimte. Ze waren ergens anders, ergens waar de gebruikelijke regels niet meer golden.',
                                status: 'published'
                            }
                        ]
                    }
                ];
            }
        } catch (error) {
            console.error('Error loading books:', error);
            this.books = [];
        }
    }

    // Setup navigation between sections
    setupNavigation() {
        // Show home section by default
        this.switchSection('home');
        
        // Setup nav links if they exist
        const navLinks = document.querySelectorAll('a[href*="Section"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href.includes('Section')) {
                    const sectionName = href.replace('#', '').replace('Section', '');
                    this.switchSection(sectionName);
                }
            });
        });
    }

    // Setup modal functionality
    setupModal() {
        const modal = document.getElementById('publicBookModal');
        const closeBtn = document.getElementById('closePublicBookBtn');

        // Only setup if modal elements exist
        if (modal && closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                modal.style.display = 'none';
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    modal.style.display = 'none';
                }
            });

            // Close modal with Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
                    modal.classList.remove('active');
                    modal.style.display = 'none';
                }
            });
        } else {
            console.warn('Modal elements not found - modal functionality disabled');
        }
        
        // Setup chapter reader modal
        const readerModal = document.getElementById('chapterReaderModal');
        const closeReaderBtn = document.getElementById('closeReaderBtn');
        
        if (readerModal && closeReaderBtn) {
            closeReaderBtn.addEventListener('click', () => {
                readerModal.classList.remove('active');
                readerModal.style.display = 'none';
            });
            
            readerModal.addEventListener('click', (e) => {
                if (e.target === readerModal) {
                    readerModal.classList.remove('active');
                    readerModal.style.display = 'none';
                }
            });
        }
    }

    // Display published books in the library section
    displayPublishedBooks() {
        const booksContainer = document.getElementById('publishedBooks');
        const emptyState = document.getElementById('emptyState');

        if (!booksContainer) return;

        if (this.books.length === 0) {
            booksContainer.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        booksContainer.innerHTML = this.books.map(book => this.createBookCard(book)).join('');

        // Add click events to book cards
        const bookCards = booksContainer.querySelectorAll('.book-card');
        bookCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                this.showBookDetail(this.books[index]);
            });
        });
    }

    // Create book card HTML
    createBookCard(book) {
        const defaultCover = `
            <div class="default-cover">
                <i class="fas fa-book"></i>
            </div>
        `;

        const coverContent = book.coverUrl ? 
            `<img src="${book.coverUrl}" alt="${book.title}" onerror="this.parentElement.innerHTML='${defaultCover}'">` : 
            defaultCover;

        return `
            <div class="book-card" data-id="${book.id}">
                <div class="book-cover">
                    ${coverContent}
                </div>
                <div class="book-info">
                    <h3 class="book-title">${this.escapeHtml(book.title)}</h3>
                    <p class="book-author">door ${this.escapeHtml(book.author || 'Onbekende Auteur')}</p>
                    <span class="book-genre">${this.getGenreDisplayName(book.genre)}</span>
                    <p class="book-description">${this.escapeHtml(book.description || 'Geen beschrijving beschikbaar.')}</p>
                    ${book.pages ? `
                        <div class="book-pages">
                            <i class="fas fa-file-alt"></i>
                            <span>${book.pages} pagina's</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Show book detail modal
    showBookDetail(book) {
        const modal = document.getElementById('publicBookModal');
        
        // Store current book for reading
        this.currentBook = book;
        
        // Update modal content
        document.getElementById('publicBookTitle').textContent = book.title;
        document.getElementById('publicBookAuthor').textContent = book.author || 'Onbekende Auteur';
        document.getElementById('publicBookGenre').textContent = this.getGenreDisplayName(book.genre);
        document.getElementById('publicBookPages').textContent = book.pages ? `${book.pages} pagina's` : 'Onbekend';
        document.getElementById('publicBookDescription').textContent = book.description || 'Geen beschrijving beschikbaar.';

        // Update book cover
        const coverImg = document.getElementById('publicBookCover');
        if (book.coverUrl) {
            coverImg.src = book.coverUrl;
            coverImg.style.display = 'block';
        } else {
            coverImg.style.display = 'none';
        }

        // Setup read button
        const readBtn = document.getElementById('readBookBtn');
        if (readBtn) {
            readBtn.onclick = () => this.openChapterReader(book);
        }

        // Show modal
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    }

    openChapterReader(book) {
        // Close book detail modal
        const bookModal = document.getElementById('publicBookModal');
        bookModal.classList.remove('active');
        bookModal.style.display = 'none';
        
        // Open chapter reader
        const readerModal = document.getElementById('chapterReaderModal');
        document.getElementById('readerBookTitle').textContent = book.title;
        
        this.currentBook = book;
        this.currentChapterIndex = 0;
        
        // Setup chapters
        this.setupChapterReader(book);
        
        // Show reader modal
        readerModal.style.display = 'flex';
        setTimeout(() => readerModal.classList.add('active'), 10);
    }

    setupChapterReader(book) {
        const chapterSelector = document.getElementById('chapterSelector');
        const prevBtn = document.getElementById('prevChapterBtn');
        const nextBtn = document.getElementById('nextChapterBtn');
        
        // Clear existing options
        chapterSelector.innerHTML = '';
        
        // If book has no chapters, create a default one with full description/content
        let chapters = book.chapters || [];
        console.log('Original chapters:', chapters);
        
        if (chapters.length === 0) {
            chapters = [{
                id: 'default',
                title: book.title,
                content: book.description || `Dit is "${book.title}" door ${book.author || 'Onbekende Auteur'}.\n\nDit boek heeft nog geen hoofdstukken of de inhoud kon niet worden geladen.\n\nGa naar de admin panel om hoofdstukken toe te voegen of het document opnieuw te uploaden.`,
                status: 'published'
            }];
        }
        
        // Filter out empty chapters and add index for debugging
        chapters = chapters.map((chapter, index) => ({
            ...chapter,
            originalIndex: index,
            hasContent: !!(chapter.content && chapter.content.trim().length > 0)
        }));
        
        console.log('Processed chapters:', chapters);
        
        // Populate chapter selector
        chapters.forEach((chapter, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = chapter.title || `Hoofdstuk ${index + 1}`;
            chapterSelector.appendChild(option);
        });
        
        // Setup event listeners
        chapterSelector.addEventListener('change', (e) => {
            this.currentChapterIndex = parseInt(e.target.value);
            this.displayCurrentChapter(chapters);
            this.updateNavigationButtons(chapters.length);
        });
        
        prevBtn.onclick = () => {
            if (this.currentChapterIndex > 0) {
                this.currentChapterIndex--;
                chapterSelector.value = this.currentChapterIndex;
                this.displayCurrentChapter(chapters);
                this.updateNavigationButtons(chapters.length);
            }
        };
        
        nextBtn.onclick = () => {
            if (this.currentChapterIndex < chapters.length - 1) {
                this.currentChapterIndex++;
                chapterSelector.value = this.currentChapterIndex;
                this.displayCurrentChapter(chapters);
                this.updateNavigationButtons(chapters.length);
            }
        };
        
        // Display first chapter
        this.displayCurrentChapter(chapters);
        this.updateNavigationButtons(chapters.length);
    }

    displayCurrentChapter(chapters) {
        const chapter = chapters[this.currentChapterIndex];
        console.log('Displaying chapter:', chapter);
        
        document.getElementById('currentChapterTitle').textContent = chapter.title || `Hoofdstuk ${this.currentChapterIndex + 1}`;
        
        const contentDiv = document.getElementById('currentChapterContent');
        
        // Check if chapter has content
        if (chapter.content && chapter.content.trim().length > 0) {
            // Convert line breaks to paragraphs
            const paragraphs = chapter.content.split(/\n\s*\n/).filter(p => p.trim());
            if (paragraphs.length > 0) {
                contentDiv.innerHTML = paragraphs.map(p => `<p>${this.escapeHtml(p.trim())}</p>`).join('');
            } else {
                // Single paragraph without line breaks
                contentDiv.innerHTML = `<p>${this.escapeHtml(chapter.content.trim())}</p>`;
            }
        } else {
            // No content - show helpful message
            contentDiv.innerHTML = `
                <div class="no-content-message">
                    <div class="empty-icon">
                        <i class="fas fa-file-text"></i>
                    </div>
                    <h4>Geen inhoud beschikbaar</h4>
                    <p>Dit hoofdstuk heeft nog geen tekst. Mogelijk is het document leeg of kon de tekst niet worden geëxtraheerd.</p>
                    <p><strong>Suggesties:</strong></p>
                    <ul>
                        <li>Ga naar de admin panel om de inhoud handmatig toe te voegen</li>
                        <li>Probeer het document opnieuw te uploaden als .txt bestand</li>
                        <li>Controleer of het originele document tekst bevat</li>
                    </ul>
                </div>
            `;
        }
    }

    updateNavigationButtons(totalChapters) {
        const prevBtn = document.getElementById('prevChapterBtn');
        const nextBtn = document.getElementById('nextChapterBtn');
        
        prevBtn.disabled = this.currentChapterIndex === 0;
        nextBtn.disabled = this.currentChapterIndex === totalChapters - 1;
    }

    // Update statistics in about section
    updateStats() {
        const booksCountElement = document.getElementById('publicBooksCount');
        const pagesCountElement = document.getElementById('publicPagesCount');

        if (booksCountElement) {
            booksCountElement.textContent = this.books.length;
        }

        if (pagesCountElement) {
            const totalPages = this.books.reduce((sum, book) => sum + (parseInt(book.pages) || 0), 0);
            pagesCountElement.textContent = totalPages;
        }
    }

    // Get display name for genre
    getGenreDisplayName(genre) {
        const genreMap = {
            'fantasy': 'Fantasy',
            'sci-fi': 'Sci-Fi',
            'romance': 'Romance',
            'thriller': 'Thriller',
            'adventure': 'Avontuur',
            'mystery': 'Mystery',
            'horror': 'Horror',
            'comedy': 'Komedie'
        };
        return genreMap[genre] || genre || 'Onbekend';
    }

    // Escape HTML to prevent XSS
    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Public method to refresh data (called when admin updates)
    refreshBooks() {
        this.loadBooks();
        this.displayPublishedBooks();
        this.updateStats();
    }
}

// Initialize the public library when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.publicLibrary = new PublicBookLibrary();
    
    // Listen for storage changes (when admin updates books)
    window.addEventListener('storage', (e) => {
        if (e.key === 'bookLibraryData') {
            window.publicLibrary.refreshBooks();
        }
    });

    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Add some nice loading animations
window.addEventListener('load', () => {
    const bookCards = document.querySelectorAll('.book-card');
    bookCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
});
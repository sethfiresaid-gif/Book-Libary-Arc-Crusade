# Arc Crusade Boeken Bibliotheek

Een elegante boeken bibliotheek web-applicatie met admin/publieke scheiding voor de Arc Crusade website. Admins kunnen boeken beheren, bezoekers kunnen alleen gepubliceerde content bekijken.

## 🏗️ Project Architectuur

### Bestanden Structuur
```
Book-Library-Arc-Crusade/
├── index.html              # Publieke interface (bezoekers)
├── public-styles.css       # Arc Crusade website styling
├── public-script.js        # Publieke JavaScript (alleen lezen)
├── admin.html              # Admin interface (volledige controle)
├── admin-login.html        # Admin authenticatie
├── styles.css              # Admin interface styling
├── script.js               # Admin JavaScript (volledige functies)
└── README.md               # Project documentatie
```

### 🌐 Publieke Interface (index.html)
**Voor websitebezoekers** - Alleen gepubliceerde boeken bekijken
- **Arc Crusade branding** met logo en tagline
- **Navigatie**: Home, Bibliotheek, Over de Auteur
- **Responsieve book grid** met alleen published content
- **Book detail modals** voor gepubliceerde werken
- **Website styling** matching arc-crusade.com/wp/home

### 🔐 Admin Interface (admin.html) 
**Voor contentbeheer** - Volledige boeken management
- **Session-based authenticatie** met logout functionaliteit
- **Complete dashboard** met statistieken en analytics
- **Boeken CRUD** operaties (Create, Read, Update, Delete)
- **Hoofdstukken management** met drag & drop
- **Notities & Worldbuilding** systeem
- **Thema ondersteuning** (Dark/Light mode)
- **Data export/import** functionaliteit

### 🚪 Authenticatie Systeem
**Veilige toegang tot admin features**
- **Login pagina** (admin-login.html) met credential validatie
- **Session management** met "Remember Me" functionaliteit  
- **Automatische redirects** tussen public/admin interfaces
- **Logout beveiliging** met session cleanup

## 🎨 Styling & Branding

### Arc Crusade Thema
- **Kleurenschema**: Dark tones (#1a1a2e, #16213e) met accent (#e94560)
- **Typografie**: Inter voor UI, Playfair Display voor headers
- **Design**: Glassmorphisme effecten, gradients, shadows
- **Responsive**: Mobile-first design principes

### Visual Consistentie
- **Website matching**: Styling gebaseerd op arc-crusade.com
- **Logo integration**: Arc Crusade branding prominent
- **Professional appearance**: Clean, modern interface design

## 🔧 Technische Specificaties

### Frontend Stack
- **HTML5**: Semantic markup voor accessibility
- **CSS3**: Custom properties, Flexbox, Grid
- **Vanilla JavaScript**: ES6+ classes en modules
- **Font Awesome**: Voor icons en visual elements
- **Google Fonts**: Inter & Playfair Display

### Data Management  
- **LocalStorage**: Client-side persistentie
- **JSON**: Structured data voor books/chapters/notes
- **Session Storage**: Voor admin authenticatie
- **Cross-tab sync**: Real-time updates tussen interfaces

## 🚀 Setup & Deployment

### Lokale Installatie
1. **Clone/Download** project bestanden
2. **Open index.html** voor publieke interface
3. **Navigeer naar admin-login.html** voor admin toegang
4. **Default credentials**: admin / admin123

### Admin Eerste Gebruik
1. **Login** via admin-login.html met credentials
2. **Voeg boeken toe** via admin interface
3. **Publish content** om zichtbaar te maken voor publiek
4. **Configureer** gebruikersnaam/wachtwoord indien gewenst

### Website Integratie
- **Upload alle bestanden** naar webserver
- **Link naar index.html** vanaf hoofdwebsite
- **Admin toegang** via directe link naar admin-login.html
- **Branding aanpassingen** in public-styles.css indien nodig

## ✨ Admin Features (Volledige Lijst)

### 📚 Content Management
- **Boeken CRUD**: Volledige create, read, update, delete
- **Status controle**: Draft, In Progress, Published
- **Cover upload**: URL-based afbeelding ondersteuning  
- **Genre categorisatie**: Fantasy, Sci-Fi, Romance, etc.
- **Progress tracking**: Percentage voortgang per boek

### 📊 Dashboard & Analytics
- **Live statistieken**: Totaal boeken, drafts, published, pagina's
- **Genre overzicht**: Voortgang per categorie
- **Schrijfdoelen**: Dagelijks/wekelijks met tracking
- **Activiteit feed**: Recente wijzigingen timeline

### 📝 Advanced Management
- **Hoofdstukken systeem**: Per-book chapter organization
- **Drag & drop**: Hoofdstuk herordening
- **Notities tabs**: Algemeen, Karakters, Worldbuilding, Plot
- **Rich content**: Uitgebreide beschrijvingen en metadata

### 🎛️ Settings & Tools
- **Theme toggle**: Dark/Light mode switching
- **Data export**: JSON backup functionaliteit  
- **Import system**: Data restore capabilities
- **Session controls**: Login/logout management

## 👥 User Flows

### Publieke Bezoeker
1. **Bezoek** index.html (publieke interface)
2. **Browse** gepubliceerde boeken in bibliotheek sectie
3. **Bekijk details** via book modals
4. **Lees over** auteur in about sectie

### Admin/Content Creator  
1. **Login** via admin-login.html
2. **Access** admin.html (volledige interface)
3. **Manage** content via dashboard
4. **Publish** boeken voor publieke weergave
5. **Logout** wanneer klaar

## 🔒 Beveiliging

### Authenticatie
- **Credential validation**: Username/password checking
- **Session tokens**: Temporary access management
- **Auto-logout**: Session expiry handling
- **Redirect protection**: Unauthorized access prevention

### Data Protection
- **Client-side storage**: Geen server-side database risico's
- **XSS prevention**: HTML escaping in user input
- **Input validation**: Form data sanitization
- **Error handling**: Graceful failure recovery

## 🎯 Roadmap & Uitbreidingen

### Korte Termijn
- **Password reset** functionaliteit
- **Multiple admin accounts** ondersteuning
- **Advanced permissions** systeem
- **Content scheduling** voor publicatie

### Lange Termijn  
- **Cloud synchronisatie** voor data backup
- **Multi-language** interface ondersteuning
- **SEO optimization** voor publieke content
- **Analytics integration** voor bezoeker tracking
- **Mobile app** versie voor admin access

## 📱 Browser Ondersteuning

- **Chrome/Chromium**: 80+
- **Firefox**: 75+
- **Safari**: 13+ 
- **Edge**: 80+
- **Mobile browsers**: iOS Safari 13+, Chrome Mobile 80+

## 🤝 Contributing

Bijdragen welkom voor:
- **UI/UX verbeteringen**  
- **Performance optimizatie**
- **Accessibility features**
- **Cross-browser compatibility**
- **Security enhancements**

Voor grote wijzigingen, open eerst een issue voor discussie.

## 📄 Licentie

Open source onder MIT License - vrij te gebruiken en modificeren.

---

**🏰 Gebouwd voor Arc Crusade - Professional Content Management**
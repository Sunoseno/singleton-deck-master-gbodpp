
export interface Translations {
  // Navigation
  back: string;
  settings: string;
  
  // Deck Management
  addNewDeck: string;
  editDeck: string;
  deckName: string;
  enterDeckName: string;
  addCards: string;
  cardName: string;
  importText: string;
  uploadFile: string;
  saveDeck: string;
  deleteDeck: string;
  setActive: string;
  clearAllCards: string;
  
  // Card Management
  cards: string;
  commander: string;
  partnerCommander: string;
  quantity: string;
  
  // Settings
  appearance: string;
  darkMode: string;
  switchTheme: string;
  language: string;
  cacheManagement: string;
  clearCache: string;
  clearing: string;
  cachedImages: string;
  cacheSize: string;
  
  // Messages
  success: string;
  error: string;
  loading: string;
  loadingSettings: string;
  
  // Alerts
  confirmDelete: string;
  confirmClearCache: string;
  confirmClearCards: string;
  cancel: string;
  delete: string;
  clear: string;
  continue: string;
  
  // Errors
  enterDeckNameError: string;
  addCardError: string;
  saveError: string;
  deleteError: string;
  cacheError: string;
  
  // Import
  importDecklist: string;
  pasteDecklist: string;
  import: string;
  imported: string;
  failedToRead: string;
  
  // Deck Info
  totalCards: string;
  conflicts: string;
  currentLocation: string;
  otherDecks: string;
  noConflicts: string;
  
  // Cache Info
  files: string;
  deleteAllImages: string;
  cacheCleared: string;
  failedToClear: string;
}

const translations: Record<string, Translations> = {
  en: {
    // Navigation
    back: 'Back',
    settings: 'Settings',
    
    // Deck Management
    addNewDeck: 'Add New Deck',
    editDeck: 'Edit Deck',
    deckName: 'Deck Name',
    enterDeckName: 'Enter deck name',
    addCards: 'Add Cards',
    cardName: 'Card name',
    importText: 'Import Text',
    uploadFile: 'Upload File',
    saveDeck: 'Save Deck',
    deleteDeck: 'Delete Deck',
    setActive: 'Set Active',
    clearAllCards: 'Clear All Cards',
    
    // Card Management
    cards: 'Cards',
    commander: 'Commander',
    partnerCommander: 'Partner Commander',
    quantity: 'Quantity',
    
    // Settings
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    switchTheme: 'Switch between light and dark theme',
    language: 'Language',
    cacheManagement: 'Cache Management',
    clearCache: 'Clear Cache',
    clearing: 'Clearing...',
    cachedImages: 'Cached Images',
    cacheSize: 'Cache Size',
    
    // Messages
    success: 'Success',
    error: 'Error',
    loading: 'Loading...',
    loadingSettings: 'Loading settings...',
    
    // Alerts
    confirmDelete: 'Are you sure you want to delete this deck?',
    confirmClearCache: 'This will delete all downloaded card images. They will be re-downloaded when needed. Continue?',
    confirmClearCards: 'Are you sure you want to remove all cards?',
    cancel: 'Cancel',
    delete: 'Delete',
    clear: 'Clear',
    continue: 'Continue',
    
    // Errors
    enterDeckNameError: 'Please enter a deck name',
    addCardError: 'Please add at least one card',
    saveError: 'Failed to save deck',
    deleteError: 'Failed to delete deck',
    cacheError: 'Failed to clear cache. Please try again.',
    
    // Import
    importDecklist: 'Import Decklist',
    pasteDecklist: 'Paste your decklist here (one card per line):',
    import: 'Import',
    imported: 'Imported',
    failedToRead: 'Failed to read file',
    
    // Deck Info
    totalCards: 'Total Cards',
    conflicts: 'Conflicts',
    currentLocation: 'Current Location',
    otherDecks: 'Other Decks',
    noConflicts: 'No conflicts found',
    
    // Cache Info
    files: 'files',
    deleteAllImages: 'This will delete all downloaded card images from Scryfall',
    cacheCleared: 'Cache cleared successfully!',
    failedToClear: 'Failed to clear cache. Please try again.',
  },
  
  de: {
    // Navigation
    back: 'Zurück',
    settings: 'Einstellungen',
    
    // Deck Management
    addNewDeck: 'Neues Deck hinzufügen',
    editDeck: 'Deck bearbeiten',
    deckName: 'Deck-Name',
    enterDeckName: 'Deck-Name eingeben',
    addCards: 'Karten hinzufügen',
    cardName: 'Kartenname',
    importText: 'Text importieren',
    uploadFile: 'Datei hochladen',
    saveDeck: 'Deck speichern',
    deleteDeck: 'Deck löschen',
    setActive: 'Aktivieren',
    clearAllCards: 'Alle Karten löschen',
    
    // Card Management
    cards: 'Karten',
    commander: 'Kommandeur',
    partnerCommander: 'Partner-Kommandeur',
    quantity: 'Anzahl',
    
    // Settings
    appearance: 'Erscheinungsbild',
    darkMode: 'Dunkler Modus',
    switchTheme: 'Zwischen hellem und dunklem Design wechseln',
    language: 'Sprache',
    cacheManagement: 'Cache-Verwaltung',
    clearCache: 'Cache leeren',
    clearing: 'Wird geleert...',
    cachedImages: 'Zwischengespeicherte Bilder',
    cacheSize: 'Cache-Größe',
    
    // Messages
    success: 'Erfolg',
    error: 'Fehler',
    loading: 'Lädt...',
    loadingSettings: 'Einstellungen werden geladen...',
    
    // Alerts
    confirmDelete: 'Sind Sie sicher, dass Sie dieses Deck löschen möchten?',
    confirmClearCache: 'Dies löscht alle heruntergeladenen Kartenbilder. Sie werden bei Bedarf erneut heruntergeladen. Fortfahren?',
    confirmClearCards: 'Sind Sie sicher, dass Sie alle Karten entfernen möchten?',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    clear: 'Leeren',
    continue: 'Fortfahren',
    
    // Errors
    enterDeckNameError: 'Bitte geben Sie einen Deck-Namen ein',
    addCardError: 'Bitte fügen Sie mindestens eine Karte hinzu',
    saveError: 'Deck konnte nicht gespeichert werden',
    deleteError: 'Deck konnte nicht gelöscht werden',
    cacheError: 'Cache konnte nicht geleert werden. Bitte versuchen Sie es erneut.',
    
    // Import
    importDecklist: 'Deckliste importieren',
    pasteDecklist: 'Fügen Sie Ihre Deckliste hier ein (eine Karte pro Zeile):',
    import: 'Importieren',
    imported: 'Importiert',
    failedToRead: 'Datei konnte nicht gelesen werden',
    
    // Deck Info
    totalCards: 'Karten gesamt',
    conflicts: 'Konflikte',
    currentLocation: 'Aktueller Standort',
    otherDecks: 'Andere Decks',
    noConflicts: 'Keine Konflikte gefunden',
    
    // Cache Info
    files: 'Dateien',
    deleteAllImages: 'Dies löscht alle heruntergeladenen Kartenbilder von Scryfall',
    cacheCleared: 'Cache erfolgreich geleert!',
    failedToClear: 'Cache konnte nicht geleert werden. Bitte versuchen Sie es erneut.',
  },
  
  fr: {
    // Navigation
    back: 'Retour',
    settings: 'Paramètres',
    
    // Deck Management
    addNewDeck: 'Ajouter un nouveau deck',
    editDeck: 'Modifier le deck',
    deckName: 'Nom du deck',
    enterDeckName: 'Entrez le nom du deck',
    addCards: 'Ajouter des cartes',
    cardName: 'Nom de la carte',
    importText: 'Importer du texte',
    uploadFile: 'Télécharger un fichier',
    saveDeck: 'Sauvegarder le deck',
    deleteDeck: 'Supprimer le deck',
    setActive: 'Activer',
    clearAllCards: 'Effacer toutes les cartes',
    
    // Card Management
    cards: 'Cartes',
    commander: 'Commandant',
    partnerCommander: 'Commandant partenaire',
    quantity: 'Quantité',
    
    // Settings
    appearance: 'Apparence',
    darkMode: 'Mode sombre',
    switchTheme: 'Basculer entre le thème clair et sombre',
    language: 'Langue',
    cacheManagement: 'Gestion du cache',
    clearCache: 'Vider le cache',
    clearing: 'Vidage...',
    cachedImages: 'Images en cache',
    cacheSize: 'Taille du cache',
    
    // Messages
    success: 'Succès',
    error: 'Erreur',
    loading: 'Chargement...',
    loadingSettings: 'Chargement des paramètres...',
    
    // Alerts
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce deck ?',
    confirmClearCache: 'Cela supprimera toutes les images de cartes téléchargées. Elles seront re-téléchargées si nécessaire. Continuer ?',
    confirmClearCards: 'Êtes-vous sûr de vouloir supprimer toutes les cartes ?',
    cancel: 'Annuler',
    delete: 'Supprimer',
    clear: 'Vider',
    continue: 'Continuer',
    
    // Errors
    enterDeckNameError: 'Veuillez entrer un nom de deck',
    addCardError: 'Veuillez ajouter au moins une carte',
    saveError: 'Échec de la sauvegarde du deck',
    deleteError: 'Échec de la suppression du deck',
    cacheError: 'Échec du vidage du cache. Veuillez réessayer.',
    
    // Import
    importDecklist: 'Importer une liste de deck',
    pasteDecklist: 'Collez votre liste de deck ici (une carte par ligne) :',
    import: 'Importer',
    imported: 'Importé',
    failedToRead: 'Échec de la lecture du fichier',
    
    // Deck Info
    totalCards: 'Total des cartes',
    conflicts: 'Conflits',
    currentLocation: 'Emplacement actuel',
    otherDecks: 'Autres decks',
    noConflicts: 'Aucun conflit trouvé',
    
    // Cache Info
    files: 'fichiers',
    deleteAllImages: 'Cela supprimera toutes les images de cartes téléchargées depuis Scryfall',
    cacheCleared: 'Cache vidé avec succès !',
    failedToClear: 'Échec du vidage du cache. Veuillez réessayer.',
  },
  
  it: {
    // Navigation
    back: 'Indietro',
    settings: 'Impostazioni',
    
    // Deck Management
    addNewDeck: 'Aggiungi nuovo mazzo',
    editDeck: 'Modifica mazzo',
    deckName: 'Nome del mazzo',
    enterDeckName: 'Inserisci il nome del mazzo',
    addCards: 'Aggiungi carte',
    cardName: 'Nome della carta',
    importText: 'Importa testo',
    uploadFile: 'Carica file',
    saveDeck: 'Salva mazzo',
    deleteDeck: 'Elimina mazzo',
    setActive: 'Attiva',
    clearAllCards: 'Cancella tutte le carte',
    
    // Card Management
    cards: 'Carte',
    commander: 'Comandante',
    partnerCommander: 'Comandante partner',
    quantity: 'Quantità',
    
    // Settings
    appearance: 'Aspetto',
    darkMode: 'Modalità scura',
    switchTheme: 'Passa tra tema chiaro e scuro',
    language: 'Lingua',
    cacheManagement: 'Gestione cache',
    clearCache: 'Svuota cache',
    clearing: 'Svuotamento...',
    cachedImages: 'Immagini in cache',
    cacheSize: 'Dimensione cache',
    
    // Messages
    success: 'Successo',
    error: 'Errore',
    loading: 'Caricamento...',
    loadingSettings: 'Caricamento impostazioni...',
    
    // Alerts
    confirmDelete: 'Sei sicuro di voler eliminare questo mazzo?',
    confirmClearCache: 'Questo eliminerà tutte le immagini delle carte scaricate. Verranno scaricate nuovamente quando necessario. Continuare?',
    confirmClearCards: 'Sei sicuro di voler rimuovere tutte le carte?',
    cancel: 'Annulla',
    delete: 'Elimina',
    clear: 'Svuota',
    continue: 'Continua',
    
    // Errors
    enterDeckNameError: 'Inserisci un nome per il mazzo',
    addCardError: 'Aggiungi almeno una carta',
    saveError: 'Impossibile salvare il mazzo',
    deleteError: 'Impossibile eliminare il mazzo',
    cacheError: 'Impossibile svuotare la cache. Riprova.',
    
    // Import
    importDecklist: 'Importa lista mazzo',
    pasteDecklist: 'Incolla qui la tua lista del mazzo (una carta per riga):',
    import: 'Importa',
    imported: 'Importato',
    failedToRead: 'Impossibile leggere il file',
    
    // Deck Info
    totalCards: 'Carte totali',
    conflicts: 'Conflitti',
    currentLocation: 'Posizione attuale',
    otherDecks: 'Altri mazzi',
    noConflicts: 'Nessun conflitto trovato',
    
    // Cache Info
    files: 'file',
    deleteAllImages: 'Questo eliminerà tutte le immagini delle carte scaricate da Scryfall',
    cacheCleared: 'Cache svuotata con successo!',
    failedToClear: 'Impossibile svuotare la cache. Riprova.',
  },
  
  es: {
    // Navigation
    back: 'Atrás',
    settings: 'Configuración',
    
    // Deck Management
    addNewDeck: 'Agregar nuevo mazo',
    editDeck: 'Editar mazo',
    deckName: 'Nombre del mazo',
    enterDeckName: 'Ingresa el nombre del mazo',
    addCards: 'Agregar cartas',
    cardName: 'Nombre de la carta',
    importText: 'Importar texto',
    uploadFile: 'Subir archivo',
    saveDeck: 'Guardar mazo',
    deleteDeck: 'Eliminar mazo',
    setActive: 'Activar',
    clearAllCards: 'Limpiar todas las cartas',
    
    // Card Management
    cards: 'Cartas',
    commander: 'Comandante',
    partnerCommander: 'Comandante compañero',
    quantity: 'Cantidad',
    
    // Settings
    appearance: 'Apariencia',
    darkMode: 'Modo oscuro',
    switchTheme: 'Cambiar entre tema claro y oscuro',
    language: 'Idioma',
    cacheManagement: 'Gestión de caché',
    clearCache: 'Limpiar caché',
    clearing: 'Limpiando...',
    cachedImages: 'Imágenes en caché',
    cacheSize: 'Tamaño del caché',
    
    // Messages
    success: 'Éxito',
    error: 'Error',
    loading: 'Cargando...',
    loadingSettings: 'Cargando configuración...',
    
    // Alerts
    confirmDelete: '¿Estás seguro de que quieres eliminar este mazo?',
    confirmClearCache: 'Esto eliminará todas las imágenes de cartas descargadas. Se volverán a descargar cuando sea necesario. ¿Continuar?',
    confirmClearCards: '¿Estás seguro de que quieres eliminar todas las cartas?',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    clear: 'Limpiar',
    continue: 'Continuar',
    
    // Errors
    enterDeckNameError: 'Por favor ingresa un nombre para el mazo',
    addCardError: 'Por favor agrega al menos una carta',
    saveError: 'Error al guardar el mazo',
    deleteError: 'Error al eliminar el mazo',
    cacheError: 'Error al limpiar el caché. Inténtalo de nuevo.',
    
    // Import
    importDecklist: 'Importar lista de mazo',
    pasteDecklist: 'Pega tu lista de mazo aquí (una carta por línea):',
    import: 'Importar',
    imported: 'Importado',
    failedToRead: 'Error al leer el archivo',
    
    // Deck Info
    totalCards: 'Cartas totales',
    conflicts: 'Conflictos',
    currentLocation: 'Ubicación actual',
    otherDecks: 'Otros mazos',
    noConflicts: 'No se encontraron conflictos',
    
    // Cache Info
    files: 'archivos',
    deleteAllImages: 'Esto eliminará todas las imágenes de cartas descargadas de Scryfall',
    cacheCleared: '¡Caché limpiado exitosamente!',
    failedToClear: 'Error al limpiar el caché. Inténtalo de nuevo.',
  },
};

export const getTranslations = (language: string): Translations => {
  return translations[language] || translations.en;
};

export const useTranslations = (language: string) => {
  return getTranslations(language);
};

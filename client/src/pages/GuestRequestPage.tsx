import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import GuestRequestChat from '@/components/GuestRequestChat';
import {
  Hotel,
  Wrench,
  Sparkles,
  Package,
  UtensilsCrossed,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  User,
  MessageSquare,
  ArrowLeft,
  Plus,
  Clock,
  Forward,
  Car,
  Compass,
  Waves,
  Gift,
  Camera,
  ImageIcon,
  X,
  Globe,
} from 'lucide-react';

// ============ LANGUAGE SUPPORT ============
type Lang = 'sr' | 'en' | 'de' | 'fr' | 'ru' | 'it' | 'es' | 'he' | 'zh' | 'ar' | 'ja' | 'tr';

const languages: { id: Lang; label: string; flag: string }[] = [
  { id: 'sr', label: 'Srpski', flag: '🇲🇪' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
  { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  { id: 'it', label: 'Italiano', flag: '🇮🇹' },
  { id: 'es', label: 'Español', flag: '🇪🇸' },
  { id: 'he', label: 'עברית', flag: '🇮🇱' },
  { id: 'zh', label: '中文', flag: '🇨🇳' },
  { id: 'ar', label: 'العربية', flag: '🇸🇦' },
  { id: 'ja', label: '日本語', flag: '🇯🇵' },
  { id: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];

const translations: Record<Lang, Record<string, string>> = {
  sr: {
    guestService: 'Usluga za goste',
    room: 'Soba',
    floor: 'Sprat',
    reportProblem: 'Prijavi problem',
    hotelServices: 'Hotelske usluge',
    footer: 'Hvala što koristite našu uslugu. Osoblje će biti obaviješteno odmah.',
    category: 'Kategorija',
    describeRequest: 'Opišite vaš zahtjev *',
    descriptionPlaceholder: 'Detaljno opišite problem ili zahtjev...',
    photoOptional: 'Fotografija (opciono)',
    addPhoto: 'Dodaj',
    urgency: 'Hitnost',
    canWait: 'Može čekati',
    normal: 'Normalno',
    urgent: 'Hitno',
    yourInfo: 'Vaši podaci (opciono)',
    yourName: 'Vaše ime',
    phoneNumber: 'Broj telefona',
    sendRequest: 'Pošalji zahtjev',
    requestSent: 'Zahtjev poslan!',
    staffWillHandle: 'Naše osoblje će se pobrinuti za vaš zahtjev u najkraćem roku.',
    viewMyRequests: 'Pogledaj moje zahtjeve',
    sendNewRequest: 'Pošalji novi zahtjev',
    myRequests: 'Moji zahtjevi',
    backToList: 'Nazad na listu',
    messages: 'Poruke',
    noRequests: 'Nemate poslanih zahtjeva',
    viewAll: 'Pogledaj sve zahtjeve',
    viewAllCount: 'Pogledaj sve ({count}) zahtjeva',
    previousRequests: 'Vaši prethodni zahtjevi',
    checkingQR: 'Provjera QR koda...',
    invalidQR: 'QR kod nije validan',
    contactReception: 'Molimo kontaktirajte recepciju za pomoć.',
    forwarded: 'Proslijeđeno',
    housekeeping: 'Domaćinstvo',
    technicalService: 'Tehnička služba',
    statusNew: 'Novi',
    statusSeen: 'Primljeno',
    statusInProgress: 'U obradi',
    statusCompleted: 'Završeno',
    imageTooLarge: 'Prevelika slika',
    maxImageSize: 'Maksimalna veličina je 5MB',
    error: 'Greška',
    success: 'Uspješno',
    selectRequestType: 'Odaberite vrstu zahtjeva',
    describeYourRequest: 'Opišite vaš zahtjev',
    requestSentToast: 'Vaš zahtjev je poslan!',
    errorSending: 'Došlo je do greške pri slanju',
    // Request types
    maintenance: 'Tehnički problem',
    maintenanceDesc: 'Kvar, popravka, instalacija',
    housekeepingType: 'Čišćenje',
    housekeepingDesc: 'Dodatno čišćenje, promjena posteljine',
    amenities: 'Potrepštine',
    amenitiesDesc: 'Ručnici, sapun, toalet papir',
    restaurant: 'Restoran',
    restaurantDesc: 'Rezervacija, room service, specijaliteti',
    spa: 'Spa & Wellness',
    spaDesc: 'Masaža, sauna, bazen, tretmani',
    rentACar: 'Rent a Car',
    rentACarDesc: 'Iznajmljivanje vozila, transfer',
    excursion: 'Izleti & Ture',
    excursionDesc: 'Ekskurzije, razgledanje, avanture',
    otherServices: 'Ostale usluge',
    otherServicesDesc: 'Poklon paketi, proslava, posebni zahtjevi',
    // Categories
    plumbing: 'Vodoinstalacije', electrical: 'Elektrika', hvac: 'Grijanje/Klima', tvInternet: 'TV/Internet',
    doorsWindows: 'Vrata/Prozori', other: 'Ostalo',
    bedChange: 'Promjena posteljine', roomCleaning: 'Čišćenje sobe', bathroomCleaning: 'Čišćenje kupatila', vacuuming: 'Usisavanje',
    towels: 'Ručnici', soapShampoo: 'Sapun/Šampon', toiletPaper: 'Toalet papir', water: 'Voda za piće', minibar: 'Minibar',
    tableReservation: 'Rezervacija stola', roomService: 'Room Service', breakfastInRoom: 'Doručak u sobu', specialties: 'Specijaliteti kuhinje', cakeCelebration: 'Torta/Proslava',
    massage: 'Masaža', sauna: 'Sauna', pool: 'Bazen', facialTreatment: 'Tretman lica', bodyTreatment: 'Tretman tijela', wellnessPackage: 'Paket wellness',
    carRental: 'Iznajmljivanje auta', airportTransfer: 'Aerodromski transfer', privateDriver: 'Privatni vozač', dailyRental: 'Dnevni najam',
    cityTour: 'Razgledanje grada', boatTrip: 'Izlet brodom', hiking: 'Planinarenje', wineTour: 'Vinski obilazak', culturalTour: 'Kulturna tura', adventure: 'Avantura',
    giftPackage: 'Poklon paket', roomDecoration: 'Dekoracija sobe', birthdayCelebration: 'Proslava rođendana', flowerBouquet: 'Buket cvijeća',
  },
  en: {
    guestService: 'Guest Services',
    room: 'Room',
    floor: 'Floor',
    reportProblem: 'Report a Problem',
    hotelServices: 'Hotel Services',
    footer: 'Thank you for using our service. Staff will be notified immediately.',
    category: 'Category',
    describeRequest: 'Describe your request *',
    descriptionPlaceholder: 'Describe the problem or request in detail...',
    photoOptional: 'Photo (optional)',
    addPhoto: 'Add',
    urgency: 'Urgency',
    canWait: 'Can wait',
    normal: 'Normal',
    urgent: 'Urgent',
    yourInfo: 'Your details (optional)',
    yourName: 'Your name',
    phoneNumber: 'Phone number',
    sendRequest: 'Send Request',
    requestSent: 'Request Sent!',
    staffWillHandle: 'Our staff will take care of your request as soon as possible.',
    viewMyRequests: 'View My Requests',
    sendNewRequest: 'Send New Request',
    myRequests: 'My Requests',
    backToList: 'Back to list',
    messages: 'Messages',
    noRequests: 'No requests submitted',
    viewAll: 'View all requests',
    viewAllCount: 'View all ({count}) requests',
    previousRequests: 'Your previous requests',
    checkingQR: 'Checking QR code...',
    invalidQR: 'QR code is invalid',
    contactReception: 'Please contact the reception for assistance.',
    forwarded: 'Forwarded',
    housekeeping: 'Housekeeping',
    technicalService: 'Technical Service',
    statusNew: 'New',
    statusSeen: 'Received',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    imageTooLarge: 'Image too large',
    maxImageSize: 'Maximum size is 5MB',
    error: 'Error',
    success: 'Success',
    selectRequestType: 'Select request type',
    describeYourRequest: 'Describe your request',
    requestSentToast: 'Your request has been sent!',
    errorSending: 'An error occurred while sending',
    maintenance: 'Technical Issue',
    maintenanceDesc: 'Repair, malfunction, installation',
    housekeepingType: 'Cleaning',
    housekeepingDesc: 'Extra cleaning, linen change',
    amenities: 'Amenities',
    amenitiesDesc: 'Towels, soap, toilet paper',
    restaurant: 'Restaurant',
    restaurantDesc: 'Reservation, room service, specials',
    spa: 'Spa & Wellness',
    spaDesc: 'Massage, sauna, pool, treatments',
    rentACar: 'Rent a Car',
    rentACarDesc: 'Vehicle rental, transfer',
    excursion: 'Trips & Tours',
    excursionDesc: 'Excursions, sightseeing, adventure',
    otherServices: 'Other Services',
    otherServicesDesc: 'Gift packages, celebrations, special requests',
    plumbing: 'Plumbing', electrical: 'Electrical', hvac: 'Heating/AC', tvInternet: 'TV/Internet',
    doorsWindows: 'Doors/Windows', other: 'Other',
    bedChange: 'Linen change', roomCleaning: 'Room cleaning', bathroomCleaning: 'Bathroom cleaning', vacuuming: 'Vacuuming',
    towels: 'Towels', soapShampoo: 'Soap/Shampoo', toiletPaper: 'Toilet paper', water: 'Drinking water', minibar: 'Minibar',
    tableReservation: 'Table reservation', roomService: 'Room Service', breakfastInRoom: 'Breakfast in room', specialties: 'Kitchen specialties', cakeCelebration: 'Cake/Celebration',
    massage: 'Massage', sauna: 'Sauna', pool: 'Pool', facialTreatment: 'Facial treatment', bodyTreatment: 'Body treatment', wellnessPackage: 'Wellness package',
    carRental: 'Car rental', airportTransfer: 'Airport transfer', privateDriver: 'Private driver', dailyRental: 'Daily rental',
    cityTour: 'City tour', boatTrip: 'Boat trip', hiking: 'Hiking', wineTour: 'Wine tour', culturalTour: 'Cultural tour', adventure: 'Adventure',
    giftPackage: 'Gift package', roomDecoration: 'Room decoration', birthdayCelebration: 'Birthday celebration', flowerBouquet: 'Flower bouquet',
  },
  de: {
    guestService: 'Gästeservice',
    room: 'Zimmer',
    floor: 'Etage',
    reportProblem: 'Problem melden',
    hotelServices: 'Hoteldienstleistungen',
    footer: 'Vielen Dank für die Nutzung unseres Services. Das Personal wird sofort benachrichtigt.',
    category: 'Kategorie',
    describeRequest: 'Beschreiben Sie Ihre Anfrage *',
    descriptionPlaceholder: 'Beschreiben Sie das Problem oder die Anfrage im Detail...',
    photoOptional: 'Foto (optional)',
    addPhoto: 'Hinzufügen',
    urgency: 'Dringlichkeit',
    canWait: 'Kann warten',
    normal: 'Normal',
    urgent: 'Dringend',
    yourInfo: 'Ihre Daten (optional)',
    yourName: 'Ihr Name',
    phoneNumber: 'Telefonnummer',
    sendRequest: 'Anfrage senden',
    requestSent: 'Anfrage gesendet!',
    staffWillHandle: 'Unser Personal kümmert sich schnellstmöglich um Ihre Anfrage.',
    viewMyRequests: 'Meine Anfragen ansehen',
    sendNewRequest: 'Neue Anfrage senden',
    myRequests: 'Meine Anfragen',
    backToList: 'Zurück zur Liste',
    messages: 'Nachrichten',
    noRequests: 'Keine Anfragen eingereicht',
    viewAll: 'Alle Anfragen ansehen',
    viewAllCount: 'Alle ({count}) Anfragen ansehen',
    previousRequests: 'Ihre vorherigen Anfragen',
    checkingQR: 'QR-Code wird überprüft...',
    invalidQR: 'QR-Code ist ungültig',
    contactReception: 'Bitte kontaktieren Sie die Rezeption.',
    forwarded: 'Weitergeleitet',
    housekeeping: 'Hauswirtschaft',
    technicalService: 'Technischer Dienst',
    statusNew: 'Neu', statusSeen: 'Empfangen', statusInProgress: 'In Bearbeitung', statusCompleted: 'Abgeschlossen',
    imageTooLarge: 'Bild zu groß', maxImageSize: 'Maximale Größe ist 5MB',
    error: 'Fehler', success: 'Erfolg',
    selectRequestType: 'Anfragetyp auswählen', describeYourRequest: 'Beschreiben Sie Ihre Anfrage',
    requestSentToast: 'Ihre Anfrage wurde gesendet!', errorSending: 'Fehler beim Senden',
    maintenance: 'Technisches Problem', maintenanceDesc: 'Reparatur, Defekt, Installation',
    housekeepingType: 'Reinigung', housekeepingDesc: 'Zusätzliche Reinigung, Bettwäsche',
    amenities: 'Ausstattung', amenitiesDesc: 'Handtücher, Seife, Toilettenpapier',
    restaurant: 'Restaurant', restaurantDesc: 'Reservierung, Zimmerservice, Spezialitäten',
    spa: 'Spa & Wellness', spaDesc: 'Massage, Sauna, Pool, Behandlungen',
    rentACar: 'Mietwagen', rentACarDesc: 'Fahrzeugvermietung, Transfer',
    excursion: 'Ausflüge & Touren', excursionDesc: 'Exkursionen, Besichtigungen, Abenteuer',
    otherServices: 'Weitere Dienste', otherServicesDesc: 'Geschenkpakete, Feier, Sonderwünsche',
    plumbing: 'Sanitär', electrical: 'Elektrik', hvac: 'Heizung/Klima', tvInternet: 'TV/Internet',
    doorsWindows: 'Türen/Fenster', other: 'Sonstiges',
    bedChange: 'Bettwäsche wechseln', roomCleaning: 'Zimmerreinigung', bathroomCleaning: 'Badreinigung', vacuuming: 'Staubsaugen',
    towels: 'Handtücher', soapShampoo: 'Seife/Shampoo', toiletPaper: 'Toilettenpapier', water: 'Trinkwasser', minibar: 'Minibar',
    tableReservation: 'Tischreservierung', roomService: 'Zimmerservice', breakfastInRoom: 'Frühstück im Zimmer', specialties: 'Küchenspezialitäten', cakeCelebration: 'Torte/Feier',
    massage: 'Massage', sauna: 'Sauna', pool: 'Pool', facialTreatment: 'Gesichtsbehandlung', bodyTreatment: 'Körperbehandlung', wellnessPackage: 'Wellness-Paket',
    carRental: 'Autovermietung', airportTransfer: 'Flughafentransfer', privateDriver: 'Privatchauffeur', dailyRental: 'Tagesmiete',
    cityTour: 'Stadtrundfahrt', boatTrip: 'Bootsfahrt', hiking: 'Wandern', wineTour: 'Weintour', culturalTour: 'Kulturtour', adventure: 'Abenteuer',
    giftPackage: 'Geschenkpaket', roomDecoration: 'Zimmerdekoration', birthdayCelebration: 'Geburtstagsfeier', flowerBouquet: 'Blumenstrauß',
  },
  fr: {
    guestService: 'Service aux clients',
    room: 'Chambre',
    floor: 'Étage',
    reportProblem: 'Signaler un problème',
    hotelServices: 'Services hôteliers',
    footer: 'Merci d\'utiliser notre service. Le personnel sera informé immédiatement.',
    category: 'Catégorie',
    describeRequest: 'Décrivez votre demande *',
    descriptionPlaceholder: 'Décrivez le problème ou la demande en détail...',
    photoOptional: 'Photo (facultatif)',
    addPhoto: 'Ajouter',
    urgency: 'Urgence',
    canWait: 'Peut attendre',
    normal: 'Normal',
    urgent: 'Urgent',
    yourInfo: 'Vos coordonnées (facultatif)',
    yourName: 'Votre nom',
    phoneNumber: 'Numéro de téléphone',
    sendRequest: 'Envoyer la demande',
    requestSent: 'Demande envoyée !',
    staffWillHandle: 'Notre personnel s\'occupera de votre demande dans les plus brefs délais.',
    viewMyRequests: 'Voir mes demandes',
    sendNewRequest: 'Nouvelle demande',
    myRequests: 'Mes demandes',
    backToList: 'Retour à la liste',
    messages: 'Messages',
    noRequests: 'Aucune demande soumise',
    viewAll: 'Voir toutes les demandes',
    viewAllCount: 'Voir toutes les ({count}) demandes',
    previousRequests: 'Vos demandes précédentes',
    checkingQR: 'Vérification du QR code...',
    invalidQR: 'QR code invalide',
    contactReception: 'Veuillez contacter la réception.',
    forwarded: 'Transféré',
    housekeeping: 'Ménage',
    technicalService: 'Service technique',
    statusNew: 'Nouveau', statusSeen: 'Reçu', statusInProgress: 'En cours', statusCompleted: 'Terminé',
    imageTooLarge: 'Image trop grande', maxImageSize: 'Taille maximale 5 Mo',
    error: 'Erreur', success: 'Succès',
    selectRequestType: 'Sélectionnez le type', describeYourRequest: 'Décrivez votre demande',
    requestSentToast: 'Votre demande a été envoyée !', errorSending: 'Erreur lors de l\'envoi',
    maintenance: 'Problème technique', maintenanceDesc: 'Réparation, panne, installation',
    housekeepingType: 'Nettoyage', housekeepingDesc: 'Nettoyage supplémentaire, changement de draps',
    amenities: 'Fournitures', amenitiesDesc: 'Serviettes, savon, papier toilette',
    restaurant: 'Restaurant', restaurantDesc: 'Réservation, room service, spécialités',
    spa: 'Spa & Bien-être', spaDesc: 'Massage, sauna, piscine, soins',
    rentACar: 'Location de voiture', rentACarDesc: 'Location de véhicule, transfert',
    excursion: 'Excursions & Tours', excursionDesc: 'Excursions, visites, aventures',
    otherServices: 'Autres services', otherServicesDesc: 'Cadeaux, célébrations, demandes spéciales',
    plumbing: 'Plomberie', electrical: 'Électricité', hvac: 'Chauffage/Clim', tvInternet: 'TV/Internet',
    doorsWindows: 'Portes/Fenêtres', other: 'Autre',
    bedChange: 'Changement de draps', roomCleaning: 'Nettoyage chambre', bathroomCleaning: 'Nettoyage salle de bain', vacuuming: 'Aspiration',
    towels: 'Serviettes', soapShampoo: 'Savon/Shampooing', toiletPaper: 'Papier toilette', water: 'Eau potable', minibar: 'Minibar',
    tableReservation: 'Réservation de table', roomService: 'Room Service', breakfastInRoom: 'Petit-déjeuner en chambre', specialties: 'Spécialités', cakeCelebration: 'Gâteau/Célébration',
    massage: 'Massage', sauna: 'Sauna', pool: 'Piscine', facialTreatment: 'Soin du visage', bodyTreatment: 'Soin du corps', wellnessPackage: 'Forfait bien-être',
    carRental: 'Location auto', airportTransfer: 'Transfert aéroport', privateDriver: 'Chauffeur privé', dailyRental: 'Location journalière',
    cityTour: 'Visite de la ville', boatTrip: 'Excursion en bateau', hiking: 'Randonnée', wineTour: 'Tour viticole', culturalTour: 'Tour culturel', adventure: 'Aventure',
    giftPackage: 'Coffret cadeau', roomDecoration: 'Décoration chambre', birthdayCelebration: 'Fête d\'anniversaire', flowerBouquet: 'Bouquet de fleurs',
  },
  ru: {
    guestService: 'Сервис для гостей',
    room: 'Номер',
    floor: 'Этаж',
    reportProblem: 'Сообщить о проблеме',
    hotelServices: 'Услуги отеля',
    footer: 'Спасибо за использование нашего сервиса. Персонал будет уведомлён немедленно.',
    category: 'Категория',
    describeRequest: 'Опишите ваш запрос *',
    descriptionPlaceholder: 'Подробно опишите проблему или запрос...',
    photoOptional: 'Фото (необязательно)',
    addPhoto: 'Добавить',
    urgency: 'Срочность',
    canWait: 'Может подождать',
    normal: 'Обычный',
    urgent: 'Срочно',
    yourInfo: 'Ваши данные (необязательно)',
    yourName: 'Ваше имя',
    phoneNumber: 'Номер телефона',
    sendRequest: 'Отправить запрос',
    requestSent: 'Запрос отправлен!',
    staffWillHandle: 'Наш персонал позаботится о вашем запросе в кратчайшие сроки.',
    viewMyRequests: 'Мои запросы',
    sendNewRequest: 'Новый запрос',
    myRequests: 'Мои запросы',
    backToList: 'Назад к списку',
    messages: 'Сообщения',
    noRequests: 'Нет отправленных запросов',
    viewAll: 'Посмотреть все запросы',
    viewAllCount: 'Посмотреть все ({count}) запросов',
    previousRequests: 'Ваши предыдущие запросы',
    checkingQR: 'Проверка QR-кода...',
    invalidQR: 'QR-код недействителен',
    contactReception: 'Пожалуйста, обратитесь на ресепшен.',
    forwarded: 'Перенаправлено',
    housekeeping: 'Хаускипинг',
    technicalService: 'Техническая служба',
    statusNew: 'Новый', statusSeen: 'Получен', statusInProgress: 'В работе', statusCompleted: 'Завершён',
    imageTooLarge: 'Изображение слишком большое', maxImageSize: 'Максимальный размер 5 МБ',
    error: 'Ошибка', success: 'Успешно',
    selectRequestType: 'Выберите тип запроса', describeYourRequest: 'Опишите ваш запрос',
    requestSentToast: 'Ваш запрос отправлен!', errorSending: 'Ошибка при отправке',
    maintenance: 'Техническая проблема', maintenanceDesc: 'Ремонт, поломка, установка',
    housekeepingType: 'Уборка', housekeepingDesc: 'Доп. уборка, смена белья',
    amenities: 'Принадлежности', amenitiesDesc: 'Полотенца, мыло, туалетная бумага',
    restaurant: 'Ресторан', restaurantDesc: 'Бронирование, рум-сервис, блюда',
    spa: 'Спа и велнес', spaDesc: 'Массаж, сауна, бассейн, процедуры',
    rentACar: 'Аренда авто', rentACarDesc: 'Прокат автомобиля, трансфер',
    excursion: 'Экскурсии', excursionDesc: 'Экскурсии, осмотр, приключения',
    otherServices: 'Другие услуги', otherServicesDesc: 'Подарки, праздники, особые запросы',
    plumbing: 'Сантехника', electrical: 'Электрика', hvac: 'Отопление/Кондиционер', tvInternet: 'ТВ/Интернет',
    doorsWindows: 'Двери/Окна', other: 'Другое',
    bedChange: 'Смена белья', roomCleaning: 'Уборка номера', bathroomCleaning: 'Уборка ванной', vacuuming: 'Пылесос',
    towels: 'Полотенца', soapShampoo: 'Мыло/Шампунь', toiletPaper: 'Туалетная бумага', water: 'Питьевая вода', minibar: 'Минибар',
    tableReservation: 'Бронь столика', roomService: 'Рум-сервис', breakfastInRoom: 'Завтрак в номер', specialties: 'Фирменные блюда', cakeCelebration: 'Торт/Праздник',
    massage: 'Массаж', sauna: 'Сауна', pool: 'Бассейн', facialTreatment: 'Уход за лицом', bodyTreatment: 'Уход за телом', wellnessPackage: 'Велнес-пакет',
    carRental: 'Аренда авто', airportTransfer: 'Трансфер аэропорт', privateDriver: 'Личный водитель', dailyRental: 'Дневная аренда',
    cityTour: 'Обзорная экскурсия', boatTrip: 'Прогулка на катере', hiking: 'Пешая прогулка', wineTour: 'Винный тур', culturalTour: 'Культурный тур', adventure: 'Приключение',
    giftPackage: 'Подарочный набор', roomDecoration: 'Украшение номера', birthdayCelebration: 'День рождения', flowerBouquet: 'Букет цветов',
  },
  it: {
    guestService: 'Servizio ospiti',
    room: 'Camera', floor: 'Piano',
    reportProblem: 'Segnala un problema',
    hotelServices: 'Servizi dell\'hotel',
    footer: 'Grazie per aver utilizzato il nostro servizio. Il personale sarà avvisato immediatamente.',
    category: 'Categoria',
    describeRequest: 'Descrivi la tua richiesta *',
    descriptionPlaceholder: 'Descrivi il problema o la richiesta in dettaglio...',
    photoOptional: 'Foto (facoltativa)', addPhoto: 'Aggiungi',
    urgency: 'Urgenza', canWait: 'Può aspettare', normal: 'Normale', urgent: 'Urgente',
    yourInfo: 'I tuoi dati (facoltativo)', yourName: 'Il tuo nome', phoneNumber: 'Numero di telefono',
    sendRequest: 'Invia richiesta',
    requestSent: 'Richiesta inviata!',
    staffWillHandle: 'Il nostro staff si occuperà della tua richiesta il prima possibile.',
    viewMyRequests: 'Le mie richieste', sendNewRequest: 'Nuova richiesta',
    myRequests: 'Le mie richieste', backToList: 'Torna alla lista', messages: 'Messaggi',
    noRequests: 'Nessuna richiesta inviata', viewAll: 'Vedi tutte le richieste', viewAllCount: 'Vedi tutte le ({count}) richieste',
    previousRequests: 'Le tue richieste precedenti',
    checkingQR: 'Verifica QR code...', invalidQR: 'QR code non valido',
    contactReception: 'Contatta la reception per assistenza.',
    forwarded: 'Inoltrato', housekeeping: 'Pulizie', technicalService: 'Servizio tecnico',
    statusNew: 'Nuovo', statusSeen: 'Ricevuto', statusInProgress: 'In corso', statusCompleted: 'Completato',
    imageTooLarge: 'Immagine troppo grande', maxImageSize: 'Dimensione massima 5MB',
    error: 'Errore', success: 'Successo',
    selectRequestType: 'Seleziona il tipo', describeYourRequest: 'Descrivi la richiesta',
    requestSentToast: 'Richiesta inviata!', errorSending: 'Errore durante l\'invio',
    maintenance: 'Problema tecnico', maintenanceDesc: 'Riparazione, guasto, installazione',
    housekeepingType: 'Pulizia', housekeepingDesc: 'Pulizia extra, cambio biancheria',
    amenities: 'Forniture', amenitiesDesc: 'Asciugamani, sapone, carta igienica',
    restaurant: 'Ristorante', restaurantDesc: 'Prenotazione, room service, specialità',
    spa: 'Spa & Benessere', spaDesc: 'Massaggio, sauna, piscina, trattamenti',
    rentACar: 'Noleggio auto', rentACarDesc: 'Noleggio veicolo, transfer',
    excursion: 'Escursioni & Tour', excursionDesc: 'Escursioni, visite, avventure',
    otherServices: 'Altri servizi', otherServicesDesc: 'Pacchetti regalo, feste, richieste speciali',
    plumbing: 'Idraulica', electrical: 'Elettricità', hvac: 'Riscaldamento/Clima', tvInternet: 'TV/Internet',
    doorsWindows: 'Porte/Finestre', other: 'Altro',
    bedChange: 'Cambio biancheria', roomCleaning: 'Pulizia camera', bathroomCleaning: 'Pulizia bagno', vacuuming: 'Aspirapolvere',
    towels: 'Asciugamani', soapShampoo: 'Sapone/Shampoo', toiletPaper: 'Carta igienica', water: 'Acqua potabile', minibar: 'Minibar',
    tableReservation: 'Prenotazione tavolo', roomService: 'Room Service', breakfastInRoom: 'Colazione in camera', specialties: 'Specialità', cakeCelebration: 'Torta/Festa',
    massage: 'Massaggio', sauna: 'Sauna', pool: 'Piscina', facialTreatment: 'Trattamento viso', bodyTreatment: 'Trattamento corpo', wellnessPackage: 'Pacchetto benessere',
    carRental: 'Noleggio auto', airportTransfer: 'Transfer aeroporto', privateDriver: 'Autista privato', dailyRental: 'Noleggio giornaliero',
    cityTour: 'Tour città', boatTrip: 'Gita in barca', hiking: 'Escursione', wineTour: 'Tour del vino', culturalTour: 'Tour culturale', adventure: 'Avventura',
    giftPackage: 'Pacco regalo', roomDecoration: 'Decorazione camera', birthdayCelebration: 'Festa di compleanno', flowerBouquet: 'Mazzo di fiori',
  },
  es: {
    guestService: 'Servicio al huésped',
    room: 'Habitación', floor: 'Planta',
    reportProblem: 'Reportar un problema',
    hotelServices: 'Servicios del hotel',
    footer: 'Gracias por usar nuestro servicio. El personal será notificado de inmediato.',
    category: 'Categoría',
    describeRequest: 'Describa su solicitud *',
    descriptionPlaceholder: 'Describa el problema o la solicitud en detalle...',
    photoOptional: 'Foto (opcional)', addPhoto: 'Añadir',
    urgency: 'Urgencia', canWait: 'Puede esperar', normal: 'Normal', urgent: 'Urgente',
    yourInfo: 'Sus datos (opcional)', yourName: 'Su nombre', phoneNumber: 'Número de teléfono',
    sendRequest: 'Enviar solicitud',
    requestSent: '¡Solicitud enviada!',
    staffWillHandle: 'Nuestro personal se encargará de su solicitud lo antes posible.',
    viewMyRequests: 'Ver mis solicitudes', sendNewRequest: 'Nueva solicitud',
    myRequests: 'Mis solicitudes', backToList: 'Volver a la lista', messages: 'Mensajes',
    noRequests: 'No hay solicitudes', viewAll: 'Ver todas las solicitudes', viewAllCount: 'Ver todas las ({count}) solicitudes',
    previousRequests: 'Sus solicitudes anteriores',
    checkingQR: 'Verificando código QR...', invalidQR: 'Código QR no válido',
    contactReception: 'Contacte a recepción para asistencia.',
    forwarded: 'Reenviado', housekeeping: 'Limpieza', technicalService: 'Servicio técnico',
    statusNew: 'Nuevo', statusSeen: 'Recibido', statusInProgress: 'En proceso', statusCompleted: 'Completado',
    imageTooLarge: 'Imagen muy grande', maxImageSize: 'Tamaño máximo 5MB',
    error: 'Error', success: 'Éxito',
    selectRequestType: 'Seleccione el tipo', describeYourRequest: 'Describa su solicitud',
    requestSentToast: '¡Su solicitud ha sido enviada!', errorSending: 'Error al enviar',
    maintenance: 'Problema técnico', maintenanceDesc: 'Reparación, avería, instalación',
    housekeepingType: 'Limpieza', housekeepingDesc: 'Limpieza extra, cambio de sábanas',
    amenities: 'Suministros', amenitiesDesc: 'Toallas, jabón, papel higiénico',
    restaurant: 'Restaurante', restaurantDesc: 'Reserva, room service, especialidades',
    spa: 'Spa & Bienestar', spaDesc: 'Masaje, sauna, piscina, tratamientos',
    rentACar: 'Alquiler de coches', rentACarDesc: 'Alquiler de vehículo, transfer',
    excursion: 'Excursiones', excursionDesc: 'Excursiones, visitas, aventuras',
    otherServices: 'Otros servicios', otherServicesDesc: 'Paquetes regalo, celebraciones, solicitudes especiales',
    plumbing: 'Fontanería', electrical: 'Electricidad', hvac: 'Calefacción/Aire', tvInternet: 'TV/Internet',
    doorsWindows: 'Puertas/Ventanas', other: 'Otro',
    bedChange: 'Cambio de sábanas', roomCleaning: 'Limpieza habitación', bathroomCleaning: 'Limpieza baño', vacuuming: 'Aspirar',
    towels: 'Toallas', soapShampoo: 'Jabón/Champú', toiletPaper: 'Papel higiénico', water: 'Agua potable', minibar: 'Minibar',
    tableReservation: 'Reserva de mesa', roomService: 'Room Service', breakfastInRoom: 'Desayuno en habitación', specialties: 'Especialidades', cakeCelebration: 'Tarta/Celebración',
    massage: 'Masaje', sauna: 'Sauna', pool: 'Piscina', facialTreatment: 'Tratamiento facial', bodyTreatment: 'Tratamiento corporal', wellnessPackage: 'Paquete bienestar',
    carRental: 'Alquiler de auto', airportTransfer: 'Transfer aeropuerto', privateDriver: 'Chófer privado', dailyRental: 'Alquiler diario',
    cityTour: 'Tour por la ciudad', boatTrip: 'Paseo en barco', hiking: 'Senderismo', wineTour: 'Ruta del vino', culturalTour: 'Tour cultural', adventure: 'Aventura',
    giftPackage: 'Paquete regalo', roomDecoration: 'Decoración habitación', birthdayCelebration: 'Celebración cumpleaños', flowerBouquet: 'Ramo de flores',
  },
  he: {
    guestService: 'שירות אורחים',
    room: 'חדר', floor: 'קומה',
    reportProblem: 'דווח על בעיה',
    hotelServices: 'שירותי המלון',
    footer: '.תודה שהשתמשתם בשירות שלנו. הצוות יעודכן מיד',
    category: 'קטגוריה',
    describeRequest: '* תאר את הבקשה שלך',
    descriptionPlaceholder: '...תאר את הבעיה או הבקשה בפירוט',
    photoOptional: '(תמונה (אופציונלי', addPhoto: 'הוסף',
    urgency: 'דחיפות', canWait: 'יכול לחכות', normal: 'רגיל', urgent: 'דחוף',
    yourInfo: '(הפרטים שלך (אופציונלי', yourName: 'השם שלך', phoneNumber: 'מספר טלפון',
    sendRequest: 'שלח בקשה',
    requestSent: '!הבקשה נשלחה',
    staffWillHandle: '.הצוות שלנו יטפל בבקשתך בהקדם האפשרי',
    viewMyRequests: 'הבקשות שלי', sendNewRequest: 'בקשה חדשה',
    myRequests: 'הבקשות שלי', backToList: 'חזרה לרשימה', messages: 'הודעות',
    noRequests: 'אין בקשות', viewAll: 'צפה בכל הבקשות', viewAllCount: 'צפה בכל ({count}) הבקשות',
    previousRequests: 'הבקשות הקודמות שלך',
    checkingQR: '...בודק קוד QR', invalidQR: 'קוד QR לא תקף',
    contactReception: '.אנא פנה לקבלה לעזרה',
    forwarded: 'הועבר', housekeeping: 'ניקיון', technicalService: 'שירות טכני',
    statusNew: 'חדש', statusSeen: 'התקבל', statusInProgress: 'בטיפול', statusCompleted: 'הושלם',
    imageTooLarge: 'תמונה גדולה מדי', maxImageSize: 'גודל מקסימלי 5MB',
    error: 'שגיאה', success: 'הצלחה',
    selectRequestType: 'בחר סוג בקשה', describeYourRequest: 'תאר את בקשתך',
    requestSentToast: '!הבקשה שלך נשלחה', errorSending: 'שגיאה בשליחה',
    maintenance: 'בעיה טכנית', maintenanceDesc: 'תיקון, תקלה, התקנה',
    housekeepingType: 'ניקיון', housekeepingDesc: 'ניקיון נוסף, החלפת מצעים',
    amenities: 'אביזרים', amenitiesDesc: 'מגבות, סבון, נייר טואלט',
    restaurant: 'מסעדה', restaurantDesc: 'הזמנת שולחן, שירות חדרים, מנות מיוחדות',
    spa: 'ספא ובריאות', spaDesc: 'עיסוי, סאונה, בריכה, טיפולים',
    rentACar: 'השכרת רכב', rentACarDesc: 'השכרת רכב, העברות',
    excursion: 'טיולים וסיורים', excursionDesc: 'טיולים, סיורים, הרפתקאות',
    otherServices: 'שירותים נוספים', otherServicesDesc: 'מתנות, חגיגות, בקשות מיוחדות',
    plumbing: 'אינסטלציה', electrical: 'חשמל', hvac: 'חימום/מיזוג', tvInternet: 'טלוויזיה/אינטרנט',
    doorsWindows: 'דלתות/חלונות', other: 'אחר',
    bedChange: 'החלפת מצעים', roomCleaning: 'ניקיון חדר', bathroomCleaning: 'ניקיון אמבטיה', vacuuming: 'שאיבה',
    towels: 'מגבות', soapShampoo: 'סבון/שמפו', toiletPaper: 'נייר טואלט', water: 'מי שתייה', minibar: 'מיניבר',
    tableReservation: 'הזמנת שולחן', roomService: 'שירות חדרים', breakfastInRoom: 'ארוחת בוקר בחדר', specialties: 'מנות מיוחדות', cakeCelebration: 'עוגה/חגיגה',
    massage: 'עיסוי', sauna: 'סאונה', pool: 'בריכה', facialTreatment: 'טיפול פנים', bodyTreatment: 'טיפול גוף', wellnessPackage: 'חבילת ספא',
    carRental: 'השכרת רכב', airportTransfer: 'העברה משדה תעופה', privateDriver: 'נהג פרטי', dailyRental: 'השכרה יומית',
    cityTour: 'סיור בעיר', boatTrip: 'שייט', hiking: 'טיול הליכה', wineTour: 'סיור יין', culturalTour: 'סיור תרבותי', adventure: 'הרפתקה',
    giftPackage: 'חבילת מתנה', roomDecoration: 'קישוט חדר', birthdayCelebration: 'חגיגת יום הולדת', flowerBouquet: 'זר פרחים',
  },
  zh: {
    guestService: '客房服务',
    room: '房间', floor: '楼层',
    reportProblem: '报告问题',
    hotelServices: '酒店服务',
    footer: '感谢您使用我们的服务。工作人员将立即收到通知。',
    category: '类别',
    describeRequest: '描述您的请求 *',
    descriptionPlaceholder: '请详细描述问题或请求...',
    photoOptional: '照片（可选）', addPhoto: '添加',
    urgency: '紧急程度', canWait: '可以等待', normal: '普通', urgent: '紧急',
    yourInfo: '您的信息（可选）', yourName: '您的姓名', phoneNumber: '电话号码',
    sendRequest: '发送请求',
    requestSent: '请求已发送！',
    staffWillHandle: '我们的工作人员将尽快处理您的请求。',
    viewMyRequests: '查看我的请求', sendNewRequest: '发送新请求',
    myRequests: '我的请求', backToList: '返回列表', messages: '消息',
    noRequests: '没有提交的请求', viewAll: '查看所有请求', viewAllCount: '查看所有 ({count}) 个请求',
    previousRequests: '您之前的请求',
    checkingQR: '正在验证二维码...', invalidQR: '二维码无效',
    contactReception: '请联系前台寻求帮助。',
    forwarded: '已转发', housekeeping: '客房清洁', technicalService: '技术服务',
    statusNew: '新的', statusSeen: '已收到', statusInProgress: '处理中', statusCompleted: '已完成',
    imageTooLarge: '图片太大', maxImageSize: '最大5MB',
    error: '错误', success: '成功',
    selectRequestType: '选择请求类型', describeYourRequest: '描述您的请求',
    requestSentToast: '您的请求已发送！', errorSending: '发送时出错',
    maintenance: '技术问题', maintenanceDesc: '维修、故障、安装',
    housekeepingType: '清洁', housekeepingDesc: '额外清洁、更换床单',
    amenities: '用品', amenitiesDesc: '毛巾、肥皂、卫生纸',
    restaurant: '餐厅', restaurantDesc: '预订、客房服务、特色菜',
    spa: '水疗与养生', spaDesc: '按摩、桑拿、泳池、护理',
    rentACar: '租车', rentACarDesc: '车辆租赁、接送',
    excursion: '旅游与观光', excursionDesc: '游览、观光、探险',
    otherServices: '其他服务', otherServicesDesc: '礼品、庆祝活动、特殊要求',
    plumbing: '水管', electrical: '电气', hvac: '暖通空调', tvInternet: '电视/网络',
    doorsWindows: '门窗', other: '其他',
    bedChange: '更换床单', roomCleaning: '房间清洁', bathroomCleaning: '浴室清洁', vacuuming: '吸尘',
    towels: '毛巾', soapShampoo: '肥皂/洗发水', toiletPaper: '卫生纸', water: '饮用水', minibar: '迷你吧',
    tableReservation: '预订餐桌', roomService: '客房服务', breakfastInRoom: '房间早餐', specialties: '特色菜', cakeCelebration: '蛋糕/庆祝',
    massage: '按摩', sauna: '桑拿', pool: '泳池', facialTreatment: '面部护理', bodyTreatment: '身体护理', wellnessPackage: '养生套餐',
    carRental: '租车', airportTransfer: '机场接送', privateDriver: '私人司机', dailyRental: '日租',
    cityTour: '城市观光', boatTrip: '乘船游览', hiking: '徒步旅行', wineTour: '葡萄酒之旅', culturalTour: '文化之旅', adventure: '冒险',
    giftPackage: '礼品套装', roomDecoration: '房间装饰', birthdayCelebration: '生日庆祝', flowerBouquet: '鲜花花束',
  },
  ar: {
    guestService: 'خدمة الضيوف',
    room: 'غرفة', floor: 'طابق',
    reportProblem: 'الإبلاغ عن مشكلة',
    hotelServices: 'خدمات الفندق',
    footer: '.شكراً لاستخدام خدمتنا. سيتم إخطار الموظفين فوراً',
    category: 'الفئة',
    describeRequest: '* صف طلبك',
    descriptionPlaceholder: '...صف المشكلة أو الطلب بالتفصيل',
    photoOptional: '(صورة (اختياري', addPhoto: 'إضافة',
    urgency: 'الأولوية', canWait: 'يمكن الانتظار', normal: 'عادي', urgent: 'عاجل',
    yourInfo: '(بياناتك (اختياري', yourName: 'اسمك', phoneNumber: 'رقم الهاتف',
    sendRequest: 'إرسال الطلب',
    requestSent: '!تم إرسال الطلب',
    staffWillHandle: '.سيتولى فريقنا طلبك في أقرب وقت ممكن',
    viewMyRequests: 'طلباتي', sendNewRequest: 'طلب جديد',
    myRequests: 'طلباتي', backToList: 'العودة للقائمة', messages: 'رسائل',
    noRequests: 'لا توجد طلبات', viewAll: 'عرض كل الطلبات', viewAllCount: 'عرض كل ({count}) طلبات',
    previousRequests: 'طلباتك السابقة',
    checkingQR: '...جاري التحقق من رمز QR', invalidQR: 'رمز QR غير صالح',
    contactReception: '.يرجى التواصل مع الاستقبال للمساعدة',
    forwarded: 'تم التحويل', housekeeping: 'التنظيف', technicalService: 'الخدمة الفنية',
    statusNew: 'جديد', statusSeen: 'تم الاستلام', statusInProgress: 'قيد المعالجة', statusCompleted: 'مكتمل',
    imageTooLarge: 'الصورة كبيرة جداً', maxImageSize: 'الحجم الأقصى 5 ميجابايت',
    error: 'خطأ', success: 'نجاح',
    selectRequestType: 'اختر نوع الطلب', describeYourRequest: 'صف طلبك',
    requestSentToast: '!تم إرسال طلبك', errorSending: 'خطأ في الإرسال',
    maintenance: 'مشكلة فنية', maintenanceDesc: 'إصلاح، عطل، تركيب',
    housekeepingType: 'تنظيف', housekeepingDesc: 'تنظيف إضافي، تغيير الملاءات',
    amenities: 'مستلزمات', amenitiesDesc: 'مناشف، صابون، ورق حمام',
    restaurant: 'مطعم', restaurantDesc: 'حجز، خدمة الغرف، أطباق خاصة',
    spa: 'سبا وعافية', spaDesc: 'تدليك، ساونا، مسبح، علاجات',
    rentACar: 'تأجير سيارات', rentACarDesc: 'تأجير سيارة، نقل',
    excursion: 'رحلات وجولات', excursionDesc: 'رحلات، مشاهدة معالم، مغامرات',
    otherServices: 'خدمات أخرى', otherServicesDesc: 'هدايا، احتفالات، طلبات خاصة',
    plumbing: 'سباكة', electrical: 'كهرباء', hvac: 'تدفئة/تكييف', tvInternet: 'تلفزيون/إنترنت',
    doorsWindows: 'أبواب/نوافذ', other: 'أخرى',
    bedChange: 'تغيير الملاءات', roomCleaning: 'تنظيف الغرفة', bathroomCleaning: 'تنظيف الحمام', vacuuming: 'كنس',
    towels: 'مناشف', soapShampoo: 'صابون/شامبو', toiletPaper: 'ورق حمام', water: 'ماء شرب', minibar: 'ميني بار',
    tableReservation: 'حجز طاولة', roomService: 'خدمة الغرف', breakfastInRoom: 'فطور في الغرفة', specialties: 'أطباق مميزة', cakeCelebration: 'كعكة/احتفال',
    massage: 'تدليك', sauna: 'ساونا', pool: 'مسبح', facialTreatment: 'علاج الوجه', bodyTreatment: 'علاج الجسم', wellnessPackage: 'باقة سبا',
    carRental: 'تأجير سيارة', airportTransfer: 'نقل المطار', privateDriver: 'سائق خاص', dailyRental: 'إيجار يومي',
    cityTour: 'جولة في المدينة', boatTrip: 'رحلة بحرية', hiking: 'مشي', wineTour: 'جولة نبيذ', culturalTour: 'جولة ثقافية', adventure: 'مغامرة',
    giftPackage: 'حزمة هدايا', roomDecoration: 'تزيين الغرفة', birthdayCelebration: 'عيد ميلاد', flowerBouquet: 'باقة زهور',
  },
  ja: {
    guestService: 'ゲストサービス',
    room: '部屋', floor: '階',
    reportProblem: '問題を報告',
    hotelServices: 'ホテルサービス',
    footer: 'ご利用ありがとうございます。スタッフにすぐ通知されます。',
    category: 'カテゴリー',
    describeRequest: 'リクエストを記入 *',
    descriptionPlaceholder: '問題やリクエストを詳しく記入してください...',
    photoOptional: '写真（任意）', addPhoto: '追加',
    urgency: '緊急度', canWait: '待てます', normal: '普通', urgent: '緊急',
    yourInfo: 'お客様情報（任意）', yourName: 'お名前', phoneNumber: '電話番号',
    sendRequest: 'リクエスト送信',
    requestSent: 'リクエスト送信完了！',
    staffWillHandle: 'スタッフが早急に対応いたします。',
    viewMyRequests: 'マイリクエスト', sendNewRequest: '新規リクエスト',
    myRequests: 'マイリクエスト', backToList: 'リストに戻る', messages: 'メッセージ',
    noRequests: 'リクエストはありません', viewAll: 'すべて見る', viewAllCount: 'すべて ({count}) 件を見る',
    previousRequests: '以前のリクエスト',
    checkingQR: 'QRコード確認中...', invalidQR: 'QRコードが無効です',
    contactReception: 'フロントにお問い合わせください。',
    forwarded: '転送済み', housekeeping: 'ハウスキーピング', technicalService: '技術サービス',
    statusNew: '新規', statusSeen: '受信済み', statusInProgress: '対応中', statusCompleted: '完了',
    imageTooLarge: '画像が大きすぎます', maxImageSize: '最大5MB',
    error: 'エラー', success: '成功',
    selectRequestType: '種類を選択', describeYourRequest: 'リクエストを記入',
    requestSentToast: 'リクエストが送信されました！', errorSending: '送信エラー',
    maintenance: '技術的な問題', maintenanceDesc: '修理、故障、設置',
    housekeepingType: '清掃', housekeepingDesc: '追加清掃、シーツ交換',
    amenities: 'アメニティ', amenitiesDesc: 'タオル、石鹸、トイレットペーパー',
    restaurant: 'レストラン', restaurantDesc: '予約、ルームサービス、特別料理',
    spa: 'スパ＆ウェルネス', spaDesc: 'マッサージ、サウナ、プール、トリートメント',
    rentACar: 'レンタカー', rentACarDesc: '車両レンタル、送迎',
    excursion: 'ツアー＆観光', excursionDesc: 'エクスカーション、観光、冒険',
    otherServices: 'その他サービス', otherServicesDesc: 'ギフト、お祝い、特別リクエスト',
    plumbing: '配管', electrical: '電気', hvac: '空調', tvInternet: 'TV/Wi-Fi',
    doorsWindows: 'ドア/窓', other: 'その他',
    bedChange: 'シーツ交換', roomCleaning: '部屋清掃', bathroomCleaning: 'バスルーム清掃', vacuuming: '掃除機',
    towels: 'タオル', soapShampoo: '石鹸/シャンプー', toiletPaper: 'トイレットペーパー', water: '飲料水', minibar: 'ミニバー',
    tableReservation: 'テーブル予約', roomService: 'ルームサービス', breakfastInRoom: '朝食サービス', specialties: '特別料理', cakeCelebration: 'ケーキ/お祝い',
    massage: 'マッサージ', sauna: 'サウナ', pool: 'プール', facialTreatment: 'フェイシャル', bodyTreatment: 'ボディケア', wellnessPackage: 'ウェルネスパッケージ',
    carRental: 'レンタカー', airportTransfer: '空港送迎', privateDriver: '専用ドライバー', dailyRental: '日貸し',
    cityTour: '市内観光', boatTrip: 'ボートツアー', hiking: 'ハイキング', wineTour: 'ワインツアー', culturalTour: '文化ツアー', adventure: 'アドベンチャー',
    giftPackage: 'ギフトパッケージ', roomDecoration: '部屋装飾', birthdayCelebration: '誕生日祝い', flowerBouquet: '花束',
  },
  tr: {
    guestService: 'Misafir Hizmetleri',
    room: 'Oda', floor: 'Kat',
    reportProblem: 'Sorun Bildir',
    hotelServices: 'Otel Hizmetleri',
    footer: 'Hizmetimizi kullandığınız için teşekkür ederiz. Personel hemen bilgilendirilecektir.',
    category: 'Kategori',
    describeRequest: 'Talebinizi açıklayın *',
    descriptionPlaceholder: 'Sorunu veya talebi ayrıntılı açıklayın...',
    photoOptional: 'Fotoğraf (isteğe bağlı)', addPhoto: 'Ekle',
    urgency: 'Aciliyet', canWait: 'Bekleyebilir', normal: 'Normal', urgent: 'Acil',
    yourInfo: 'Bilgileriniz (isteğe bağlı)', yourName: 'Adınız', phoneNumber: 'Telefon numarası',
    sendRequest: 'Talep Gönder',
    requestSent: 'Talep Gönderildi!',
    staffWillHandle: 'Personelimiz talebinizle en kısa sürede ilgilenecektir.',
    viewMyRequests: 'Taleplerim', sendNewRequest: 'Yeni Talep',
    myRequests: 'Taleplerim', backToList: 'Listeye dön', messages: 'Mesajlar',
    noRequests: 'Talep yok', viewAll: 'Tüm talepleri gör', viewAllCount: 'Tüm ({count}) talebi gör',
    previousRequests: 'Önceki talepleriniz',
    checkingQR: 'QR kod kontrol ediliyor...', invalidQR: 'QR kod geçersiz',
    contactReception: 'Lütfen resepsiyon ile iletişime geçin.',
    forwarded: 'Yönlendirildi', housekeeping: 'Kat hizmetleri', technicalService: 'Teknik servis',
    statusNew: 'Yeni', statusSeen: 'Alındı', statusInProgress: 'İşlemde', statusCompleted: 'Tamamlandı',
    imageTooLarge: 'Resim çok büyük', maxImageSize: 'Maksimum 5MB',
    error: 'Hata', success: 'Başarılı',
    selectRequestType: 'Talep türü seçin', describeYourRequest: 'Talebinizi açıklayın',
    requestSentToast: 'Talebiniz gönderildi!', errorSending: 'Gönderim hatası',
    maintenance: 'Teknik Sorun', maintenanceDesc: 'Onarım, arıza, kurulum',
    housekeepingType: 'Temizlik', housekeepingDesc: 'Ek temizlik, çarşaf değişimi',
    amenities: 'Malzemeler', amenitiesDesc: 'Havlu, sabun, tuvalet kağıdı',
    restaurant: 'Restoran', restaurantDesc: 'Rezervasyon, oda servisi, özel yemekler',
    spa: 'Spa & Sağlık', spaDesc: 'Masaj, sauna, havuz, bakımlar',
    rentACar: 'Araç Kiralama', rentACarDesc: 'Araç kiralama, transfer',
    excursion: 'Geziler & Turlar', excursionDesc: 'Geziler, turlar, maceralar',
    otherServices: 'Diğer Hizmetler', otherServicesDesc: 'Hediye paketleri, kutlamalar, özel talepler',
    plumbing: 'Tesisat', electrical: 'Elektrik', hvac: 'Isıtma/Klima', tvInternet: 'TV/İnternet',
    doorsWindows: 'Kapı/Pencere', other: 'Diğer',
    bedChange: 'Çarşaf değişimi', roomCleaning: 'Oda temizliği', bathroomCleaning: 'Banyo temizliği', vacuuming: 'Süpürme',
    towels: 'Havlular', soapShampoo: 'Sabun/Şampuan', toiletPaper: 'Tuvalet kağıdı', water: 'İçme suyu', minibar: 'Minibar',
    tableReservation: 'Masa rezervasyonu', roomService: 'Oda Servisi', breakfastInRoom: 'Odada kahvaltı', specialties: 'Özel yemekler', cakeCelebration: 'Pasta/Kutlama',
    massage: 'Masaj', sauna: 'Sauna', pool: 'Havuz', facialTreatment: 'Yüz bakımı', bodyTreatment: 'Vücut bakımı', wellnessPackage: 'Wellness paketi',
    carRental: 'Araç kiralama', airportTransfer: 'Havalimanı transferi', privateDriver: 'Özel şoför', dailyRental: 'Günlük kiralama',
    cityTour: 'Şehir turu', boatTrip: 'Tekne turu', hiking: 'Yürüyüş', wineTour: 'Şarap turu', culturalTour: 'Kültür turu', adventure: 'Macera',
    giftPackage: 'Hediye paketi', roomDecoration: 'Oda dekorasyonu', birthdayCelebration: 'Doğum günü kutlaması', flowerBouquet: 'Çiçek buketi',
  },
};

// Category translation keys mapped to original Serbian values
const categoryKeyMap: Record<string, string> = {
  'Vodoinstalacije': 'plumbing', 'Elektrika': 'electrical', 'Grijanje/Klima': 'hvac', 'TV/Internet': 'tvInternet',
  'Vrata/Prozori': 'doorsWindows', 'Ostalo': 'other',
  'Promjena posteljine': 'bedChange', 'Čišćenje sobe': 'roomCleaning', 'Čišćenje kupatila': 'bathroomCleaning', 'Usisavanje': 'vacuuming',
  'Ručnici': 'towels', 'Sapun/Šampon': 'soapShampoo', 'Toalet papir': 'toiletPaper', 'Voda za piće': 'water', 'Minibar': 'minibar',
  'Rezervacija stola': 'tableReservation', 'Room Service': 'roomService', 'Doručak u sobu': 'breakfastInRoom', 'Specijaliteti kuhinje': 'specialties', 'Torta/Proslava': 'cakeCelebration',
  'Masaža': 'massage', 'Sauna': 'sauna', 'Bazen': 'pool', 'Tretman lica': 'facialTreatment', 'Tretman tijela': 'bodyTreatment', 'Paket wellness': 'wellnessPackage',
  'Iznajmljivanje auta': 'carRental', 'Aerodromski transfer': 'airportTransfer', 'Privatni vozač': 'privateDriver', 'Dnevni najam': 'dailyRental',
  'Razgledanje grada': 'cityTour', 'Izlet brodom': 'boatTrip', 'Planinarenje': 'hiking', 'Vinski obilazak': 'wineTour', 'Kulturna tura': 'culturalTour', 'Avantura': 'adventure',
  'Poklon paket': 'giftPackage', 'Dekoracija sobe': 'roomDecoration', 'Proslava rođendana': 'birthdayCelebration', 'Buket cvijeća': 'flowerBouquet',
};

// Request type translation key mapping
const requestTypeKeyMap: Record<string, { label: string; desc: string }> = {
  maintenance: { label: 'maintenance', desc: 'maintenanceDesc' },
  housekeeping: { label: 'housekeepingType', desc: 'housekeepingDesc' },
  amenities: { label: 'amenities', desc: 'amenitiesDesc' },
  restaurant: { label: 'restaurant', desc: 'restaurantDesc' },
  spa: { label: 'spa', desc: 'spaDesc' },
  rent_a_car: { label: 'rentACar', desc: 'rentACarDesc' },
  excursion: { label: 'excursion', desc: 'excursionDesc' },
  other_services: { label: 'otherServices', desc: 'otherServicesDesc' },
};

interface RoomInfo {
  room_number: string;
  floor: number;
  category: string;
  guest_name?: string;
}

interface GuestRequest {
  id: string;
  request_type: string;
  category?: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  forwarded_to_department?: string;
}

type RequestType = 'maintenance' | 'housekeeping' | 'amenities' | 'restaurant' | 'spa' | 'rent_a_car' | 'excursion' | 'other_services';
type Priority = 'low' | 'normal' | 'urgent';

const requestTypes = [
  { id: 'maintenance', label: 'Tehnički problem', description: 'Kvar, popravka, instalacija', icon: Wrench },
  { id: 'housekeeping', label: 'Čišćenje', description: 'Dodatno čišćenje, promjena posteljine', icon: Sparkles },
  { id: 'amenities', label: 'Potrepštine', description: 'Ručnici, sapun, toalet papir', icon: Package },
  { id: 'restaurant', label: 'Restoran', description: 'Rezervacija, room service, specijaliteti', icon: UtensilsCrossed },
  { id: 'spa', label: 'Spa & Wellness', description: 'Masaža, sauna, bazen, tretmani', icon: Waves },
  { id: 'rent_a_car', label: 'Rent a Car', description: 'Iznajmljivanje vozila, transfer', icon: Car },
  { id: 'excursion', label: 'Izleti & Ture', description: 'Ekskurzije, razgledanje, avanture', icon: Compass },
  { id: 'other_services', label: 'Ostale usluge', description: 'Poklon paketi, proslava, posebni zahtjevi', icon: Gift },
];

const priorities = [
  { id: 'low', label: 'Može čekati', color: 'text-green-600' },
  { id: 'normal', label: 'Normalno', color: 'text-blue-600' },
  { id: 'urgent', label: 'Hitno', color: 'text-red-600' },
];

const categoryOptions: Record<RequestType, string[]> = {
  maintenance: ['Vodoinstalacije', 'Elektrika', 'Grijanje/Klima', 'TV/Internet', 'Vrata/Prozori', 'Ostalo'],
  housekeeping: ['Promjena posteljine', 'Čišćenje sobe', 'Čišćenje kupatila', 'Usisavanje', 'Ostalo'],
  amenities: ['Ručnici', 'Sapun/Šampon', 'Toalet papir', 'Voda za piće', 'Minibar', 'Ostalo'],
  restaurant: ['Rezervacija stola', 'Room Service', 'Doručak u sobu', 'Specijaliteti kuhinje', 'Torta/Proslava'],
  spa: ['Masaža', 'Sauna', 'Bazen', 'Tretman lica', 'Tretman tijela', 'Paket wellness'],
  rent_a_car: ['Iznajmljivanje auta', 'Aerodromski transfer', 'Privatni vozač', 'Dnevni najam'],
  excursion: ['Razgledanje grada', 'Izlet brodom', 'Planinarenje', 'Vinski obilazak', 'Kulturna tura', 'Avantura'],
  other_services: ['Poklon paket', 'Dekoracija sobe', 'Proslava rođendana', 'Buket cvijeća', 'Ostalo'],
};

export default function GuestRequestPage() {
  const params = useParams<{ roomNumber: string; token: string }>();
  const { roomNumber, token } = params;
  const { toast } = useToast();

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'submitted' | 'viewRequests'>('loading');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<GuestRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<GuestRequest | null>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Form state
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [photos, setPhotos] = useState<{ id: string; dataUrl: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<Lang>('sr');
  const [showLangPicker, setShowLangPicker] = useState(false);

  const t = (key: string) => translations[lang]?.[key] || translations.sr[key] || key;
  const tCat = (srValue: string) => {
    const key = categoryKeyMap[srValue];
    return key ? t(key) : srValue;
  };

  // Function to fetch guest requests
  const fetchMyRequests = async (showLoading = true) => {
    if (showLoading) setIsLoadingRequests(true);
    try {
      const response = await fetch(`/api/public/room/${roomNumber}/${token}/requests`);
      if (response.ok) {
        const data = await response.json();
        setMyRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      if (showLoading) setIsLoadingRequests(false);
    }
  };

  // Validate token on mount and fetch existing requests
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/public/room/${roomNumber}/${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setRoomInfo(data.room);
          setGuestName(data.room.guest_name || '');
          setStatus('valid');

          // Fetch existing requests in the background (without loading indicator)
          fetchMyRequests(false);
        } else {
          setStatus('invalid');
          setErrorMessage(data.error || 'QR kod nije validan.');
        }
      } catch (error) {
        setStatus('invalid');
        setErrorMessage('Greška pri provjeri QR koda.');
      }
    };

    if (roomNumber && token) {
      validateToken();
    } else {
      setStatus('invalid');
      setErrorMessage('Nedostaje broj sobe ili token.');
    }
  }, [roomNumber, token]);


  const handleSubmit = async () => {
    if (!requestType) {
      toast({ title: t('error'), description: t('selectRequestType'), variant: 'destructive' });
      return;
    }
    if (!description.trim()) {
      toast({ title: t('error'), description: t('describeYourRequest'), variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/public/room/${roomNumber}/${token}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: requestType,
          category,
          description,
          guest_name: guestName,
          guest_phone: guestPhone,
          priority,
          images: photos.map(p => p.dataUrl),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('submitted');
        toast({ title: t('success'), description: t('requestSentToast') });
      } else {
        toast({ title: t('error'), description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: t('error'), description: t('errorSending'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRequestType(null);
    setCategory('');
    setDescription('');
    setPriority('normal');
    setPhotos([]);
    setShowRequestDialog(false);
    setStatus('valid');
    // Refresh requests when returning to form
    fetchMyRequests(false);
  };

  const openRequestDialog = (type: RequestType) => {
    setRequestType(type);
    setCategory('');
    setDescription('');
    setPriority('normal');
    setPhotos([]);
    setShowRequestDialog(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: t('imageTooLarge'), description: t('maxImageSize'), variant: 'destructive' });
        continue;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPhotos(prev => [...prev, { id: `photo-${Date.now()}-${i}`, dataUrl }]);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const viewMyRequests = () => {
    fetchMyRequests();
    setStatus('viewRequests');
    setSelectedRequest(null);
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'new': return t('statusNew');
      case 'seen': return t('statusSeen');
      case 'in_progress': return t('statusInProgress');
      case 'completed': return t('statusCompleted');
      default: return s;
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'new': return 'destructive';
      case 'seen': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const mapping = requestTypeKeyMap[type];
    return mapping ? t(mapping.label) : type;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <Card className="p-8 text-center max-w-sm w-full">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-muted-foreground">{t('checkingQR')}</p>
        </Card>
      </div>
    );
  }

  // Invalid token state
  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
        <Card className="p-8 text-center max-w-sm w-full">
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold mb-2">{t('invalidQR')}</h1>
          <p className="text-muted-foreground mb-4">{errorMessage}</p>
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {t('contactReception')}
          </div>
        </Card>
      </div>
    );
  }

  // Submitted state
  if (status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
        <Card className="p-8 text-center max-w-sm w-full">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-xl font-bold mb-2">{t('requestSent')}</h1>
          <p className="text-muted-foreground mb-4">
            {t('staffWillHandle')}
          </p>
          <div className="space-y-2">
            <Button onClick={viewMyRequests} className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              {t('viewMyRequests')}
            </Button>
            <Button onClick={resetForm} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {t('sendNewRequest')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // View my requests state
  if (status === 'viewRequests') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 overflow-y-auto">
        <div className="max-w-lg mx-auto pb-8">
          {/* Header */}
          <div className="text-center mb-6">
            <Hotel className="w-10 h-10 mx-auto text-blue-600 mb-2" />
            <h1 className="text-xl font-bold">{t('myRequests')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('room')} {roomInfo?.room_number}
            </p>
          </div>

          {selectedRequest ? (
            // Selected request detail with chat
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRequest(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t('backToList')}
              </Button>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline">
                    {getRequestTypeLabel(selectedRequest.request_type)}
                  </Badge>
                  <Badge variant={getStatusColor(selectedRequest.status) as any}>
                    {getStatusLabel(selectedRequest.status)}
                  </Badge>
                </div>
                <p className="text-sm mb-2">{selectedRequest.description}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(selectedRequest.created_at)}
                </p>
                {selectedRequest.forwarded_to_department && (
                  <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                    <Forward className="w-3 h-3" />
                    {t('forwarded')}: {selectedRequest.forwarded_to_department === 'housekeeping' ? t('housekeeping') : t('technicalService')}
                  </div>
                )}
              </Card>

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {t('messages')}
                </h3>
                <GuestRequestChat
                  requestId={selectedRequest.id}
                  isStaff={false}
                  sessionToken={token}
                  roomNumber={roomNumber}
                />
              </div>
            </div>
          ) : (
            // Request list
            <>
              {isLoadingRequests ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                </div>
              ) : myRequests.length === 0 ? (
                <Card className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-muted-foreground">{t('noRequests')}</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((req) => (
                    <Card
                      key={req.id}
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedRequest(req)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          {getRequestTypeLabel(req.request_type)}
                        </Badge>
                        <Badge variant={getStatusColor(req.status) as any}>
                          {getStatusLabel(req.status)}
                        </Badge>
                      </div>
                      <p className="text-sm line-clamp-2">{req.description}</p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(req.created_at)}
                      </p>
                    </Card>
                  ))}
                </div>
              )}

              <Button onClick={resetForm} className="w-full mt-4">
                <Plus className="w-4 h-4 mr-2" />
                {t('sendNewRequest')}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Valid token - show form
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 overflow-y-auto">
      <div className="max-w-lg mx-auto pb-8">
        {/* Language Picker */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white shadow-sm hover:bg-gray-50 text-sm transition-all"
          >
            <span className="text-base">{languages.find(l => l.id === lang)?.flag}</span>
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        {showLangPicker && (
          <Card className="p-3 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-4 gap-1.5">
              {languages.map((l) => (
                <button
                  key={l.id}
                  onClick={() => { setLang(l.id); setShowLangPicker(false); }}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all text-center ${
                    lang === l.id ? 'bg-blue-100 border-2 border-blue-400' : 'hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <span className="text-xl">{l.flag}</span>
                  <span className="text-[10px] font-medium leading-tight">{l.label}</span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <Hotel className="w-12 h-12 mx-auto text-blue-600 mb-2" />
          <h1 className="text-2xl font-bold">{t('guestService')}</h1>
          <p className="text-muted-foreground">
            {t('room')} {roomInfo?.room_number} • {t('floor')} {roomInfo?.floor}
          </p>
        </div>

        {/* Previous Requests Section - Show if guest has any requests */}
        {myRequests.length > 0 && (
          <Card className="p-4 mb-4 border-blue-200 bg-blue-50/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span className="font-medium">{t('previousRequests')}</span>
              </div>
              <Badge variant="secondary">{myRequests.length}</Badge>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {myRequests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setSelectedRequest(req);
                    setStatus('viewRequests');
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{getRequestTypeLabel(req.request_type)}</span>
                    <Badge variant={getStatusColor(req.status) as any} className="text-xs">
                      {getStatusLabel(req.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{req.description}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(req.created_at)}
                  </p>
                </div>
              ))}
            </div>
            {myRequests.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-blue-600"
                onClick={viewMyRequests}
              >
                {t('viewAllCount').replace('{count}', String(myRequests.length))}
              </Button>
            )}
            {myRequests.length <= 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-blue-600"
                onClick={viewMyRequests}
              >
                {t('viewAll')}
              </Button>
            )}
          </Card>
        )}

        {/* Request Type Selection - Problems */}
        <Card className="p-4 mb-4">
          <Label className="text-sm font-medium mb-3 block">{t('reportProblem')}</Label>
          <div className="grid grid-cols-3 gap-2">
            {requestTypes.slice(0, 3).map((type) => {
              const Icon = type.icon;
              const keys = requestTypeKeyMap[type.id];
              return (
                <button
                  key={type.id}
                  type="button"
                  className="p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-left transition-all active:scale-95"
                  onClick={() => openRequestDialog(type.id as RequestType)}
                >
                  <Icon className="w-5 h-5 mb-1 text-gray-500" />
                  <p className="font-medium text-sm">{keys ? t(keys.label) : type.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{keys ? t(keys.desc) : type.description}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Hotel Services - revenue generating */}
        <Card className="p-4 mb-4 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
          <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
            <Gift className="w-4 h-4 text-emerald-600" />
            {t('hotelServices')}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {requestTypes.slice(3).map((type) => {
              const Icon = type.icon;
              const keys = requestTypeKeyMap[type.id];
              return (
                <button
                  key={type.id}
                  type="button"
                  className="p-3 rounded-lg border-2 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50 bg-white text-left transition-all active:scale-95"
                  onClick={() => openRequestDialog(type.id as RequestType)}
                >
                  <Icon className="w-5 h-5 mb-1 text-emerald-500" />
                  <p className="font-medium text-sm">{keys ? t(keys.label) : type.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{keys ? t(keys.desc) : type.description}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-2 pb-safe">
          {t('footer')}
        </p>

        {/* Hidden file input for photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Request Dialog - opens when guest clicks a type */}
        <Dialog open={showRequestDialog} onOpenChange={(open) => { if (!open) setShowRequestDialog(false); }}>
          <DialogContent className="max-w-md w-[95vw] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {requestType && (() => {
                  const typeInfo = requestTypes.find(rt => rt.id === requestType);
                  if (!typeInfo) return null;
                  const Icon = typeInfo.icon;
                  const keys = requestTypeKeyMap[requestType];
                  return (
                    <>
                      <Icon className="w-5 h-5" />
                      {keys ? t(keys.label) : typeInfo.label}
                    </>
                  );
                })()}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Category chips */}
              {requestType && categoryOptions[requestType].length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">{t('category')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions[requestType].map((cat) => (
                      <Button
                        key={cat}
                        type="button"
                        variant={category === cat ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCategory(cat === category ? '' : cat)}
                      >
                        {tCat(cat)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <Label htmlFor="dialog-description" className="text-sm font-medium mb-2 block">
                  {t('describeRequest')}
                </Label>
                <Textarea
                  id="dialog-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  rows={3}
                  autoFocus
                />
              </div>

              {/* Photo Upload */}
              <div>
                <Label className="text-sm font-medium mb-2 block">{t('photoOptional')}</Label>
                <div className="flex flex-wrap gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"
                        onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 3 && (
                    <button
                      type="button"
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-[10px] mt-0.5">{t('addPhoto')}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div>
                <Label className="text-sm font-medium mb-2 block">{t('urgency')}</Label>
                <RadioGroup value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <div className="flex gap-4">
                    {priorities.map((p) => {
                      const pLabel = p.id === 'low' ? t('canWait') : p.id === 'normal' ? t('normal') : t('urgent');
                      return (
                        <div key={p.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={p.id} id={`dialog-${p.id}`} />
                          <Label htmlFor={`dialog-${p.id}`} className={`cursor-pointer ${p.color}`}>
                            {pLabel}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>

              {/* Contact Info */}
              <div>
                <Label className="text-sm font-medium mb-2 block">{t('yourInfo')}</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      placeholder={t('yourName')}
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      placeholder={t('phoneNumber')}
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <Button
                onClick={async () => {
                  await handleSubmit();
                  setShowRequestDialog(false);
                }}
                disabled={isSubmitting || !description.trim()}
                className="w-full h-11"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                {t('sendRequest')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* CSS for mobile scrolling and safe areas */}
      <style>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 16px);
        }
      `}</style>
    </div>
  );
}

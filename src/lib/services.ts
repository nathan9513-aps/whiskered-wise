export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  icon: string;
}

export const services: Service[] = [
  {
    id: "taglio",
    name: "Taglio Capelli",
    description: "Taglio classico o moderno con lavaggio e styling",
    duration: 30,
    price: 18,
    icon: "✂️",
  },
  {
    id: "barba",
    name: "Barba",
    description: "Rasatura e modellamento barba con asciugamano caldo",
    duration: 20,
    price: 12,
    icon: "🪒",
  },
  {
    id: "taglio-barba",
    name: "Taglio + Barba",
    description: "Pacchetto completo taglio capelli e cura della barba",
    duration: 45,
    price: 25,
    icon: "💈",
  },
  {
    id: "trattamento",
    name: "Trattamento Capelli",
    description: "Trattamento rigenerante con prodotti professionali",
    duration: 40,
    price: 20,
    icon: "🧴",
  },
  {
    id: "colorazione",
    name: "Colorazione",
    description: "Colorazione professionale o copertura capelli bianchi",
    duration: 60,
    price: 30,
    icon: "🎨",
  },
  {
    id: "bambino",
    name: "Taglio Bambino",
    description: "Taglio dedicato per bambini fino a 12 anni",
    duration: 20,
    price: 12,
    icon: "👦",
  },
];

export const timeSlots = [
  "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
];

export const shopInfo = {
  name: "Barbiere Shop Marrakech",
  address: "Via S. Romano, 93, 44121 Ferrara FE, Italia",
  phone: "+39 0532 472724",
  rating: 4.8,
  hours: {
    lunedi: "8:30 – 20:00",
    martedi: "8:30 – 20:00",
    mercoledi: "8:30 – 20:00",
    giovedi: "8:30 – 20:00",
    venerdi: "8:30 – 20:00",
    sabato: "8:30 – 20:00",
    domenica: "Chiuso",
  },
};

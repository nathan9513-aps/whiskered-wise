import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  DollarSign,
  Users,
  QrCode,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  Trash2,
  Edit3,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import AdminLogin from "@/components/AdminLogin";
import { isAdminAuthenticated, logoutAdmin } from "@/lib/admin";
import { getBookings, deleteBooking, Booking, getUpcomingBookings, getTodayBookings } from "@/lib/bookings";
import { getServices, addService, deleteService, defaultServices, Service } from "@/lib/services";
import { getOperators, addOperator, deleteOperator, Operator } from "@/lib/operators";
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  getWhatsAppStatus,
  connectWhatsApp,
  disconnectWhatsApp,
  confirmWhatsAppConnection,
  fetchWhatsAppStatus,
  WhatsAppConfig,
  WhatsAppStatus,
} from "@/lib/whatsapp";
import {
  getGoogleConfig,
  saveGoogleConfig,
  isGoogleConnected,
  getGoogleAuthUrl,
  handleGoogleCallback,
  disconnectGoogle,
  GoogleConfig,
} from "@/lib/googleCalendar";
import { toast } from "sonner";

const SERVICES_KEY = "whiskered_services";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Services state
  const [services, setServices] = useState<Service[]>(getServices());
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  // New Service state
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDescription, setNewServiceDescription] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState<number>(30);
  const [newServicePrice, setNewServicePrice] = useState<number>(20);
  const [newServiceIcon, setNewServiceIcon] = useState("✂️");

  // Operators state
  const [operators, setOperators] = useState<Operator[]>(getOperators());
  const [newOperatorName, setNewOperatorName] = useState("");
  const [newOperatorAvatar, setNewOperatorAvatar] = useState("👨🏻");

  // WhatsApp state
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>(getWhatsAppConfig());
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>(getWhatsAppStatus());
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false);

  // Google state
  const [googleConfig, setGoogleConfig] = useState<GoogleConfig>(getGoogleConfig());
  const [isGoogleAuth, setIsGoogleAuth] = useState(isGoogleConnected());

  useEffect(() => {
    setIsAuthenticated(isAdminAuthenticated());
    loadBookings();
    
    // Check for Google OAuth callback
    if (window.location.hash.includes("access_token") && window.location.hash.includes("state=google_auth")) {
      if (handleGoogleCallback(window.location.hash)) {
        toast.success("Connesso a Google Calendar!");
        setIsGoogleAuth(true);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (whatsappConfig.enabled) {
      // Fetch initial status from backend
      fetchWhatsAppStatus().then(status => setWhatsappStatus(status));

      // Poll for status updates (QR code refresh, connection status change)
      interval = setInterval(async () => {
        const status = await fetchWhatsAppStatus();
        setWhatsappStatus(status);

        // Se troviamo il qrCode, togliamo il loading "Connessione..."
        if (status.qrCode && isConnectingWhatsApp) {
          setIsConnectingWhatsApp(false);
        }

        if (status.connected && isConnectingWhatsApp) {
          setIsConnectingWhatsApp(false);
          toast.success("WhatsApp connesso!");
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [whatsappConfig.enabled, isConnectingWhatsApp]);

  const loadBookings = () => {
    setBookings(getBookings());
  };

  const handleLogout = () => {
    logoutAdmin();
    setIsAuthenticated(false);
    toast.success("Logout effettuato");
  };

  // Services management
  const handleEditService = (service: Service) => {
    setEditingService(service.id);
    setEditPrice(service.price);
  };

  const handleSaveService = (serviceId: string) => {
    const updatedServices = services.map(s =>
      s.id === serviceId ? { ...s, price: editPrice } : s
    );
    setServices(updatedServices);
    localStorage.setItem(SERVICES_KEY, JSON.stringify(updatedServices));
    setEditingService(null);
    toast.success("Prezzo aggiornato!");
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServiceDescription) {
      toast.error("Compila tutti i campi obbligatori per il servizio.");
      return;
    }
    const newService = addService({
      name: newServiceName,
      description: newServiceDescription,
      duration: newServiceDuration,
      price: newServicePrice,
      icon: newServiceIcon,
    });
    setServices([...services, newService]);
    setNewServiceName("");
    setNewServiceDescription("");
    setNewServiceDuration(30);
    setNewServicePrice(20);
    setNewServiceIcon("✂️");
    toast.success("Servizio aggiunto!");
  };

  const handleDeleteService = (id: string) => {
    deleteService(id);
    setServices(services.filter(s => s.id !== id));
    toast.success("Servizio eliminato!");
  };

  const handleAddOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOperatorName) {
      toast.error("Inserisci il nome dell'operatore.");
      return;
    }
    const newOperator = addOperator({
      name: newOperatorName,
      avatar: newOperatorAvatar,
    });
    setOperators([...operators, newOperator]);
    setNewOperatorName("");
    setNewOperatorAvatar("👨🏻");
    toast.success("Operatore aggiunto!");
  };

  const handleDeleteOperator = (id: string) => {
    deleteOperator(id);
    setOperators(operators.filter(op => op.id !== id));
    toast.success("Operatore eliminato!");
  };

  // WhatsApp management
  const handleToggleWhatsApp = (enabled: boolean) => {
    const newConfig = { ...whatsappConfig, enabled };
    setWhatsappConfig(newConfig);
    saveWhatsAppConfig(newConfig);
    toast.success(enabled ? "Notifiche WhatsApp attivate" : "Notifiche WhatsApp disattivate");
  };

  const handleUpdateNotificationNumber = (number: string) => {
    const newConfig = { ...whatsappConfig, notificationNumber: number };
    setWhatsappConfig(newConfig);
    saveWhatsAppConfig(newConfig);
  };

  const handleConnectWhatsApp = async () => {
    setIsConnectingWhatsApp(true);
    const result = await connectWhatsApp();
    if (result.success && result.qrCode) {
      setWhatsappStatus({ connected: false, qrCode: result.qrCode });
      toast.success("QR Code generato! Attendi lo stato...");
    } else if (result.success) {
      // Potrebbe essere già in corso l'inizializzazione
      toast.success("Inizializzazione WhatsApp in corso...");
    } else {
      toast.error("Errore nella connessione WhatsApp");
      setIsConnectingWhatsApp(false);
    }
  };

  const handleConfirmWhatsAppConnection = () => {
    confirmWhatsAppConnection();
    setWhatsappStatus({ connected: true, qrCode: null });
    setIsConnectingWhatsApp(false);
    toast.success("WhatsApp connesso (manuale)!");
  };

  const handleDisconnectWhatsApp = async () => {
    await disconnectWhatsApp();
    setWhatsappStatus({ connected: false, qrCode: null });
    toast.success("WhatsApp disconnesso");
  };

  // Google Calendar management
  const handleConnectGoogle = () => {
    if (!googleConfig.clientId) {
      toast.error("Inserisci prima il Client ID Google");
      return;
    }
    const authUrl = getGoogleAuthUrl();
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  const handleDisconnectGoogle = () => {
    disconnectGoogle();
    setIsGoogleAuth(false);
    toast.success("Disconnesso da Google Calendar");
  };

  const handleSaveGoogleConfig = () => {
    saveGoogleConfig(googleConfig);
    toast.success("Configurazione Google salvata");
  };

  const handleDeleteBooking = (id: string) => {
    deleteBooking(id);
    loadBookings();
    toast.success("Prenotazione eliminata");
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  const todayBookings = getTodayBookings();
  const upcomingBookings = getUpcomingBookings();
  const totalRevenue = bookings.reduce((sum, b) => sum + b.service.price, 0);

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💈</span>
            <h1 className="font-display text-xl font-bold text-foreground">
              Pannello Admin
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-primary/30 text-primary hover:bg-primary/10">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 max-w-4xl mx-auto bg-card border border-border">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              Prenotazioni
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="w-4 h-4 mr-2" />
              Servizi
            </TabsTrigger>
            <TabsTrigger value="operators" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              Operatori
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4 mr-2" />
              Impostazioni
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Totale Prenotazioni</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{bookings.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Oggi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{todayBookings.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Prossime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{upcomingBookings.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Incasso Totale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">€{totalRevenue}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Prossime Prenotazioni
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nessuna prenotazione in arrivo</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{booking.service.icon}</span>
                          <div>
                            <p className="font-semibold text-foreground">{booking.service.name}</p>
                            <p className="text-sm text-muted-foreground">{booking.name} — {booking.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">{booking.date}</p>
                          <p className="text-sm text-muted-foreground">{booking.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Tutte le Prenotazioni
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nessuna prenotazione trovata</p>
                ) : (
                  <div className="space-y-3">
                    {[...bookings].reverse().map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{booking.service.icon}</span>
                          <div>
                            <p className="font-semibold text-foreground">{booking.service.name}</p>
                            {booking.operatorName && (
                              <p className="text-xs font-medium text-primary mb-1">
                                Operatore: {booking.operatorName}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {booking.name} — {booking.phone}
                            </p>
                            {booking.email && (
                              <p className="text-xs text-muted-foreground">{booking.email}</p>
                            )}
                            {booking.notes && (
                              <p className="text-xs text-muted-foreground italic mt-1">"{booking.notes}"</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="font-semibold text-primary">{booking.date}</p>
                            <p className="text-sm text-muted-foreground">{booking.time}</p>
                            <p className="text-sm font-semibold">€{booking.service.price}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Gestione Servizi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/20 rounded-lg border border-border">
                  <div className="md:col-span-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground">Aggiungi Nuovo Servizio</h3>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                    <Input
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="Es. Taglio Sfumato"
                      className="bg-card"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Icona</label>
                    <select
                      value={newServiceIcon}
                      onChange={(e) => setNewServiceIcon(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {["✂️", "🪒", "💈", "🧴", "🎨", "👦", "💇‍♂️", "💆‍♂️", "🌟"].map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Descrizione</label>
                    <Input
                      value={newServiceDescription}
                      onChange={(e) => setNewServiceDescription(e.target.value)}
                      placeholder="Breve descrizione..."
                      className="bg-card"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Durata (min)</label>
                    <Input
                      type="number"
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                      className="bg-card"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Prezzo (€)</label>
                    <Input
                      type="number"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(Number(e.target.value))}
                      className="bg-card"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 mt-2">
                    <Button type="submit" className="w-full">Aggiungi Servizio</Button>
                  </div>
                </form>

                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{service.icon}</span>
                        <div>
                          <p className="font-semibold text-foreground">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.duration} minuti</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {editingService === service.id ? (
                          <>
                            <Input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-24 bg-card border-border"
                            />
                            <Button
                              size="icon"
                              onClick={() => handleSaveService(service.id)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingService(null)}
                              className="text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-xl font-bold text-primary">€{service.price}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditService(service)}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteService(service.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operators Tab */}
          <TabsContent value="operators" className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Gestione Operatori
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <form onSubmit={handleAddOperator} className="flex flex-col md:flex-row gap-4 p-4 bg-secondary/20 rounded-lg border border-border items-end">
                  <div className="flex-1 w-full">
                    <label className="text-xs text-muted-foreground mb-1 block">Nome Operatore</label>
                    <Input
                      value={newOperatorName}
                      onChange={(e) => setNewOperatorName(e.target.value)}
                      placeholder="Nome"
                      className="bg-card"
                      required
                    />
                  </div>
                  <div className="w-full md:w-32">
                    <label className="text-xs text-muted-foreground mb-1 block">Avatar</label>
                    <select
                      value={newOperatorAvatar}
                      onChange={(e) => setNewOperatorAvatar(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {["👨🏻", "🧔🏽‍♂️", "👨🏽‍🦱", "👩🏻", "🧔🏻‍♂️", "🧑🏼"].map(avatar => (
                        <option key={avatar} value={avatar}>{avatar}</option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" className="w-full md:w-auto">Aggiungi</Button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {operators.map((operator) => (
                    <div key={operator.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{operator.avatar}</span>
                        <p className="font-semibold text-foreground text-lg">{operator.name}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteOperator(operator.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                  {operators.length === 0 && (
                    <p className="text-muted-foreground text-center py-4 col-span-2">Nessun operatore configurato.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* WhatsApp Settings */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  WhatsApp Web JS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Notifiche WhatsApp</p>
                    <p className="text-sm text-muted-foreground">Invia notifica per ogni nuova prenotazione</p>
                  </div>
                  <Switch
                    checked={whatsappConfig.enabled}
                    onCheckedChange={handleToggleWhatsApp}
                  />
                </div>

                {whatsappConfig.enabled && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Numero per notifiche
                      </label>
                      <Input
                        value={whatsappConfig.notificationNumber}
                        onChange={(e) => handleUpdateNotificationNumber(e.target.value)}
                        placeholder="+39..."
                        className="bg-card border-border"
                      />
                    </div>

                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">Stato Connessione</p>
                        <div className="flex items-center gap-2 mt-1">
                          {whatsappStatus.connected ? (
                            <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Connesso</Badge>
                          ) : (
                            <Badge variant="secondary"><X className="w-3 h-3 mr-1" /> Disconnesso</Badge>
                          )}
                        </div>
                      </div>
                      {whatsappStatus.connected ? (
                        <Button variant="outline" onClick={handleDisconnectWhatsApp} className="border-red-500/30 text-red-500">
                          Disconnetti
                        </Button>
                      ) : (
                        <Button onClick={handleConnectWhatsApp} disabled={isConnectingWhatsApp}>
                          {isConnectingWhatsApp ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
                          {isConnectingWhatsApp ? "Connessione..." : "Connetti"}
                        </Button>
                      )}
                    </div>

                    {whatsappStatus.qrCode && !whatsappStatus.connected && (
                      <div className="text-center p-4 bg-secondary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-4">Scansiona questo QR code con WhatsApp</p>
                        <img src={whatsappStatus.qrCode} alt="QR Code" className="mx-auto rounded-lg" />
                        <Button onClick={handleConfirmWhatsAppConnection} className="mt-4 bg-green-500 hover:bg-green-600">
                          <Check className="w-4 h-4 mr-2" />
                          Ho scansionato il QR
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Google Calendar Settings */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Google Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Sincronizzazione</p>
                    <p className="text-sm text-muted-foreground">Aggiungi automaticamente gli appuntamenti al calendario</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGoogleAuth ? (
                      <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Connesso</Badge>
                    ) : (
                      <Badge variant="secondary"><X className="w-3 h-3 mr-1" /> Non connesso</Badge>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Google Client ID
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={googleConfig.clientId}
                      onChange={(e) => setGoogleConfig({ ...googleConfig, clientId: e.target.value })}
                      placeholder="Inserisci il tuo Client ID OAuth2"
                      className="bg-card border-border"
                    />
                    <Button variant="outline" onClick={handleSaveGoogleConfig}>
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Crea un progetto su{" "}
                    <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">
                      Google Cloud Console <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                    {" "}e abilita l'API Calendar
                  </p>
                </div>

                <div className="flex gap-2">
                  {isGoogleAuth ? (
                    <Button variant="outline" onClick={handleDisconnectGoogle} className="border-red-500/30 text-red-500">
                      Disconnetti Google
                    </Button>
                  ) : (
                    <Button onClick={handleConnectGoogle} disabled={!googleConfig.clientId}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Connetti Google Calendar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;

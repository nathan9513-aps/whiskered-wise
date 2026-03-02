import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon, Check, User, Phone, Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { type Service, timeSlots } from "@/lib/services";
import { getOperators, type Operator } from "@/lib/operators";
import { addBooking, getBookingsByDate, type Booking } from "@/lib/bookings";
import { sendWhatsAppNotification, getWhatsAppConfig } from "@/lib/whatsapp";
import { createCalendarEvent, isGoogleConnected } from "@/lib/googleCalendar";
import { useEffect } from "react";

interface BookingSectionProps {
  selectedService: Service | null;
}

const BookingSection = ({ selectedService }: BookingSectionProps) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [dateBookings, setDateBookings] = useState<Booking[]>([]);

  useEffect(() => {
    getOperators().then(setOperators);
  }, []);

  // Fetch bookings when date changes
  useEffect(() => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      getBookingsByDate(formattedDate).then(setDateBookings);
    } else {
      setDateBookings([]);
    }
  }, [date]);

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSlotAvailable = (slot: string) => {
    if (!date) return true;

    // Se un operatore è selezionato, lo slot è non disponibile se quell'operatore ha già una prenotazione per quello slot
    if (selectedOperator) {
      const isOperatorBooked = dateBookings.some(
        b => b.time === slot && b.operatorId === selectedOperator.id
      );
      if (isOperatorBooked) return false;
    } else {
      // Se nessun operatore è selezionato ("Qualsiasi"), lo slot non è disponibile solo se tutti gli operatori sono occupati
      const bookingsForSlot = dateBookings.filter(b => b.time === slot);
      const maxCapacity = operators.length > 0 ? operators.length : 1; // Fallback se non ci sono operatori
      if (bookingsForSlot.length >= maxCapacity) return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !date || !time || !name || !phone) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    setIsSubmitting(true);

    try {
      // Format date for storage
      const formattedDate = format(date, "yyyy-MM-dd");

      // Save booking to backend
      const booking = await addBooking({
        service: selectedService,
        operatorId: selectedOperator?.id,
        operatorName: selectedOperator ? selectedOperator.name : "Qualsiasi",
        date: formattedDate,
        time,
        name,
        phone,
        email: email || undefined,
        notes: notes || undefined,
      });

      // Send WhatsApp notification if configured
      const whatsappConfig = getWhatsAppConfig();
      if (whatsappConfig.enabled && whatsappConfig.notificationNumber) {
        await sendWhatsAppNotification({
          service: selectedService,
          date: formattedDate,
          time,
          name,
          phone,
          operatorName: selectedOperator ? selectedOperator.name : "Qualsiasi",
        });
        toast.success("Notifica WhatsApp inviata!");
      }

      // Sync to Google Calendar if connected
      if (isGoogleConnected()) {
        const calendarResult = await createCalendarEvent({
          service: selectedService,
          date: formattedDate,
          time,
          name,
          phone,
          email: email || undefined,
          notes: notes || undefined,
        });

        if (calendarResult) {
          toast.success("Evento aggiunto a Google Calendar!");
        }
      }

      setSubmitted(true);
      toast.success("Prenotazione confermata! Ti contatteremo a breve.");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Si è verificato un errore. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setDate(undefined);
    setTime(undefined);
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setSelectedOperator(null);
  };

  if (submitted) {
    return (
      <section className="py-24" id="prenota">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center bg-gradient-card border border-primary/30 rounded-xl p-10 shadow-gold"
          >
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground mb-3">
              Prenotazione Confermata!
            </h3>
            <p className="text-muted-foreground mb-2">
              {selectedService?.name} — {date && format(date, "d MMMM yyyy", { locale: it })} alle {time}
            </p>
            <p className="text-muted-foreground mb-4 font-medium text-primary">
              Operatore: {selectedOperator ? selectedOperator.name : "Qualsiasi"}
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              Riceverai una conferma a breve. Grazie, {name}!
            </p>
            <Button
              variant="outline"
              onClick={resetForm}
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              Nuova Prenotazione
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-secondary/30" id="prenota">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-3 font-body">
            Prenotazione
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Scegli Data e Ora
          </h2>
          <div className="w-20 h-0.5 bg-primary mx-auto mt-4" />
        </motion.div>

        {!selectedService && (
          <p className="text-center text-muted-foreground mb-8">
            ⬆ Seleziona prima un servizio dalla sezione sopra
          </p>
        )}

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
          {selectedService && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-card border border-primary/20 rounded-lg p-4 text-center"
            >
              <span className="text-2xl mr-2">{selectedService.icon}</span>
              <span className="font-display text-lg text-foreground">{selectedService.name}</span>
              <span className="text-primary ml-2">— {selectedService.price}€</span>
            </motion.div>
          )}

          {/* Operator Selection */}
          {operators.length > 0 && (
            <div>
              <label className="text-sm text-muted-foreground mb-3 block font-body text-center">Scegli il tuo barbiere (opzionale)</label>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => setSelectedOperator(null)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-lg border transition-all duration-300 w-24",
                    selectedOperator === null
                      ? "bg-primary/10 border-primary shadow-gold"
                      : "bg-card border-border hover:border-primary/40"
                  )}
                >
                  <span className="text-2xl mb-1">🤝</span>
                  <span className="text-xs font-semibold">Qualsiasi</span>
                </button>
                {operators.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setSelectedOperator(op)}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-lg border transition-all duration-300 w-24",
                      selectedOperator?.id === op.id
                        ? "bg-primary/10 border-primary shadow-gold"
                        : "bg-card border-border hover:border-primary/40"
                    )}
                  >
                    <span className="text-2xl mb-1">{op.avatar}</span>
                    <span className="text-xs font-semibold">{op.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block font-body">Data *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-border bg-card hover:bg-secondary",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {date ? format(date, "d MMMM yyyy", { locale: it }) : "Seleziona data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date() || d.getDay() === 0}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block font-body">Ora *</label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {timeSlots.map((slot) => {
                  const available = isSlotAvailable(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={!available}
                      onClick={() => setTime(slot)}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-body transition-all",
                        time === slot
                          ? "bg-primary text-primary-foreground shadow-gold"
                          : available
                            ? "bg-card border border-border text-foreground hover:border-primary/40"
                            : "bg-secondary text-muted-foreground border-border/50 opacity-50 cursor-not-allowed line-through"
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block font-body">Nome *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Il tuo nome"
                  className="pl-10 bg-card border-border focus:border-primary"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block font-body">Telefono *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 ..."
                  className="pl-10 bg-card border-border focus:border-primary"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block font-body">Email (opzionale)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@esempio.com"
                type="email"
                className="pl-10 bg-card border-border focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block font-body">Note (opzionale)</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Richieste particolari..."
                className="pl-10 bg-card border-border focus:border-primary min-h-[80px]"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={!selectedService || !date || !time || !name || !phone || isSubmitting}
            className="w-full bg-primary text-primary-foreground hover:bg-gold-light text-lg py-6 font-body font-semibold tracking-wide shadow-gold transition-all duration-300 disabled:opacity-40"
          >
            {isSubmitting ? "Conferma in corso..." : "Conferma Prenotazione"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default BookingSection;

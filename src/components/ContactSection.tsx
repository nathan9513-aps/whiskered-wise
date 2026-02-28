import { motion } from "framer-motion";
import { MapPin, Phone, Clock } from "lucide-react";
import { shopInfo } from "@/lib/services";

const days = [
  { day: "Lunedì", hours: shopInfo.hours.lunedi },
  { day: "Martedì", hours: shopInfo.hours.martedi },
  { day: "Mercoledì", hours: shopInfo.hours.mercoledi },
  { day: "Giovedì", hours: shopInfo.hours.giovedi },
  { day: "Venerdì", hours: shopInfo.hours.venerdi },
  { day: "Sabato", hours: shopInfo.hours.sabato },
  { day: "Domenica", hours: shopInfo.hours.domenica },
];

const ContactSection = () => {
  return (
    <section className="py-24 bg-gradient-dark" id="contatti">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-3 font-body">
            Dove Siamo
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Contatti & Orari
          </h2>
          <div className="w-20 h-0.5 bg-primary mx-auto mt-4" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-display text-lg text-foreground mb-1">Indirizzo</h4>
                <p className="text-muted-foreground text-sm">{shopInfo.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-display text-lg text-foreground mb-1">Telefono</h4>
                <a href={`tel:${shopInfo.phone}`} className="text-primary hover:text-gold-light transition-colors">
                  {shopInfo.phone}
                </a>
              </div>
            </div>

            {/* Map embed */}
            <div className="rounded-lg overflow-hidden border border-border mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2834.5!2d11.618!3d44.836!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDTCsDUwJzA5LjYiTiAxMcKwMzcnMDQuOCJF!5e0!3m2!1sit!2sit!4v1"
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="Posizione Barbiere Shop Marrakech"
              />
            </div>
          </motion.div>

          {/* Hours */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-display text-lg text-foreground">Orari di Apertura</h4>
            </div>

            <div className="space-y-3">
              {days.map(({ day, hours }) => (
                <div
                  key={day}
                  className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-foreground font-body text-sm">{day}</span>
                  <span
                    className={`font-body text-sm ${
                      hours === "Chiuso" ? "text-accent" : "text-muted-foreground"
                    }`}
                  >
                    {hours}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 border-t border-border/50 pt-8 text-center">
        <p className="text-muted-foreground text-sm font-body">
          © 2026 {shopInfo.name} — Via S. Romano, 93, Ferrara
        </p>
      </div>
    </section>
  );
};

export default ContactSection;

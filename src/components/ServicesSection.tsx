import { motion } from "framer-motion";
import { Clock, Euro } from "lucide-react";
import { getServices, type Service } from "@/lib/services";
import { useEffect, useState } from "react";

interface ServicesSectionProps {
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
}

const ServicesSection = ({ selectedService, onSelectService }: ServicesSectionProps) => {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    getServices().then(setServices);
  }, []);

  return (
    <section className="py-24 bg-gradient-dark" id="servizi">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-3 font-body">
            I Nostri
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Servizi
          </h2>
          <div className="w-20 h-0.5 bg-primary mx-auto mt-4" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {services.map((service, i) => (
            <motion.button
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelectService(service)}
              className={`group text-left p-6 rounded-lg border transition-all duration-300 ${
                selectedService?.id === service.id
                  ? "bg-primary/10 border-primary shadow-gold"
                  : "bg-gradient-card border-border hover:border-primary/40"
              }`}
            >
              <span className="text-3xl mb-3 block">{service.icon}</span>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {service.name}
              </h3>
              <p className="text-muted-foreground text-sm mb-4 font-body">
                {service.description}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-primary">
                  <Euro className="w-4 h-4" />
                  {service.price}€
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {service.duration} min
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;

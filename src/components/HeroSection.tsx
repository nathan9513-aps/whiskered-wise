import { motion } from "framer-motion";
import { MapPin, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shopInfo } from "@/lib/services";
import heroImage from "@/assets/hero-barbershop.jpg";
import logoImage from "@/assets/logo.jpg";

interface HeroSectionProps {
  onBookClick: () => void;
}

const HeroSection = ({ onBookClick }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Barbiere Shop Marrakech interno"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center mb-6">
            <img
              src={logoImage}
              alt="Barbiere Shop Marrakech Logo"
              className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-primary/30 shadow-gold object-cover"
            />
          </div>
          <p className="text-primary font-body tracking-[0.3em] uppercase text-sm mb-4">
            Ferrara · Dal cuore del Marocco
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-4">
            <span className="text-gradient-gold">Barbiere Shop</span>
            <br />
            <span className="text-foreground">Marrakech</span>
          </h1>

          <div className="flex items-center justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 fill-primary text-primary"
              />
            ))}
            <span className="text-primary font-semibold ml-2">{shopInfo.rating}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-muted-foreground text-sm mb-10">
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {shopInfo.address}
            </span>
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              {shopInfo.phone}
            </span>
          </div>

          <Button
            size="lg"
            onClick={onBookClick}
            className="bg-primary text-primary-foreground hover:bg-gold-light text-lg px-10 py-6 font-body font-semibold tracking-wide shadow-gold transition-all duration-300"
          >
            Prenota Ora
          </Button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-primary rounded-full" />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;

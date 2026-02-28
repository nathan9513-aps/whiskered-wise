import { useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import BookingSection from "@/components/BookingSection";
import ContactSection from "@/components/ContactSection";
import { type Service } from "@/lib/services";

const Index = () => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const bookingRef = useRef<HTMLDivElement>(null);

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    scrollToBooking();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection onBookClick={scrollToBooking} />
      <ServicesSection selectedService={selectedService} onSelectService={handleSelectService} />
      <div ref={bookingRef}>
        <BookingSection selectedService={selectedService} />
      </div>
      <ContactSection />
    </div>
  );
};

export default Index;

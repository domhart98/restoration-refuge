
import WhatsAppWidget from "@/components/widgets/whatsapp_widget";
import BookingWidget from "@/components/widgets/mobile_booking_widget";

export default function FloatingActions() {
  return (
    <div className="fixed bottom-40 right-2 z-50 flex flex-col items-center gap-3">
      {/* Book Now */}
      <BookingWidget />

      {/* WhatsApp */}
      <WhatsAppWidget />
    </div>
  );
}

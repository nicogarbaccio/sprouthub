import Navigation from "@/components/Navigation";
import PlantCatalog from "@/components/PlantCatalog";
import Footer from "@/components/Footer";

const PlantCatalogPage = () => {
  return (
    <div className="min-h-screen bg-background font-poppins">
      <Navigation />
      <main>
        <PlantCatalog />
      </main>
      <Footer />
    </div>
  );
};

export default PlantCatalogPage;

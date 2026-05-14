import heroImg from "@/assets/hero-dmais.png";

export const Hero = () => {
  const scrollToPackages = () => {
    document.getElementById("pacotes")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full overflow-hidden bg-black">
      <img
        src={heroImg}
        alt="D+ Turismo"
        className="block h-auto w-full object-contain"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-serif text-2xl font-bold text-white drop-shadow-lg sm:text-4xl md:text-6xl lg:text-7xl">
          Sua próxima aventura começa aqui
        </h1>
        <p className="mt-2 text-sm text-white/90 drop-shadow-md sm:mt-4 sm:text-lg md:text-2xl">
          Explore com a D+ Turismo
        </p>
        <button
          onClick={scrollToPackages}
          className="mt-4 rounded-full bg-blue-900 px-5 py-2.5 text-sm font-bold text-yellow-400 shadow-xl transition-all hover:scale-105 hover:bg-blue-950 sm:mt-8 sm:px-8 sm:py-4 sm:text-lg md:text-xl"
        >
          Reserve agora
        </button>
      </div>
    </section>
  );
};

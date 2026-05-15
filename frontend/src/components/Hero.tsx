import heroImg from "@/assets/hero-dmais.png";

export const Hero = () => {
  const scrollToPackages = () => {
    document.getElementById("pacotes")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full overflow-hidden bg-black" style={{ minHeight: "420px" }}>
      {/* Imagem de fundo — cobre toda a section sem vazar */}
      <img
        src={heroImg}
        alt="D+ Turismo"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Conteúdo centralizado */}
      <div className="relative z-10 flex min-h-[420px] flex-col items-center justify-center px-4 py-20 text-center md:min-h-[520px]">
        <h1 className="font-serif text-2xl font-bold text-white drop-shadow-lg sm:text-4xl md:text-6xl lg:text-7xl">
        </h1>
        <p className="mt-3 max-w-xl text-sm text-white/90 drop-shadow-md sm:mt-5 sm:text-lg md:text-2xl">
          SUA PRÓXIMA AVENTURA COMEÇA AQUI
         EXPLORE COM A D+ TURISMO
        </p>
        <button
          onClick={scrollToPackages}
          className="mt-6 rounded-full bg-blue-900 px-6 py-3 text-sm font-bold text-yellow-400 shadow-xl transition-all hover:scale-105 hover:bg-blue-950 sm:mt-8 sm:px-8 sm:py-4 sm:text-lg"
        >
          Reserve agora
        </button>
      </div>
    </section>
  );
};

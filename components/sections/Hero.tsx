export default function Hero() {
  return (
    <section className="flex justify-center px-6 pt-8 pb-12">
      <div
        className="
          w-full
          max-w-4xl
          rounded-[36px]
          border
          border-white/50
          bg-white/80
          backdrop-blur-xl
          shadow-xl
          px-16
          py-14
        "
      >
        {/* Heading */}
        <h1 className="heading-font text-[64px] leading-[1.08] font-bold text-black">
          AI-Powered Event
          <br />
          Photography Platform
        </h1>

        {/* Subtitle */}
        <p className="body-font mt-6 text-base text-gray-500">
          Find your photos instantly . Organize events effortlessly .
          Preserve every memory.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            className="
              body-font
              px-6
              py-3
              rounded-full
              border
              border-black
              bg-transparent
              text-black
              text-sm
              font-medium
              transition-all
              duration-300
              ease-out
              hover:bg-black
              hover:text-white
              hover:shadow-lg
              hover:-translate-y-1
              active:scale-[0.98]
            "
          >
            Explore Gallery
          </button>

          <button
            className="
              body-font
              px-6
              py-3
              rounded-full
              border
              border-black
              bg-transparent
              text-black
              text-sm
              font-medium
              transition-all
              duration-300
              ease-out
              hover:bg-black
              hover:text-white
              hover:shadow-lg
              hover:-translate-y-1
              active:scale-[0.98]
            "
          >
            Event & Workshop
          </button>
        </div>
      </div>
    </section>
  );
}
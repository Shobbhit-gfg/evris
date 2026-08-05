export default function Hero() {
  return (
    <section className="flex justify-center px-6 pt-8 pb-12">
      <div
        className="
          w-full
          max-w-[905px]
          rounded-[34px]
          bg-[rgba(217,217,217,0.2)]
          shadow-[0px_20px_60px_rgba(76,23,23,0.15)]
          px-16
          py-14
        "
      >
        {/* Heading */}
        <h1 className="heading-font text-[72px] leading-[1.1] font-semibold text-[#111111] text-center">
          AI-Powered Event
          <br />
          Photography Platform
        </h1>

        {/* Subtitle */}
        <p className="body-font mt-6 text-[20px] text-[#6e6e73] text-center">
          Find your photos instantly , Organize events effortlessly , Preserve every memory.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex justify-center gap-[19px]">
          <button
            className="
              body-font
              flex
              h-[56px]
              min-w-[200px]
              items-center
              justify-center
              rounded-full
              border
              border-black
              bg-white
              px-6
              text-[20px]
              font-medium
              text-black
              transition-all
              duration-300
              ease-out
              hover:bg-black
              hover:text-white
              hover:-translate-y-1
              hover:shadow-lg
              active:scale-[0.98]
            "
          >
            Explore Gallery
          </button>

          <button
            className="
              body-font
              flex
              h-[56px]
              min-w-[200px]
              items-center
              justify-center
              rounded-full
              border
              border-black
              bg-white
              px-6
              text-[20px]
              font-medium
              text-black
              transition-all
              duration-300
              ease-out
              hover:bg-black
              hover:text-white
              hover:-translate-y-1
              hover:shadow-lg
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
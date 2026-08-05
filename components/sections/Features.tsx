import Link from "next/link";

export default function Features() {
  const features = [
    {
      title: "AI Face Search",
      description: "Upload a selfie and instantly find every event photo you're in.",
      href: "/find-me",
    },
    {
      title: "Event Management",
      description: "Organize and manage events, workshops",
      href: "/events",
    },
    {
      title: "Smart Gallery",
      description: "Store, browse and share memories from one centralized platform.",
      href: "/gallery",
    },
  ];

  return (
    <section className="px-6 pt-24 pb-20 text-center">

      {/* Heading */}
      <h2 className="heading-font text-[72px] font-semibold text-[#111111] leading-tight">
        Why EVRIS ?
      </h2>

      {/* Subtitle */}
      <p className="body-font mx-auto mt-6 max-w-[1014px] text-[32px] text-[#6e6e73]">
        Everything you need to manage and discover event memories.
      </p>

      {/* Feature Cards */}
      <div className="mx-auto mt-16 flex max-w-[1400px] flex-wrap justify-center gap-[30px]">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="block w-[411px] rounded-[20px] bg-[#d9d9d9] p-8 text-left transition-all duration-300 hover:bg-[#cfcfcf] hover:-translate-y-1 hover:shadow-lg"
          >
            <h3 className="heading-font text-[36px] font-semibold text-[#111111]">
              {feature.title}
            </h3>
            <p className="body-font mt-4 text-[22px] text-[#6e6e73]">
              {feature.description}
            </p>
          </Link>
        ))}
      </div>

    </section>
  );
}
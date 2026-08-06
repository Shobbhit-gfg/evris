import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ExploreButton from "@/components/ui/ExploreButton";
import EventStack from "@/components/ui/EventStack";

const seminars = [
  {
    title: "AECE Personal Interview",
    description:
      "The AECE Personal Interview evaluates a candidate's technical knowledge, and interpersonal skills for academics.",
    image: "/eventsection/seminar&workshop/1.jpg",
  },
  {
    title: "CS/IT Orientation",
    description:
      "The CS/IT Orientation introduces new students or employees to the Computer Science and Information Technology academic curriculum.",
    image: "/eventsection/seminar&workshop/2.jpg",
  },
  {
    title: "Resume Building Workshop",
    description:
      "The Resume Building Workshop by the Data Science (DS) Department focuses on helping students craft ATS-friendly resumes, specifically for roles in Data Science.",
    image: "/eventsection/seminar&workshop/3.jpg",
  },
  {
    title: "Nasha Mukt Yuva",
    description:
      "The Nasha Mukt Yuva for Viksit Bharat awareness programme was organized under the National Service Scheme (NSS) to promote a drug-free lifestyle.",
    image: "/eventsection/seminar&workshop/4.jpg",
  },
];

const fests = [
  {
    title: "AryabhattKaZero",
    description:
      "Team of #AryabhattKaZero at RKGIT. It was a day full of energy, excitement and Bollywood magic at RKGIT!",
    image: "/eventsection/fest&event/1.jpg",
  },
  {
    title: "Farewell 2026",
    description:
      "The Farewell 2026 at Raj Kumar Goel Institute of Technology (RKGIT), Ghaziabad celebrates the graduating batch.",
    image: "/eventsection/fest&event/2.jpg",
  },
  {
    title: "Senior Send-off Match",
    description:
      "The final whistle marked the end of a memorable journey for the seniors. This last game was filled with passion.",
    image: "/eventsection/fest&event/3.jpg",
  },
  {
    title: "TATVA 2K26",
    description:
      "TATVA 2K26 was LIT! 2-3 April vibes — epic performances, crazy energy, and memories to cherish!",
    image: "/eventsection/fest&event/4.jpg",
  },
];

export default function EventsPage() {
  return (
    <>
      <Navbar />

      <main className="pt-20">

        {/* Seminars & Workshops */}
        <section className="px-6 pb-24 pt-16">
          <div className="mx-auto max-w-[1210px]">
            <h2 className="heading-font text-[64px] font-semibold text-[#111111]">
              Seminars & Workshops
            </h2>
            <div className="mt-6 mb-14">
              <ExploreButton href="/events/seminars" />
            </div>
            <EventStack items={seminars} />
          </div>
        </section>

        {/* Fests & Concerts */}
        <section className="px-6 pb-24 pt-8">
          <div className="mx-auto max-w-[1210px]">
            <h2 className="heading-font text-[64px] font-semibold text-[#111111]">
              Fests & Concerts
            </h2>
            <div className="mt-6 mb-14">
              <ExploreButton href="/events/fests" />
            </div>
            <EventStack items={fests} />
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
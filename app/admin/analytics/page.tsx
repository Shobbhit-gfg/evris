import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdminNavbar from "@/components/layout/adminnavbar";

const statTiles = [
  { label: "Total Users", value: "8,240" },
  { label: "Active Sessions", value: "312" },
  { label: "Find me (30d)", value: "946" },
  { label: "Avg. Session Time", value: "6m 42s" },
];

const activeAnalysis = [
  { label: "Users active", value: 70, color: "#30bcc3" },
  { label: "Admin active", value: 20, color: "#1a8287" },
  { label: "Inactive", value: 10, color: "#123c3e" },
];

const faceIndexByDay = [
  { day: "S", value: 55 },
  { day: "M", value: 35 },
  { day: "T", value: 35 },
  { day: "W", value: 30 },
  { day: "T", value: 42 },
  { day: "F", value: 50 },
  { day: "S", value: 32 },
];

const recentActivity = [
  { text: `Admin uploaded 24 new photos to "CS/IT Orientation".`, time: "10 min ago" },
  { text: "AI Face Search matched 12 new faces across 3 events.", time: "48 min ago" },
  { text: "New user signup: 6 accounts created.", time: "2 hr ago" },
  { text: `"Resume Building Workshop" event details updated.`, time: "5 hr ago" },
  { text: "Monthly report generated and sent to admin team.", time: "Yesterday" },
];

type AnalysisSegment = { label: string; value: number; color: string };

function buildConicGradient(segments: AnalysisSegment[]) {
  let cursor = 0;
  const stops = segments.map((seg) => {
    const start = cursor;
    cursor += seg.value;
    return `${seg.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export default function AdminAnalyticsPage() {
  const maxBar = Math.max(...faceIndexByDay.map((d) => d.value));

  return (
    <>
      <Navbar />

      <main className="pt-20">
        <div className="px-4">
          <AdminNavbar />

          {/* User Analytics Card */}
          <div className="mx-auto mt-8 w-full max-w-[1174px] rounded-[44px] bg-[rgba(217,217,217,0.2)] p-10 shadow-[0px_4px_66.6px_0px_rgba(0,0,0,0.15)]">
            <h1 className="heading-font text-[clamp(36px,4.5vw,56px)] font-semibold text-[#111111]">
              User analytics
            </h1>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {statTiles.map((tile) => (
                <div key={tile.label} className="flex flex-col gap-3 rounded-[24px] bg-white p-7">
                  <p className="body-font flex items-center gap-2 text-[16px] text-[#737378]">
                    <span className="h-[10px] w-[10px] rounded-full bg-[#30bcc3]" />
                    {tile.label}
                  </p>
                  <p className="body-font text-[32px] font-semibold text-[#121212]">
                    {tile.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Analysis + AI Face Index */}
          <div className="mx-auto mt-8 flex w-full max-w-[1174px] flex-col gap-8 lg:flex-row">

            {/* Active Analysis Donut Chart */}
            <div className="w-full rounded-[44px] bg-[rgba(237,237,237,0.4)] p-8 shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.1)] lg:w-[391px]">
              <h2 className="body-font border-b border-[#dcdcdc] pb-4 text-center text-[24px] text-[#645e5e]">
                Active Analysis
              </h2>

              {/* Hollow cutout turns conic gradient into a donut */}
              <div className="mt-8 flex justify-center">
                <div
                  className="relative flex h-[220px] w-[220px] items-center justify-center rounded-full"
                  style={{ background: buildConicGradient(activeAnalysis) }}
                >
                  <div className="h-[120px] w-[120px] rounded-full bg-white shadow-inner" />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                {activeAnalysis.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-3">
                    <span
                      className="h-[20px] w-[20px] rounded-full"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="body-font text-[20px] text-[#645e5e]">{seg.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Face Index Bar Chart */}
            <div className="flex-1 rounded-[44px] bg-[rgba(237,237,237,0.4)] p-8 shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.1)]">
              <h2 className="body-font border-b border-[#dcdcdc] pb-4 text-center text-[24px] text-[#645e5e]">
                Ai- Face index
              </h2>
              <div className="mt-10 flex h-[220px] items-end justify-between gap-3 px-2">
                {faceIndexByDay.map((d, index) => {
                  const percentage = Math.min((d.value / maxBar) * 85, 85);
                  return (
                    <div key={`${d.day}-${index}`} className="flex flex-1 flex-col items-center gap-3">
                      <div className="relative flex h-[180px] w-[40px] items-end justify-center rounded-full bg-[#d9d9d9]">
                        <span
                          className="absolute h-[24px] w-[24px] rounded-full bg-[#30bcc3] transition-all duration-300"
                          style={{ bottom: `${percentage}%` }}
                        />
                      </div>
                      <span className="body-font text-[18px] text-[#565050]">{d.day}</span>
                    </div>
                  );
                })}
              </div>
              <p className="body-font mt-6 flex items-center justify-center gap-2 text-[18px] text-[#645e5e]">
                <span className="h-[16px] w-[16px] rounded-full bg-[#30bcc3]" />
                Average maximum face indexes
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mx-auto mb-20 mt-8 w-full max-w-[1174px] rounded-[44px] bg-[rgba(237,237,237,0.4)] p-10 shadow-[0px_4px_32.3px_0px_rgba(0,0,0,0.1)]">
            <h2 className="heading-font text-[28px] font-semibold text-[#121212]">
              Recent Activity
            </h2>
            <div className="mt-6 flex flex-col gap-5">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <p className="body-font flex items-center gap-3 text-[16px] text-[#262629]">
                    <span className="h-[10px] w-[10px] shrink-0 rounded-full bg-[#30bcc3]" />
                    {item.text}
                  </p>
                  <span className="body-font shrink-0 text-[14px] text-[#8c8c8c]">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
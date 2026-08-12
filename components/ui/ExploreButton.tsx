import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function ExploreButton({ href = "#" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="
        flex h-[62px] w-[258px] items-center justify-between
        rounded-[34px] bg-[#40b2fe] pl-8 pr-2
        transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg
      "
    >
      <span className="body-font text-[20px] text-[#eeeeee]">Explore all</span>
      <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#f4c430]">
        <ArrowUpRight className="h-5 w-5 text-black" />
      </span>
    </Link>
  );
}